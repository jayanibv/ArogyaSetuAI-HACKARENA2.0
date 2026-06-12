'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Globe, ArrowRight, Shield, Wifi, WifiOff, Mic, MapPin, FileText, Phone } from 'lucide-react';
import { useAppStore } from '../lib/store';

/**
 * AarogyaSetu AI — Splash / Landing Page
 * 
 * Premium animated entry point with:
 * - App branding and NHM logo
 * - Language grid (all 23 languages in native script)
 * - Quick feature highlights
 * - Route to /login or /dashboard based on auth state
 */

// Language tiles for the splash screen selector grid
const LANGUAGE_TILES = [
  { code: 'hi', native: 'हिन्दी', name: 'Hindi', color: 'from-orange-500 to-amber-600' },
  { code: 'bn', native: 'বাংলা', name: 'Bengali', color: 'from-green-500 to-emerald-600' },
  { code: 'ta', native: 'தமிழ்', name: 'Tamil', color: 'from-red-500 to-rose-600' },
  { code: 'te', native: 'తెలుగు', name: 'Telugu', color: 'from-blue-500 to-indigo-600' },
  { code: 'kn', native: 'ಕನ್ನಡ', name: 'Kannada', color: 'from-yellow-500 to-amber-600' },
  { code: 'ml', native: 'മലയാളം', name: 'Malayalam', color: 'from-teal-500 to-cyan-600' },
  { code: 'mr', native: 'मराठी', name: 'Marathi', color: 'from-orange-600 to-red-600' },
  { code: 'gu', native: 'ગુજરાતી', name: 'Gujarati', color: 'from-sky-500 to-blue-600' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ', name: 'Punjabi', color: 'from-amber-500 to-yellow-600' },
  { code: 'or', native: 'ଓଡ଼ିଆ', name: 'Odia', color: 'from-violet-500 to-purple-600' },
  { code: 'ur', native: 'اردو', name: 'Urdu', color: 'from-emerald-500 to-green-600' },
  { code: 'as', native: 'অসমীয়া', name: 'Assamese', color: 'from-pink-500 to-rose-600' },
  { code: 'ne', native: 'नेपाली', name: 'Nepali', color: 'from-indigo-500 to-blue-600' },
  { code: 'sd', native: 'سنڌي', name: 'Sindhi', color: 'from-lime-500 to-green-600' },
  { code: 'kok', native: 'कोंकणी', name: 'Konkani', color: 'from-fuchsia-500 to-pink-600' },
  { code: 'doi', native: 'डोगरी', name: 'Dogri', color: 'from-cyan-500 to-teal-600' },
  { code: 'ks', native: 'कॉशुर', name: 'Kashmiri', color: 'from-slate-400 to-slate-600' },
  { code: 'mai', native: 'मैथिली', name: 'Maithili', color: 'from-rose-500 to-red-600' },
  { code: 'mni', native: 'মৈতৈলোন্', name: 'Manipuri', color: 'from-purple-500 to-violet-600' },
  { code: 'brx', native: 'बड़ो', name: 'Bodo', color: 'from-stone-400 to-stone-600' },
  { code: 'sat', native: 'ᱥᱟᱱᱛᱟᱲᱤ', name: 'Santali', color: 'from-amber-600 to-orange-700' },
  { code: 'sa', native: 'संस्कृतम्', name: 'Sanskrit', color: 'from-yellow-600 to-amber-700' },
  { code: 'en', native: 'English', name: 'English', color: 'from-blue-500 to-sky-600' },
];

const FEATURES = [
  { icon: Mic, label: 'Voice Triage', desc: 'Speak symptoms in your language' },
  { icon: Shield, label: 'AI Screening', desc: 'NHM protocol severity assessment' },
  { icon: MapPin, label: 'PHC Locator', desc: 'Nearest health centre maps' },
  { icon: FileText, label: 'Referral PDF', desc: 'Printable A4 slip generator' },
];

export default function SplashPage() {
  const router = useRouter();
  const { isAuthenticated, languageCode, setLanguageCode } = useAppStore();
  const [showLanguages, setShowLanguages] = useState(true);
  const [selectedLang, setSelectedLang] = useState(languageCode || 'hi');

  // Auto-redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLanguageSelect = (code: string) => {
    setSelectedLang(code);
    setLanguageCode(code);
  };

  const handleContinue = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8"
      >
        {/* Brand Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 flex items-center justify-center shadow-2xl shadow-amber-500/30 mb-6"
        >
          <Heart className="w-10 h-10 text-white" strokeWidth={2.5} />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl sm:text-4xl font-extrabold text-center bg-gradient-to-r from-amber-200 via-orange-300 to-red-400 bg-clip-text text-transparent mb-2"
        >
          AarogyaSetu AI
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-slate-400 text-center max-w-xs font-medium mb-1"
        >
          आरोग्यसेतु एआई
        </motion.p>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-slate-500 text-center max-w-sm font-medium mb-8"
        >
          Voice-powered rural health triage for ASHA workers across India
        </motion.p>

        {/* Feature Cards */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="glass-card rounded-xl p-3 flex flex-col items-center text-center gap-2"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <f.icon className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">{f.label}</p>
                <p className="text-[10px] text-slate-500 font-medium">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Language Selector Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/60 border border-slate-800 text-sm font-bold text-amber-400 mb-4"
        >
          <Globe className="w-4 h-4" />
          <span>SELECT LANGUAGE / भाषा चुनिए</span>
        </motion.div>

        {/* Language Grid */}
        <AnimatePresence>
          {showLanguages && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg overflow-hidden mb-6"
            >
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-1">
                {LANGUAGE_TILES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all min-h-[64px] button-hover-effect ${
                      selectedLang === lang.code
                        ? 'bg-gradient-to-br ' + lang.color + ' border-white/20 text-white shadow-lg'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-base font-bold leading-tight">{lang.native}</span>
                    <span className={`text-[9px] font-medium mt-0.5 ${
                      selectedLang === lang.code ? 'text-white/80' : 'text-slate-500'
                    }`}>
                      {lang.name}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.3 }}
          onClick={handleContinue}
          className="w-full max-w-sm bg-gradient-to-r from-amber-500 to-red-600 text-slate-950 font-extrabold text-base py-4 rounded-xl shadow-lg shadow-amber-500/25 button-hover-effect flex items-center justify-center gap-2 min-h-[54px]"
        >
          <span>Continue to Login</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Footer */}
      <footer className="pb-8 pt-4 text-center">
        <p className="text-[10px] text-slate-600 font-medium">
          Ministry of Health & Family Welfare — National Health Mission
        </p>
        <p className="text-[10px] text-slate-700 mt-0.5">
          AarogyaSetu AI v1.0.0 • 23 Languages • Offline-First PWA
        </p>
      </footer>
    </div>
  );
}
