/**
 * AarogyaSetu AI — Zustand Global State Store
 * 
 * Manages application-wide state for:
 * - User session (ASHA worker profile, auth status)
 * - Triage flow (current patient, vitals, transcript, results)
 * - Sync queue (offline-first sync status)
 * - UI preferences (language, theme)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Type Definitions ────────────────────────────────────────────────

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
export type UserRole = 'asha_worker' | 'supervisor' | 'admin';

export interface AshaUser {
  id: string;
  phone: string;
  name: string;
  ashaId?: string;
  state: string;
  district: string;
  preferredLanguage: string;
  role: UserRole;
}

export interface PatientInfo {
  name: string;
  age: number;
  sex: 'M' | 'F' | 'Other';
  village: string;
  district: string;
  state: string;
  pregnancyStatus: boolean;
}

export interface Vitals {
  temperature?: number;    // °C
  spo2?: number;           // %
  heartRate?: number;      // bpm
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
}

export interface TriageResult {
  severity: Severity;
  likelyCondition: string;
  confidence: string;
  immediateActions: string[];
  redFlags: string[];
  referTo: string;
  referTimeframe: string;
  ashaNote: string;
  drugFirstAid: string | null;
  followUpDays: number;
  notifyHealthDept: boolean;
  disclaimer: string;
}

export interface TriageSession {
  id: string;
  patient: PatientInfo;
  vitals?: Vitals;
  symptomsOriginal: string;
  symptomsEnglish: string;
  languageCode: string;
  result?: TriageResult;
  photoBase64?: string;
  referralId: string;
  facilityName?: string;
  timestamp: string;
  synced: boolean;
  lat?: number;
  lng?: number;
}

export interface SyncQueueItem {
  sessionId: string;
  retryCount: number;
  lastAttempt?: string;
}

// ─── Store Interface ─────────────────────────────────────────────────

interface AppState {
  // Auth & User
  user: AshaUser | null;
  isAuthenticated: boolean;
  setUser: (user: AshaUser | null) => void;
  logout: () => void;

  // Language
  languageCode: string;
  setLanguageCode: (code: string) => void;

  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Current Triage Flow
  currentPatient: PatientInfo | null;
  currentVitals: Vitals;
  currentSymptoms: string;
  currentSymptomsEnglish: string;
  currentPhotoBase64: string | null;
  triageStep: number; // 0: patient info, 1: symptoms/voice, 2: photo, 3: results
  isTriaging: boolean;
  streamingOutput: string;
  currentResult: TriageResult | null;

  setCurrentPatient: (patient: PatientInfo | null) => void;
  setCurrentVitals: (vitals: Vitals) => void;
  setCurrentSymptoms: (symptoms: string) => void;
  setCurrentSymptomsEnglish: (symptoms: string) => void;
  appendToSymptoms: (text: string) => void;
  setCurrentPhoto: (base64: string | null) => void;
  setTriageStep: (step: number) => void;
  setIsTriaging: (val: boolean) => void;
  setStreamingOutput: (output: string) => void;
  appendStreamingOutput: (chunk: string) => void;
  setCurrentResult: (result: TriageResult | null) => void;
  resetTriageFlow: () => void;

  // Session History
  sessions: TriageSession[];
  addSession: (session: TriageSession) => void;
  markSessionSynced: (id: string) => void;
  clearSessions: () => void;

  // Sync Queue
  syncQueue: SyncQueueItem[];
  addToSyncQueue: (sessionId: string) => void;
  removeFromSyncQueue: (sessionId: string) => void;

  // Network
  isOnline: boolean;
  setIsOnline: (val: boolean) => void;
  isSyncing: boolean;
  setIsSyncing: (val: boolean) => void;
}

// ─── Store Implementation ────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({
        user: null,
        isAuthenticated: false,
        currentPatient: null,
        currentResult: null,
        streamingOutput: '',
        triageStep: 0,
      }),

      // Language — default Hindi
      languageCode: 'hi',
      setLanguageCode: (code) => set({ languageCode: code }),

      // Theme
      darkMode: true,
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      // Current Triage Flow
      currentPatient: null,
      currentVitals: {},
      currentSymptoms: '',
      currentSymptomsEnglish: '',
      currentPhotoBase64: null,
      triageStep: 0,
      isTriaging: false,
      streamingOutput: '',
      currentResult: null,

      setCurrentPatient: (patient) => set({ currentPatient: patient }),
      setCurrentVitals: (vitals) => set({ currentVitals: vitals }),
      setCurrentSymptoms: (symptoms) => set({ currentSymptoms: symptoms }),
      setCurrentSymptomsEnglish: (symptoms) => set({ currentSymptomsEnglish: symptoms }),
      appendToSymptoms: (text) => set((s) => ({
        currentSymptoms: s.currentSymptoms
          ? s.currentSymptoms + ' ' + text
          : text,
      })),
      setCurrentPhoto: (base64) => set({ currentPhotoBase64: base64 }),
      setTriageStep: (step) => set({ triageStep: step }),
      setIsTriaging: (val) => set({ isTriaging: val }),
      setStreamingOutput: (output) => set({ streamingOutput: output }),
      appendStreamingOutput: (chunk) => set((s) => ({
        streamingOutput: s.streamingOutput + chunk,
      })),
      setCurrentResult: (result) => set({ currentResult: result }),
      resetTriageFlow: () => set({
        currentPatient: null,
        currentVitals: {},
        currentSymptoms: '',
        currentSymptomsEnglish: '',
        currentPhotoBase64: null,
        triageStep: 0,
        isTriaging: false,
        streamingOutput: '',
        currentResult: null,
      }),

      // Session History (persisted offline, max 50 entries)
      sessions: [],
      addSession: (session) => set((s) => ({
        sessions: [session, ...s.sessions].slice(0, 50),
      })),
      markSessionSynced: (id) => set((s) => ({
        sessions: s.sessions.map((sess) =>
          sess.id === id ? { ...sess, synced: true } : sess
        ),
      })),
      clearSessions: () => set({ sessions: [], syncQueue: [] }),

      // Sync Queue
      syncQueue: [],
      addToSyncQueue: (sessionId) => set((s) => ({
        syncQueue: [...s.syncQueue, { sessionId, retryCount: 0 }],
      })),
      removeFromSyncQueue: (sessionId) => set((s) => ({
        syncQueue: s.syncQueue.filter((q) => q.sessionId !== sessionId),
      })),

      // Network
      isOnline: true,
      setIsOnline: (val) => set({ isOnline: val }),
      isSyncing: false,
      setIsSyncing: (val) => set({ isSyncing: val }),
    }),
    {
      name: 'aarogyasetu-store',
      partialize: (state) => ({
        // Only persist these fields to localStorage
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        languageCode: state.languageCode,
        darkMode: state.darkMode,
        sessions: state.sessions,
        syncQueue: state.syncQueue,
      }),
    }
  )
);
