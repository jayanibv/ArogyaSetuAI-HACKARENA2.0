'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LayoutDashboard, BarChart3, Database, ShieldCheck, Users, Activity, Heart, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../lib/store';

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, user, sessions } = useAppStore();

  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Calculate severity stats
  const total = sessions.length;
  const emergencyCount = sessions.filter(s => s.result?.severity === 'EMERGENCY').length;
  const highCount = sessions.filter(s => s.result?.severity === 'HIGH').length;
  const mediumCount = sessions.filter(s => s.result?.severity === 'MEDIUM').length;
  const lowCount = sessions.filter(s => s.result?.severity === 'LOW').length;

  const pct = (count: number) => {
    if (total === 0) return '0%';
    return `${Math.round((count / total) * 100)}%`;
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'EMERGENCY': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 flex flex-col justify-between">
      
      {/* Navigation Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse" />
          <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            ASHA Analytics Dashboard
          </h1>
        </div>
      </header>

      {/* Main Analytics Container */}
      <main className="max-w-6xl mx-auto w-full px-6 py-8 flex-grow space-y-8">
        
        {/* Hero Section */}
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-400" />
            System Analytics & Telemetry
          </h2>
          <p className="text-xs text-slate-400 mt-1">Real-time indicators monitoring patient triage distributions, health patterns, and offline sync counts.</p>
        </div>

        {/* Stats Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Sessions</span>
              <Activity className="w-5 h-5 text-teal-400" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">{total}</div>
            <p className="text-[10px] text-slate-500 mt-1">Total health check logs in current cycle.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase">Database Sync</span>
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">
              {total > 0 ? pct(sessions.filter(s => s.synced).length) : '100%'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Percentage of cases synced to central servers.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase">Emergency Rate</span>
              <ShieldCheck className="w-5 h-5 text-rose-400" />
            </div>
            <div className="text-3xl font-bold text-rose-400 mt-2">
              {total > 0 ? pct(emergencyCount) : '0%'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Fraction of cases triggering red flag referrals.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase">Active Workers</span>
              <Users className="w-5 h-5 text-teal-400" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">{user ? 1 : 0}</div>
            <p className="text-[10px] text-slate-500 mt-1">Total active ASHA workers in district.</p>
          </div>
        </div>

        {/* Severity Distribution & Logs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Distribution card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">Severity Case Distribution</h3>
            
            {total === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">No cases registered.</div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-red-400">EMERGENCY ({emergencyCount})</span>
                    <span>{pct(emergencyCount)}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: pct(emergencyCount) }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-orange-400">HIGH RISK ({highCount})</span>
                    <span>{pct(highCount)}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500" style={{ width: pct(highCount) }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-yellow-400">MEDIUM RISK ({mediumCount})</span>
                    <span>{pct(mediumCount)}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: pct(mediumCount) }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-green-400">LOW RISK ({lowCount})</span>
                    <span>{pct(lowCount)}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: pct(lowCount) }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Telemetry events list */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">System Events Telemetry</h3>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 font-mono text-[10px]">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No recent telemetry events.</div>
              ) : (
                sessions.slice(0, 10).map((sess) => (
                  <div key={sess.id} className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-teal-400 font-bold block">EVENT_TYPE: TRIAGE_EVALUATED</span>
                      <span className="text-slate-500">
                        Patient {sess.patient.name} evaluated. Severity: {sess.result?.severity || 'UNKNOWN'}
                      </span>
                    </div>
                    <span className="text-slate-500 shrink-0">
                      {new Date(sess.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
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
