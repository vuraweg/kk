class RateLimiter {
  private static readonly STORAGE_KEY = 'signup_rate_limit';
  private static readonly MAX_ATTEMPTS = 1;
  private static readonly BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

  private static getStoredData(): { attempts: number; firstAttempt: number; blockedUntil?: number } | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private static setStoredData(data: { attempts: number; firstAttempt: number; blockedUntil?: number }): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }

  private static clearStoredData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  static isBlocked(): boolean {
    const data = this.getStoredData();
    if (!data) return false;

    const now = Date.now();
    
    // Check if block period has expired
    if (data.blockedUntil && now >= data.blockedUntil) {
      this.clearStoredData();
      return false;
    }

    return !!data.blockedUntil;
  }

  static recordAttempt(): boolean {
    const now = Date.now();
    const data = this.getStoredData();

    if (!data) {
      // First attempt
      this.setStoredData({
        attempts: 1,
        firstAttempt: now
      });
      return true;
    }

    // Reset if more than block duration has passed since first attempt
    if (now - data.firstAttempt > this.BLOCK_DURATION) {
      this.setStoredData({
        attempts: 1,
        firstAttempt: now
      });
      return true;
    }

    // Increment attempts
    const newAttempts = data.attempts + 1;
    
    if (newAttempts >= this.MAX_ATTEMPTS) {
      // Block user
      this.setStoredData({
        attempts: newAttempts,
        firstAttempt: data.firstAttempt,
        blockedUntil: now + this.BLOCK_DURATION
      });
      return false;
    }

    this.setStoredData({
      attempts: newAttempts,
      firstAttempt: data.firstAttempt
    });
    return true;
  }

  static getTimeUntilUnblock(): number {
    const data = this.getStoredData();
    if (!data?.blockedUntil) return 0;

    const timeLeft = data.blockedUntil - Date.now();
    return Math.max(0, timeLeft);
  }

  static getFormattedTimeUntilUnblock(): string {
    const timeLeft = this.getTimeUntilUnblock();
    if (timeLeft === 0) return '';

    const minutes = Math.ceil(timeLeft / (60 * 1000));
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  static reset(): void {
    this.clearStoredData();
  }

  static getRemainingAttempts(): number {
    const data = this.getStoredData();
    if (!data) return this.MAX_ATTEMPTS;
    
    const now = Date.now();
    
    // Reset if more than block duration has passed
    if (now - data.firstAttempt > this.BLOCK_DURATION) {
      return this.MAX_ATTEMPTS;
    }

    return Math.max(0, this.MAX_ATTEMPTS - data.attempts);
  }
}

export default RateLimiter;