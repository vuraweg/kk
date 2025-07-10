import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// More detailed error handling for missing environment variables
if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  throw new Error('Supabase URL is required. Please set VITE_SUPABASE_URL in your environment variables.');
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  throw new Error('Supabase Anon Key is required. Please set VITE_SUPABASE_ANON_KEY in your environment variables.');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid VITE_SUPABASE_URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format. Please check your VITE_SUPABASE_URL environment variable.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'primojobs-web'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Add connection health check
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection healthy');
    return true;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
};

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          created_at?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          description: string;
          category: string;
          date: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          amount: number;
          description: string;
          category: string;
          date?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          amount?: number;
          description?: string;
          category?: string;
          date?: string;
          created_at?: string | null;
        };
      };
      questions: {
        Row: {
          id: string;
          company: string;
          role: string;
          category: string;
          difficulty: string;
          question_text: string;
          solution_text: string;
          code_example: string | null;
          explanation: string;
          tags: string[];
          image_url: string | null;
          price: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company: string;
          role: string;
          category: string;
          difficulty: string;
          question_text: string;
          solution_text: string;
          code_example?: string | null;
          explanation: string;
          tags?: string[];
          image_url?: string | null;
          price?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company?: string;
          role?: string;
          category?: string;
          difficulty?: string;
          question_text?: string;
          solution_text?: string;
          code_example?: string | null;
          explanation?: string;
          tags?: string[];
          image_url?: string | null;
          price?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      access_logs: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          access_start_time: string;
          access_expiry_time: string;
          payment_status: boolean;
          payment_id: string | null;
          amount_paid: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          access_start_time: string;
          access_expiry_time: string;
          payment_status?: boolean;
          payment_id?: string | null;
          amount_paid: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          access_start_time?: string;
          access_expiry_time?: string;
          payment_status?: boolean;
          payment_id?: string | null;
          amount_paid?: number;
          created_at?: string | null;
        };
      };
      materials: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          company: string | null;
          role: string | null;
          content: string;
          image_url: string;
          uploaded_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: string;
          company?: string | null;
          role?: string | null;
          content: string;
          image_url: string;
          uploaded_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          company?: string | null;
          role?: string | null;
          content?: string;
          image_url?: string;
          uploaded_at?: string | null;
        };
      };
      payment_settings: {
        Row: {
          id: string;
          base_price: number;
          currency: string;
          active_coupons: any;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          base_price?: number;
          currency?: string;
          active_coupons?: any;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          base_price?: number;
          currency?: string;
          active_coupons?: any;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
  };
}