import { RateLimitInfo } from '../types/auth';

const RATE_LIMIT_KEY = 'auth_rate_limit';
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

export class RateLimiter {
  private static getRateLimitInfo(): RateLimitInfo {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (!stored) {
      return { attempts: 0, lastAttempt: 0 };
    }
    return JSON.parse(stored);
  }

  private static saveRateLimitInfo(info: RateLimitInfo): void {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(info));
  }

  static isBlocked(): boolean {
    const info = this.getRateLimitInfo();
    const now = Date.now();

    // Check if currently blocked
    if (info.blockedUntil && now < info.blockedUntil) {
      return true;
    }

    // Reset if block period has passed
    if (info.blockedUntil && now >= info.blockedUntil) {
      this.reset();
      return false;
    }

    return false;
  }

  static recordAttempt(): boolean {
    if (this.isBlocked()) {
      return false;
    }

    const info = this.getRateLimitInfo();
    const now = Date.now();

    // Reset attempts if window has passed
    if (now - info.lastAttempt > ATTEMPT_WINDOW) {
      info.attempts = 0;
    }

    info.attempts += 1;
    info.lastAttempt = now;

    // Block if max attempts reached
    if (info.attempts >= MAX_ATTEMPTS) {
      info.blockedUntil = now + BLOCK_DURATION;
    }

    this.saveRateLimitInfo(info);
    return info.attempts < MAX_ATTEMPTS;
  }

  static reset(): void {
    localStorage.removeItem(RATE_LIMIT_KEY);
  }

  static getTimeUntilUnblock(): number {
    const info = this.getRateLimitInfo();
    if (!info.blockedUntil) return 0;
    return Math.max(0, info.blockedUntil - Date.now());
  }

  static getRemainingAttempts(): number {
    const info = this.getRateLimitInfo();
    const now = Date.now();

    // Reset if window has passed
    if (now - info.lastAttempt > ATTEMPT_WINDOW) {
      return MAX_ATTEMPTS;
    }

    return Math.max(0, MAX_ATTEMPTS - info.attempts);
  }
}