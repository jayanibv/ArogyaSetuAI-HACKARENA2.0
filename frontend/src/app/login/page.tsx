'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Phone, ArrowRight, Loader2, User, Lock, MapPin, Eye, EyeOff, Globe } from 'lucide-react';
import { useAppStore, AshaUser } from '../../lib/store';
import { registerUser, loginUser } from '../../lib/authClient';
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
  
  // Input fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Onboarding/Registration fields
  const [name, setName] = useState('');
  const [ashaId, setAshaId] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-redirect if already logged in
  const { isAuthenticated } = useAppStore();
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleAuthentication = async (e: React.FormEvent) => {
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

        if (res.success && res.user) {
          if (res.token) {
            localStorage.setItem('asha-jwt-token', res.token);
          }
          
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
          
          if (res.user.preferredLanguage) {
            setLanguageCode(res.user.preferredLanguage);
          }
          
          setUser(localUser);
          router.push('/dashboard');
        } else {
          setError(res.message || 'Registration failed');
        }
      } else {
        // Log in flow
        const res = await loginUser(formattedPhone, password);
        if (res.success && res.user) {
          if (res.token) {
            localStorage.setItem('asha-jwt-token', res.token);
          }
          
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
          
          if (res.user.preferredLanguage) {
            setLanguageCode(res.user.preferredLanguage);
          }
          
          setUser(localUser);
          router.push('/dashboard');
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

        {/* Title indicators */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-200">
            {authMode === 'login' ? 'Authentication Gate' : 'New Worker Registration'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter credentials for ASHA primary verification level
          </p>
        </div>

        {/* Inputs Form */}
        <form onSubmit={handleAuthentication} className="space-y-4">
          {/* Phone Field */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Mobile Number *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-600 font-bold text-sm">
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
                className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-2.5 text-black text-base font-semibold placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none min-h-[46px] shadow-sm"
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
                className="w-full bg-white border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-black placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none min-h-[46px] shadow-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-700"
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
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-black placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none min-h-[46px] shadow-sm"
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
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-black placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none min-h-[46px] shadow-sm"
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
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-black focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none min-h-[46px] shadow-sm"
                    required={authMode === 'register'}
                  >
                    <option value="" className="text-slate-500 bg-white">Select</option>
                    {INDIAN_STATES.map(s => (
                      <option key={s} value={s} className="text-black bg-white">{s}</option>
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
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-black placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none min-h-[46px] shadow-sm"
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
                <span>{authMode === 'login' ? 'Validate & Log In' : 'Register & Log In'}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Ambulance numbers */}
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
          <Phone className="w-3.5 h-3.5" strokeWidth={2.5} />
          Emergency 112
        </a>
        <a
          href="tel:108"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-950/30 border border-amber-900/30 text-amber-400 text-xs font-bold transition-all hover:bg-amber-950/50"
        >
          <Phone className="w-3.5 h-3.5" strokeWidth={2.5} />
          Ambulance 108
        </a>
      </motion.div>
    </div>
  );
}
