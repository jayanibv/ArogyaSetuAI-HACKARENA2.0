'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Mic, MapPin, History, ShieldAlert, Users, CloudLightning, RefreshCw, LogOut, LayoutDashboard, Wifi, WifiOff, Sparkles, Activity } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { LANGUAGES } from '../../lib/i18n';

export default function Dashboard() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    logout,
    languageCode,
    sessions,
    syncQueue,
    isOnline,
    isSyncing,
    setIsOnline,
    setIsSyncing,
    markSessionSynced,
    resetTriageFlow,
    setCurrentPatient,
    setCurrentVitals,
    setCurrentSymptoms,
    setCurrentSymptomsEnglish,
    setCurrentPhoto,
    setCurrentResult,
    setTriageStep
  } = useAppStore();

  const t = LANGUAGES[languageCode]?.translations || LANGUAGES['hi'].translations;

  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Monitor network connection status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  const handleSync = async () => {
    if (syncQueue.length === 0) return;
    setIsSyncing(true);

    // Simulate backend synchronization
    for (const item of syncQueue) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      markSessionSynced(item.sessionId);
    }

    setIsSyncing(false);
  };

  const getSeverityProps = (sev?: string) => {
    switch (sev) {
      case 'EMERGENCY': 
        return { badge: 'bg-red-100 text-red-700 border border-red-200 shadow-[0_0_12px_rgba(239,68,68,0.4)]', icon: '🚨', pulse: 'animate-pulse', bar: 'border-l-[4px] border-l-red-500' };
      case 'HIGH': 
        return { badge: 'bg-orange-100 text-orange-700 border border-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.3)]', icon: '⚠', pulse: '', bar: 'border-l-[4px] border-l-orange-500' };
      case 'MEDIUM': 
        return { badge: 'bg-amber-100 text-amber-700 border border-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]', icon: '⚠', pulse: '', bar: 'border-l-[4px] border-l-amber-500' };
      default: 
        return { badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]', icon: '✓', pulse: '', bar: 'border-l-[4px] border-l-emerald-500' };
    }
  };

  const StethoscopeHeart = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" fillOpacity="0.1" />
      <path d="M16 3c-1.3 0-2.5.6-3.2 1.5M20 7v3c0 2.2-1.8 4-4 4s-4-1.8-4-4v-1" stroke="currentColor" strokeLinecap="round" />
      <circle cx="12" cy="13" r="2" fill="currentColor" />
    </svg>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/40 to-violet-50/40 text-slate-800 font-sans pb-12">
      {/* ─── Premium Header Navigation ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <StethoscopeHeart className="w-8 h-8 text-teal-600 animate-pulse" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-teal-900">
              {t.title}
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">{t.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Emergency Contact */}
          <div className="hidden md:flex items-center gap-2 mr-2 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
            <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-rose-600 uppercase leading-none tracking-wider">Emergency</span>
              <span className="text-sm font-extrabold text-rose-700 leading-none mt-0.5">108</span>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
            isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 animate-ping" />
                <span>{t.onlineBadge}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>{t.offlineBadge}</span>
              </>
            )}
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t.logout}</span>
          </button>
        </div>
      </header>

      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        
        {/* Floating Background Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div
            animate={{ y: [0, -20, 0], opacity: [0.1, 0.3, 0.1], rotate: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="absolute top-[5%] left-[2%]"
          >
            <Heart className="w-16 h-16 text-teal-500/20" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 20, 0], opacity: [0.1, 0.2, 0.1], rotate: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
            className="absolute top-[30%] right-[35%]"
          >
            <ShieldAlert className="w-20 h-20 text-violet-400/10" />
          </motion.div>
        </div>

        {/* Left/Main Column (Stats + Actions) */}
        <div className="lg:col-span-2 space-y-8 relative z-10">
          
          {/* Welcome Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative overflow-hidden bg-gradient-to-r from-teal-800 to-teal-950 border border-teal-700/50 rounded-[20px] p-8 shadow-xl shadow-teal-900/10"
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold text-teal-200 uppercase tracking-widest">ASHA Profile</span>
                <h2 className="text-3xl font-extrabold text-white mt-1">{user.name}</h2>
                <p className="text-sm text-teal-100/80 mt-2">
                  ID: <span className="text-white font-mono">{user.ashaId || 'NHM-9321'}</span> | District: <span className="text-white">{user.district}</span> | State: <span className="text-white">{user.state}</span>
                </p>
              </div>
              
              <button
                onClick={() => {
                  resetTriageFlow();
                  router.push('/triage');
                }}
                className="relative group flex items-center justify-center gap-3 bg-white text-teal-900 hover:bg-teal-50 font-extrabold px-6 py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 text-lg border border-teal-100"
              >
                <div className="absolute inset-0 rounded-xl ring-4 ring-teal-500/30 animate-pulse pointer-events-none" />
                <Mic className="w-6 h-6 text-teal-600" />
                {t.newTriage}
              </button>
            </div>
            <div className="absolute right-0 bottom-0 w-40 h-40 bg-white/5 blur-3xl rounded-full pointer-events-none" />
          </motion.div>

          {/* Stats Panel */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 rounded-[16px] p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wide">Total Cases</span>
              <div className="text-3xl font-extrabold text-teal-900 mt-1">{sessions.length}</div>
            </div>
            <div className="bg-gradient-to-br from-white to-rose-50/50 border border-slate-200/60 rounded-[16px] p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wide">Emergencies</span>
              <div className="text-3xl font-extrabold text-red-600 mt-1">
                {sessions.filter(s => s.result?.severity === 'EMERGENCY').length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-emerald-50/50 border border-slate-200/60 rounded-[16px] p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wide">Synced</span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                {sessions.filter(s => s.synced).length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-amber-50/50 border border-slate-200/60 rounded-[16px] p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wide">Offline Queue</span>
              <div className="text-3xl font-extrabold text-amber-600 mt-1">{syncQueue.length}</div>
              {syncQueue.length === 0 && (
                <StethoscopeHeart className="absolute -right-2 -bottom-2 w-16 h-16 text-teal-600/10 rotate-12 group-hover:scale-110 transition-transform duration-300" />
              )}
            </div>
          </motion.div>

          {/* Action Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            <div
              onClick={() => router.push('/map')}
              className="bg-white border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-teal-200 hover:scale-[1.02] cursor-pointer rounded-[16px] p-5 group transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800">{t.phcLocator}</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">Find closest medical facility, contact info and travel routes.</p>
            </div>

            <div
              onClick={() => router.push('/admin')}
              className="bg-white border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-teal-200 hover:scale-[1.02] cursor-pointer rounded-[16px] p-5 group transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-4 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800">Analytics Panel</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">Access health patterns, severity metrics, and sync statistics.</p>
            </div>

            <div
              onClick={() => router.push('/settings')}
              className="bg-white border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-slate-300 hover:scale-[1.02] cursor-pointer rounded-[16px] p-5 group transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 mb-4 group-hover:scale-110 transition-transform">
                <History className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800">Profile Settings</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">Configure custom language preferences, sound, and offline storage.</p>
            </div>
          </motion.div>

        </div>

        {/* Right Column (Sync Queue & Recent Triage List) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="space-y-6 relative z-10"
        >
          
          {/* Sync Box */}
          {syncQueue.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <CloudLightning className="w-5 h-5 animate-pulse text-amber-600" />
                  <span>Pending Offline Sync ({syncQueue.length})</span>
                </div>
              </div>
              <button
                disabled={!isOnline || isSyncing}
                onClick={handleSync}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold rounded-xl shadow hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Data Now'}
              </button>
            </div>
          )}

          {/* Recent Triage Sessions */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] p-6 shadow-lg shadow-slate-200/50 flex flex-col h-full max-h-[600px]">
            <h3 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-teal-600" />
              {t.historyTitle}
            </h3>
            
            <div className="space-y-3 overflow-y-auto pr-2 -mr-2">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                    <StethoscopeHeart className="w-8 h-8 text-slate-300" />
                  </div>
                  <span className="text-sm font-semibold">No recent triage histories.</span>
                </div>
              ) : (
                sessions.map((sess) => {
                  const sevProps = getSeverityProps(sess.result?.severity);
                  return (
                    <div 
                      key={sess.id} 
                      onClick={() => {
                        setCurrentPatient(sess.patient);
                        setCurrentVitals(sess.vitals || {});
                        setCurrentSymptoms(sess.symptomsOriginal);
                        setCurrentSymptomsEnglish(sess.symptomsEnglish || '');
                        if (sess.photoBase64) setCurrentPhoto(sess.photoBase64);
                        if (sess.result) setCurrentResult(sess.result);
                        setTriageStep(3);
                        router.push('/results');
                      }}
                      className={`relative p-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-teal-300 cursor-pointer rounded-[14px] shadow-sm hover:shadow-md transition-all duration-300 group active:scale-[0.98] ${sevProps.bar} overflow-hidden`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-sm text-slate-800 group-hover:text-teal-700 transition-colors">
                          {sess.patient.name} ({sess.patient.age})
                        </span>
                        <span className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wide ${sevProps.badge}`}>
                          <span className={`${sevProps.pulse}`}>{sevProps.icon}</span>
                          {sess.result?.severity || 'LOW'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium line-clamp-1 pointer-events-none mb-3">
                        {sess.symptomsOriginal}
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pointer-events-none border-t border-slate-200/60 pt-2">
                        <span>{new Date(sess.timestamp).toLocaleDateString()}</span>
                        <span className={`flex items-center gap-1 ${sess.synced ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {sess.synced ? <CloudLightning className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                          {sess.synced ? 'Synced' : 'Local Only'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </motion.div>

      </main>
    </div>
  );
}
