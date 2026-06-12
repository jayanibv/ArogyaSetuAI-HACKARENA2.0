'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Phone, ArrowRight, ArrowLeft, Shield, CheckCircle, Loader2, User, Lock, MapPin, Eye, EyeOff, Globe } from 'lucide-react';
import { useAppStore, AshaUser } from '../../lib/store';
import { registerUser, verifyRegistrationOTP, loginUser, verifyLoginOTP } from '../../lib/authClient';
import { LANGUAGES } from '../../lib/i18n';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Jammu & Kashmir', 'Ladakh', 'Delhi', 'Puducherry', 'Chandigarh',
  'Andaman & Nicobar', 'Dadra & Nagar Haveli', 'Daman & Diu', 'Lakshadweep',
];

export default function LoginPage() {
  const router = useRouter();
  const { setUser, languageCode, setLanguageCode } = useAppStore();
  const t = LANGUAGES[languageCode]?.translations || LANGUAGES['hi'].translations;

  // View state: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Verification step: 'input' | 'otp'
  const [step, setStep] = useState<'input' | 'otp'>('input');
  
  // Input fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Onboarding/Registration fields
  const [name, setName] = useState('');
  const [ashaId, setAshaId] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-redirect if already logged in
  const { isAuthenticated } = useAppStore();
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleFirstLevelAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    if (authMode === 'register') {
      if (!name || !state || !district) {
        setError('Please fill out all required profile fields (*)');
        return;
      }
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');
    setDevOtpHint(null);

    const formattedPhone = phone.startsWith('+91') ? phone : '+91' + phone;

    try {
      if (authMode === 'register') {
        const res = await registerUser({
          phone: formattedPhone,
          password: password,
          name,
          state,
          district,
          asha_id: ashaId || undefined,
          preferred_language: languageCode
        });

        if (res.success) {
          setSuccessMsg('First level verification successful. OTP sent!');
          setStep('otp');
          if (res.dev_otp) {
            setDevOtpHint(res.dev_otp);
          }
        } else {
          setError(res.message || 'Registration failed');
        }
      } else {
        // Log in flow
        const res = await loginUser(formattedPhone, password);
        if (res.success) {
          setSuccessMsg('Password verified. OTP sent for verification!');
          setStep('otp');
          if (res.dev_otp) {
            setDevOtpHint(res.dev_otp);
          }
        } else {
          setError(res.message || 'Incorrect credentials or user not found');
        }
      }
    } catch (err: any) {
      setError('Failed to reach authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    setError('');
    const formattedPhone = phone.startsWith('+91') ? phone : '+91' + phone;

    try {
      let res;
      if (authMode === 'register') {
        res = await verifyRegistrationOTP(formattedPhone, otp);
      } else {
        res = await verifyLoginOTP(formattedPhone, otp);
      }

      if (res.success && res.user) {
        // Save token to localStorage / state
        if (res.token) {
          localStorage.setItem('asha-jwt-token', res.token);
        }
        
        // Save user to state
        const localUser: AshaUser = {
          id: res.user.phone,
          phone: res.user.phone,
          name: res.user.name,
          ashaId: res.user.ashaId,
          state: res.user.state,
          district: res.user.district,
          preferredLanguage: res.user.preferredLanguage,
          role: 'asha_worker'
        };
        
        // Update store language if user had preferred
        if (res.user.preferredLanguage) {
          setLanguageCode(res.user.preferredLanguage);
        }
        
        setUser(localUser);
        router.push('/dashboard');
      } else {
        setError(res.message || 'OTP verification failed');
      }
    } catch (err: any) {
      setError('OTP verification failed due to network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center px-6 py-12">
      {/* Language Quick Toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5 text-xs text-slate-400">
        <Globe className="w-3.5 h-3.5 text-amber-500" />
        <select
          value={languageCode}
          onChange={(e) => setLanguageCode(e.target.value)}
          className="bg-transparent text-slate-200 border-none outline-none focus:ring-0 cursor-pointer font-bold"
        >
          <option value="en" className="bg-slate-900">English</option>
          <option value="hi" className="bg-slate-900">हिन्दी (Hindi)</option>
          <option value="kn" className="bg-slate-900">ಕನ್ನಡ (Kannada)</option>
          <option value="ta" className="bg-slate-900">தமிழ் (Tamil)</option>
          <option value="te" className="bg-slate-900">తెలుగు (Telugu)</option>
        </select>
      </div>

      {/* Header Banner */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-amber-200 to-red-400 bg-clip-text text-transparent">
            AarogyaSetu AI
          </h1>
          <p className="text-xs text-slate-500 font-medium">ASHA Portal • Primary Health Triage</p>
        </div>
      </motion.div>

      {/* Main Form Panel */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6"
      >
        {/* Toggle Mode Tab */}
        {step === 'input' && (
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setAuthMode('login'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ASHA Log In
            </button>
            <button
              onClick={() => { setAuthMode('register'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up / Onboard
            </button>
          </div>
        )}

        {/* Title indicators */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-200">
            {step === 'input'
              ? (authMode === 'login' ? 'Authentication Gate' : 'New Worker Registration')
              : 'Secondary Level Authentication'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {step === 'input'
              ? 'Enter credentials for ASHA primary verification level'
              : `Enter 6-digit OTP code sent to +91 ${phone}`}
          </p>
        </div>

        {/* Level 1 Inputs Form */}
        {step === 'input' ? (
          <form onSubmit={handleFirstLevelAuth} className="space-y-4">
            {/* Phone Field */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Mobile Number *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-500 font-bold text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    setError('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-2.5 text-slate-100 text-base font-semibold placeholder-slate-700 focus:border-amber-500 focus:outline-none min-h-[46px]"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-slate-100 placeholder-slate-700 focus:border-amber-500 focus:outline-none min-h-[46px]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Registration specific fields */}
            {authMode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-2 border-t border-slate-800"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Smt. Kamala Devi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-700 focus:border-amber-500 focus:outline-none min-h-[46px]"
                    required={authMode === 'register'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    ASHA ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ASHA-10928"
                    value={ashaId}
                    onChange={(e) => setAshaId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-700 focus:border-amber-500 focus:outline-none min-h-[46px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                      State *
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:border-amber-500 focus:outline-none min-h-[46px]"
                      required={authMode === 'register'}
                    >
                      <option value="">Select</option>
                      {INDIAN_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                      District *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramanagara"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-700 focus:border-amber-500 focus:outline-none min-h-[46px]"
                      required={authMode === 'register'}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <p className="text-xs text-red-400 font-bold text-center bg-red-950/20 py-2 rounded-lg border border-red-900/30">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || phone.length < 10 || password.length < 4}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-extrabold text-base py-3.5 rounded-xl shadow-lg shadow-amber-500/15 button-hover-effect flex items-center justify-center gap-2 min-h-[50px] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{authMode === 'login' ? 'Validate Credentials' : 'Verify & Send OTP'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: OTP Entry */
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="flex flex-col items-center justify-center">
              <Shield className="w-12 h-12 text-emerald-400 mb-2" />
              <p className="text-xs text-slate-400 text-center">
                OTP code has been dispatched. Enter the 6 digits below.
              </p>
            </div>

            <input
              type="tel"
              inputMode="numeric"
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-3xl font-extrabold placeholder-slate-800 focus:border-emerald-500 focus:outline-none min-h-[58px] tracking-[0.6em] text-center"
              autoFocus
              required
            />

            {devOtpHint && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Developer Mode Active
                </span>
                <span className="text-sm font-extrabold text-slate-200">
                  Dev OTP: <span className="font-mono text-amber-300 underline select-all">{devOtpHint}</span>
                </span>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400 font-bold text-center bg-red-950/20 py-2 rounded-lg border border-red-900/30">
                {error}
              </p>
            )}

            {successMsg && !error && (
              <p className="text-xs text-emerald-400 font-bold text-center bg-emerald-950/20 py-1.5 rounded-lg border border-emerald-900/20">
                {successMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-extrabold text-base py-3.5 rounded-xl shadow-lg shadow-emerald-500/15 button-hover-effect flex items-center justify-center gap-2 min-h-[50px] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Verify OTP Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setStep('input'); setOtp(''); setError(''); }}
              className="w-full text-slate-400 hover:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 py-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back / Change details
            </button>
          </form>
        )}
      </motion.div>

      {/* Ambulance Emergency numbers */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 flex gap-3 text-center"
      >
        <a
          href="tel:112"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-950/30 border border-red-900/30 text-red-400 text-xs font-bold transition-all hover:bg-red-950/50"
        >
          <Phone className="w-3.5 h-3.5" />
          Emergency 112
        </a>
        <a
          href="tel:108"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-950/30 border border-amber-900/30 text-amber-400 text-xs font-bold transition-all hover:bg-amber-950/50"
        >
          <Phone className="w-3.5 h-3.5" />
          Ambulance 108
        </a>
      </motion.div>
    </div>
  );
}
