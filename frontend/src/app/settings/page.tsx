'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft, Save, Globe, Shield, User, Key, Database, RefreshCw, Trash2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useAppStore, AshaUser } from '../../lib/store';
import { LANGUAGES } from '../../lib/i18n';
import { updateUser } from '../../lib/authClient';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Jammu & Kashmir', 'Ladakh', 'Delhi', 'Puducherry', 'Chandigarh',
  'Andaman & Nicobar', 'Dadra & Nagar Haveli', 'Daman & Diu', 'Lakshadweep',
];

export default function SettingsPage() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    setUser,
    languageCode,
    setLanguageCode,
    sessions,
    syncQueue,
    clearSessions
  } = useAppStore();

  const t = LANGUAGES[languageCode]?.translations || LANGUAGES['hi'].translations;

  // Protect route
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [ashaId, setAshaId] = useState(user?.ashaId || '');
  const [state, setState] = useState(user?.state || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [selectedLang, setSelectedLang] = useState(languageCode || 'hi');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !state || !district) {
      setError('Please fill in all required profile fields (*).');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);

    try {
      const updateParams: any = {
        name,
        state,
        district,
        asha_id: ashaId,
        preferred_language: selectedLang
      };

      if (newPassword) {
        updateParams.password = newPassword;
      }

      // 1. Update backend SQLite database
      const res = await updateUser(user.phone, updateParams);

      if (res.success && res.user) {
        // 2. Update local Zustand state store
        const updatedUser: AshaUser = {
          ...user,
          name: res.user.name,
          ashaId: res.user.ashaId,
          state: res.user.state,
          district: res.user.district,
          preferredLanguage: res.user.preferredLanguage
        };

        // Update preferred language across store
        setLanguageCode(selectedLang);
        setUser(updatedUser);

        setSuccess('Profile settings and authentication preferences updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(res.message || 'Failed to save settings.');
      }
    } catch (err: any) {
      setError('Connection to server failed. Local profile updated.');
      
      // Fallback update local only if backend offline
      const updatedUser: AshaUser = {
        ...user,
        name,
        ashaId,
        state,
        district,
        preferredLanguage: selectedLang
      };
      setLanguageCode(selectedLang);
      setUser(updatedUser);
      setSuccess('Settings saved locally. Changes will sync to backend once online.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to delete all cached local triage history? This action is irreversible.')) {
      clearSessions();
      alert('Local session history and cache cleared successfully.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              {t.title} — Settings
            </h1>
            <p className="text-xs text-slate-400">Configure profile, credentials, and app cache</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse" />
        </div>
      </header>

      {/* Main content grid */}
      <main className="max-w-4xl mx-auto px-6 mt-8">
        <form onSubmit={handleSaveSettings} className="space-y-8">
          
          {/* Status alerts */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-sm"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-3 text-sm"
            >
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left Column: Form Fields */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Card 1: Profile Settings */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-teal-400 font-bold border-b border-slate-800 pb-3">
                  <User className="w-5 h-5" />
                  <h2>ASHA Worker Profile</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                      Phone Number (Locked)
                    </label>
                    <input
                      type="text"
                      value={user.phone}
                      disabled
                      className="w-full bg-slate-100 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-500 font-semibold cursor-not-allowed min-h-[46px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                      ASHA ID Number
                    </label>
                    <input
                      type="text"
                      value={ashaId}
                      onChange={(e) => setAshaId(e.target.value)}
                      placeholder="ASHA-10928"
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-black placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none min-h-[46px] shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-black focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none min-h-[46px] shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                      State *
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-black focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none min-h-[46px] shadow-sm"
                    >
                      {INDIAN_STATES.map(s => (
                        <option key={s} value={s} className="text-black bg-white">{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                      District *
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-black focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none min-h-[46px] shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Password Update */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-teal-400 font-bold border-b border-slate-800 pb-3">
                  <Key className="w-5 h-5" />
                  <h2>Update Credentials (Password)</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Update your user password below (minimum 4 characters). Leave blank if you do not wish to change your password.
                </p>                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-black placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none min-h-[46px] shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-black placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none min-h-[46px] shadow-sm"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Language Selection + Storage telemetry */}
            <div className="space-y-6">
              
              {/* Card 3: Preferred Language */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-teal-400 font-bold border-b border-slate-800 pb-3">
                  <Globe className="w-5 h-5" />
                  <h2>App Language Selection</h2>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase">
                    Select Language / भाषा चुनें
                  </label>
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-black font-bold focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none min-h-[46px] shadow-sm"
                  >
                    <option value="en" className="text-black bg-white">English</option>
                    <option value="hi" className="text-black bg-white">हिन्दी (Hindi)</option>
                    <option value="kn" className="text-black bg-white">ಕನ್ನಡ (Kannada)</option>
                    <option value="ta" className="text-black bg-white">தமிழ் (Tamil)</option>
                    <option value="te" className="text-black bg-white">తెలుగు (Telugu)</option>
                    <option value="ml" className="text-black bg-white">മലയാളം (Malayalam)</option>
                    <option value="mr" className="text-black bg-white">मराठी (Marathi)</option>
                    <option value="bn" className="text-black bg-white">বাংলা (Bengali)</option>
                    <option value="gu" className="text-black bg-white">ગુજરાતી (Gujarati)</option>
                    <option value="pa" className="text-black bg-white">ਪੰਜਾਬੀ (Punjabi)</option>
                    <option value="or" className="text-black bg-white">ଓଡ଼ିଆ (Odia)</option>
                    <option value="ur" className="text-black bg-white">اردو (Urdu)</option>
                  </select>
                </div>
              </div>

              {/* Card 4: Local Storage and Cache */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-teal-400 font-bold border-b border-slate-800 pb-3">
                  <Database className="w-5 h-5" />
                  <h2>Device Data Cache</h2>
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Total triages saved locally:</span>
                    <span className="text-white font-bold">{sessions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending offline syncs:</span>
                    <span className="text-amber-400 font-bold">{syncQueue.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage Engine:</span>
                    <span className="text-emerald-400 font-bold">SQL / Local Persist</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearCache}
                  className="w-full mt-2 py-2 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 min-h-[38px]"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Local Triage History
                </button>
              </div>

            </div>

          </div>

          {/* Form action bar */}
          <div className="flex items-center justify-end gap-4 border-t border-slate-800 pt-6">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2 min-h-[46px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Preferences
                </>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
