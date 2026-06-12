'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft, ShieldAlert, Download, MapPin, Play, RefreshCw, Printer, AlertOctagon, CheckCircle2, AlertTriangle, FileText, Activity } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { LANGUAGES } from '../../lib/i18n';

export default function ResultsPage() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    languageCode,
    currentPatient,
    currentVitals,
    currentSymptoms,
    currentSymptomsEnglish,
    currentResult,
    sessions,
    resetTriageFlow,
    isOnline
  } = useAppStore();

  const t = LANGUAGES[languageCode]?.translations || LANGUAGES['hi'].translations;
  const [pdfLoading, setPdfLoading] = useState(false);

  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!currentPatient || !currentResult) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <AlertOctagon className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold">No Active Triage Result</h2>
        <p className="text-sm text-slate-400 mt-2">Start a new triage session from the dashboard first.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-xl"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const requestBody = {
      patient_name: currentPatient.name,
      patient_age: currentPatient.age,
      patient_sex: currentPatient.sex,
      village: currentPatient.village,
      district: currentPatient.district || user?.district || 'District',
      state: currentPatient.state || user?.state || 'State',
      language_code: languageCode,
      symptoms_original: currentSymptoms,
      symptoms_english: currentSymptomsEnglish || currentSymptoms,
      triage_result: {
        severity: currentResult.severity,
        likely_condition: currentResult.likelyCondition,
        confidence: currentResult.confidence,
        immediate_actions: currentResult.immediateActions,
        red_flags: currentResult.redFlags,
        refer_to: currentResult.referTo,
        refer_timeframe: currentResult.referTimeframe,
        asha_note: currentResult.ashaNote,
        drug_first_aid: currentResult.drugFirstAid,
        follow_up_days: currentResult.followUpDays,
        notify_health_dept: currentResult.notifyHealthDept
      },
      facility: {
        name: currentResult.referTo,
        type: 'PHC',
        state: user?.state || 'State',
        district: user?.district || 'District',
        address: 'Nearest government health center',
        phone: '108 / 112',
        lat: 12.97,
        lng: 77.59
      },
      asha_name: user?.name || 'ASHA Worker',
      asha_id: user?.ashaId || 'NHM-9321',
      asha_phone: user?.phone || '9999999999'
    };

    try {
      const response = await fetch(`${backendUrl}/api/referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `referral_slip_${currentPatient.name}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error("Failed to compile PDF from backend router");
      }
    } catch (err) {
      console.warn("Backend PDF generation failed. Falling back to local client print mode.", err);
      window.print();
    } finally {
      setPdfLoading(false);
    }
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'EMERGENCY':
        return {
          bg: 'bg-red-500/10 border border-red-500/30',
          text: 'text-red-400',
          badge: 'bg-red-500 text-slate-950',
          glow: 'shadow-red-500/10',
          icon: AlertOctagon,
          title: 'Emergency Care Needed / आपातकालीन सेवा'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/10 border border-orange-500/30',
          text: 'text-orange-400',
          badge: 'bg-orange-500 text-slate-950',
          glow: 'shadow-orange-500/10',
          icon: ShieldAlert,
          title: 'High Risk / उच्च प्राथमिकता'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-500/10 border border-yellow-500/30',
          text: 'text-yellow-400',
          badge: 'bg-yellow-500 text-slate-950',
          glow: 'shadow-yellow-500/10',
          icon: AlertTriangle,
          title: 'Medium Risk / मध्यम प्राथमिकता'
        };
      default:
        return {
          bg: 'bg-emerald-500/10 border border-emerald-500/30',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500 text-slate-950',
          glow: 'shadow-emerald-500/10',
          icon: CheckCircle2,
          title: 'Low Risk / सामान्य स्वास्थ्य'
        };
    }
  };

  const sevStyle = getSeverityStyle(currentResult.severity);
  const SeverityIcon = sevStyle.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 print:bg-white print:text-black">
      
      {/* Navigation Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => {
            resetTriageFlow();
            router.push('/dashboard');
          }}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        <span className="text-sm font-semibold text-teal-400">Triage Summary</span>
      </header>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Triage Results Outcomes (Left side, covers 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Risk Status card */}
          <div className={`rounded-2xl p-6 ${sevStyle.bg} ${sevStyle.glow} shadow-xl flex items-center gap-5 relative overflow-hidden`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${sevStyle.badge} shrink-0 animate-pulse`}>
              <SeverityIcon className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-75">{t.severityLabel}</span>
              <h2 className={`text-2xl font-black mt-0.5 uppercase tracking-wide`}>
                {currentResult.severity} RISK
              </h2>
              <p className="text-xs text-slate-300 mt-1">{sevStyle.title}</p>
            </div>

            <div className="absolute right-0 bottom-0 w-32 h-32 bg-slate-500/5 blur-3xl rounded-full pointer-events-none" />
          </div>

          {/* Likely Diagnosis & actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Likely Clinical Condition</span>
              <h3 className="text-xl font-bold text-white mt-1">{currentResult.likelyCondition}</h3>
              <p className="text-xs text-slate-400 mt-2">Confidence level estimated at {currentResult.confidence}.</p>
            </div>

            <hr className="border-slate-850" />

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {t.actionSteps}
              </h4>
              <ul className="space-y-2">
                {currentResult.immediateActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {currentResult.redFlags.length > 0 && (
              <>
                <hr className="border-slate-850" />
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Critical Red Flags to Watch
                  </h4>
                  <ul className="space-y-2">
                    {currentResult.redFlags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-rose-300">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-2 shrink-0" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Emergency alert banner */}
          {currentResult.severity === 'EMERGENCY' && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-5 rounded-2xl flex items-start gap-3.5">
              <AlertOctagon className="w-6 h-6 text-red-500 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <span className="text-sm font-bold text-white">{t.emergencyBanner}</span>
                <p className="text-xs text-red-400/90 mt-1">Please secure emergency rural transit. Dial 108 or 112 immediately. Inform supervisor.</p>
              </div>
            </div>
          )}

        </div>

        {/* Demographics, Vitals & routing (Right side, covers 1 column) */}
        <div className="space-y-6">
          
          {/* Patient summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              Beneficiary Profile
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Name:</span>
                <span className="text-white font-medium">{currentPatient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Age / Sex:</span>
                <span className="text-white font-medium">{currentPatient.age} yrs / {currentPatient.sex}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Village:</span>
                <span className="text-white font-medium">{currentPatient.village}</span>
              </div>
              {currentPatient.pregnancyStatus && (
                <div className="flex justify-between text-pink-400">
                  <span>Pregnancy:</span>
                  <span className="font-bold">Active</span>
                </div>
              )}
            </div>
          </div>

          {/* Vitals summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              Captured Vitals
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Temperature:</span>
                <span className="text-white font-medium">
                  {currentVitals.temperature ? `${currentVitals.temperature}°C` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SpO2 (Oxygen):</span>
                <span className={`font-bold ${currentVitals.spo2 && currentVitals.spo2 < 94 ? 'text-red-400' : 'text-white'}`}>
                  {currentVitals.spo2 ? `${currentVitals.spo2}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Heart Rate:</span>
                <span className="text-white font-medium">
                  {currentVitals.heartRate ? `${currentVitals.heartRate} bpm` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Blood Pressure:</span>
                <span className="text-white font-medium">
                  {currentVitals.bloodPressureSystolic && currentVitals.bloodPressureDiastolic 
                    ? `${currentVitals.bloodPressureSystolic}/${currentVitals.bloodPressureDiastolic} mmHg`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* First aid and routing */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Referral Outpost</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Facility:</span>
                <span className="text-white font-medium">{currentResult.referTo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timeframe:</span>
                <span className="text-rose-400 font-bold">{currentResult.referTimeframe}</span>
              </div>
              {currentResult.drugFirstAid && (
                <div className="space-y-1 pt-2">
                  <span className="text-xs text-slate-400 block font-semibold">Immediate First Aid Supplement:</span>
                  <p className="text-xs text-teal-300 font-medium bg-teal-500/10 p-2.5 rounded-lg border border-teal-500/20">
                    {currentResult.drugFirstAid}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* Bottom Action buttons */}
      <div className="max-w-6xl mx-auto px-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => {
            resetTriageFlow();
            router.push('/dashboard');
          }}
          className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all active:scale-95"
        >
          Return to Dashboard
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => router.push('/map')}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-slate-200 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <MapPin className="w-4 h-4 text-teal-400" />
            <span>{t.phcLocator}</span>
          </button>

          <button
            disabled={pdfLoading}
            onClick={handleDownloadPDF}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {pdfLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{t.referralSlip}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
