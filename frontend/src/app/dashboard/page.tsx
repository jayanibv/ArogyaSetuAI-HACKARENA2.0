'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Mic, MapPin, History, ShieldAlert, Users, CloudLightning, RefreshCw, LogOut, LayoutDashboard, Wifi, WifiOff } from 'lucide-react';
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

  const getSeverityColor = (sev?: string) => {
    switch (sev) {
      case 'EMERGENCY': return 'bg-red-500/20 text-red-400 border border-red-500/35';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border border-orange-500/35';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/35';
      default: return 'bg-green-500/20 text-green-400 border border-green-500/35';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* ─── Premium Header Navigation ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="w-8 h-8 text-rose-500 fill-rose-500 animate-pulse" />
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              {t.title}
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">{t.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
            isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 animate-pulse" />
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
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t.logout}</span>
          </button>
        </div>
      </header>

      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Main Column (Stats + Actions) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Welcome Card */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 border border-slate-800 rounded-2xl p-6">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">ASHA Profile</span>
                <h2 className="text-3xl font-extrabold text-white mt-1">{user.name}</h2>
                <p className="text-sm text-slate-400 mt-2">
                  ID: <span className="text-slate-200 font-mono">{user.ashaId || 'NHM-9321'}</span> | District: <span className="text-slate-200">{user.district}</span> | State: <span className="text-slate-200">{user.state}</span>
                </p>
              </div>
              
              <button
                onClick={() => {
                  resetTriageFlow();
                  router.push('/triage');
                }}
                className="flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold px-6 py-4 rounded-xl shadow-lg hover:shadow-teal-500/20 active:scale-95 transition-all text-lg"
              >
                <Mic className="w-6 h-6 animate-pulse" />
                {t.newTriage}
              </button>
            </div>
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full pointer-events-none" />
          </div>

          {/* Stats Panel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 text-xs font-medium">Total Cases</span>
              <div className="text-2xl font-bold text-white mt-1">{sessions.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 text-xs font-medium">Emergencies</span>
              <div className="text-2xl font-bold text-rose-400 mt-1">
                {sessions.filter(s => s.result?.severity === 'EMERGENCY').length}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 text-xs font-medium">Synced</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {sessions.filter(s => s.synced).length}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 text-xs font-medium">Offline Queue</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">{syncQueue.length}</div>
            </div>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div
              onClick={() => router.push('/map')}
              className="bg-slate-900 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-850 cursor-pointer rounded-xl p-5 group transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white">{t.phcLocator}</h3>
              <p className="text-xs text-slate-400 mt-2">Find closest medical facility, contact info and travel routes.</p>
            </div>

            <div
              onClick={() => router.push('/admin')}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-850 cursor-pointer rounded-xl p-5 group transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white">Analytics Panel</h3>
              <p className="text-xs text-slate-400 mt-2">Access health patterns, severity metrics, and sync statistics.</p>
            </div>

            <div
              onClick={() => router.push('/settings')}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 cursor-pointer rounded-xl p-5 group transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 mb-4 group-hover:scale-110 transition-transform">
                <History className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white">Profile Settings</h3>
              <p className="text-xs text-slate-400 mt-2">Configure custom language preferences, sound, and offline storage.</p>
            </div>
          </div>

        </div>

        {/* Right Column (Sync Queue & Recent Triage List) */}
        <div className="space-y-8">
          
          {/* Sync Box */}
          {syncQueue.length > 0 && (
            <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <CloudLightning className="w-5 h-5 animate-pulse" />
                  <span>Pending Offline Sync ({syncQueue.length})</span>
                </div>
              </div>
              <button
                disabled={!isOnline || isSyncing}
                onClick={handleSync}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Data Now'}
              </button>
            </div>
          )}

          {/* Recent Triage Sessions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">{t.historyTitle}</h3>
            
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No recent triage histories.</div>
              ) : (
                sessions.map((sess) => (
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
                    className="p-3 bg-slate-950 border border-slate-850 hover:border-teal-500/40 hover:bg-slate-900/60 cursor-pointer rounded-xl space-y-2 transition-all group active:scale-95"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-200 group-hover:text-teal-400 transition-colors">
                        {sess.patient.name} ({sess.patient.age})
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getSeverityColor(sess.result?.severity)}`}>
                        {sess.result?.severity || 'LOW'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-1 pointer-events-none">
                      {sess.symptomsOriginal}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 pointer-events-none">
                      <span>{new Date(sess.timestamp).toLocaleDateString()}</span>
                      <span className={sess.synced ? 'text-emerald-400' : 'text-amber-400'}>
                        {sess.synced ? 'Synced' : 'Local Only'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
