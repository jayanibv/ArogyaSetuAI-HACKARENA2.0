/**
 * AarogyaSetu AI — Backend Authentication Client
 * 
 * Interacts with the backend SQLite database + OTP authentication API.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface RegisterParams {
  phone: string;
  password_hash?: string; // we send user-defined plain password, backend hashes it
  password?: string;
  name: string;
  state: string;
  district: string;
  asha_id?: string;
  preferred_language?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  phone?: string;
  dev_otp?: string;
  user?: {
    phone: string;
    name: string;
    ashaId?: string;
    state: string;
    district: string;
    preferredLanguage: string;
    role: string;
  };
}

/**
 * Initiates user registration (Level 1: Phone + Password).
 * Backend sends OTP (Level 2).
 */
export async function registerUser(params: RegisterParams): Promise<AuthResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: params.phone,
        password: params.password,
        name: params.name,
        state: params.state,
        district: params.district,
        asha_id: params.asha_id || null,
        preferred_language: params.preferred_language || 'hi'
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.detail || 'Registration failed' };
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection to server failed' };
  }
}

/**
 * Verifies the OTP sent during user registration.
 */
export async function verifyRegistrationOTP(phone: string, otp: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/register/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.detail || 'OTP verification failed' };
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err.message || 'Verification failed' };
  }
}

/**
 * Initiates user login (Level 1: Password check).
 * If valid, backend sends OTP (Level 2).
 */
export async function loginUser(phone: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.detail || 'Login failed' };
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection to server failed' };
  }
}

/**
 * Verifies the OTP sent during user login.
 */
export async function verifyLoginOTP(phone: string, otp: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.detail || 'OTP verification failed' };
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err.message || 'Verification failed' };
  }
}

/**
 * Updates ASHA worker profile and credentials on the backend.
 */
export async function updateUser(phone: string, params: Partial<RegisterParams>): Promise<AuthResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone,
        password: params.password || null,
        name: params.name || null,
        state: params.state || null,
        district: params.district || null,
        asha_id: params.asha_id || null,
        preferred_language: params.preferred_language || null
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.detail || 'Failed to update profile' };
    }
    return data;
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection to server failed' };
  }
}
