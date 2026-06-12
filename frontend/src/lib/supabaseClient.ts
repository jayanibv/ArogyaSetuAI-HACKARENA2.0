/**
 * AarogyaSetu AI — Supabase Client Initialisation
 * 
 * Provides a singleton Supabase client for authentication (phone OTP),
 * database operations, and real-time subscriptions.
 * Falls back gracefully when env vars are not configured (local dev mode).
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate configuration — allow app to run without Supabase in dev mode
const isConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

let supabase: SupabaseClient | null = null;

if (isConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Returns the Supabase client instance.
 * Returns null if Supabase is not configured (local dev mode).
 */
export function getSupabase(): SupabaseClient | null {
  return supabase;
}

/**
 * Checks if Supabase is properly configured.
 */
export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

/**
 * Send OTP to phone number for ASHA worker login.
 * Returns { success, error } — in dev mode, simulates success.
 */
export async function sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured || !supabase) {
    // Dev mode: simulate OTP send
    console.log(`[DEV MODE] OTP sent to ${phone.slice(0, 4)}****`);
    return { success: true };
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'OTP send failed' };
  }
}

/**
 * Verify OTP token for ASHA worker login.
 * Returns { success, session, error }.
 */
export async function verifyOTP(
  phone: string,
  token: string
): Promise<{ success: boolean; session?: any; error?: string }> {
  if (!isConfigured || !supabase) {
    // Dev mode: accept any 6-digit OTP
    if (token.length === 6 && /^\d{6}$/.test(token)) {
      console.log(`[DEV MODE] OTP verified for ${phone.slice(0, 4)}****`);
      return {
        success: true,
        session: {
          user: {
            id: 'dev-user-' + Date.now(),
            phone,
            role: 'asha_worker',
          },
        },
      };
    }
    return { success: false, error: 'Invalid OTP. Enter 6 digits.' };
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) return { success: false, error: error.message };
    return { success: true, session: data.session };
  } catch (e: any) {
    return { success: false, error: e.message || 'OTP verification failed' };
  }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
}

export default supabase;
