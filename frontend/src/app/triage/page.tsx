'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowLeft, ArrowRight, Mic, MicOff, Camera, RefreshCw, AlertTriangle, Thermometer, Activity, User, Home, FileText, Check } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { LANGUAGES } from '../../lib/i18n';
import { executeTranslationPipeline } from '../../lib/i18n/translate';

// Quick select symptom tags in local scripts for ASHA workers
const QUICK_SYMPTOMS: Record<string, string[]> = {
  hi: ["बुखार", "सिरदर्द", "दस्त", "उल्टी", "दौरे", "बेहोश", "सांस लेने में तकलीफ", "सांप का काटना", "पेट दर्द", "गर्भावस्था की समस्या"],
  kn: ["ಜ್ವರ", "ತಲೆನೋವು", "ಭೇದಿ", "ವಾಂತಿ", "ಆಕ್ಷೇಪ", "ಪ್ರಜ್ಞೆ ತಪ್ಪುವುದು", "ಉಸಿರಾಟದ ತೊಂದರೆ", "ಹಾವು ಕಡಿತ", "ಹೊಟ್ಟೆ ನೋವು", "ಗರ್ಭಾವಸ್ಥೆಯ ತೊಂದರೆ"],
  ta: ["காய்ச்சல்", "தலைவலி", "வயிற்றுப்போக்கு", "வாந்தி", "வலிப்பு", "மயக்கம்", "மூச்சுத் திணறல்", "பாம்பு கடி", "வயிற்று வலி", "கர்ப்ப கால பிரச்சனை"],
  te: ["జ్వరం", "తలనొప్పి", "విరేచనాలు", "వాంతి", "మూర్ఛ", "స్పృహ కోల్పోవడం", "శ్వాస ఇబ్బంది", "పాము కాటు", "కడుపు నొప్పి", "గర్భధారణ సమస్య"],
  en: ["fever", "headache", "diarrhea", "vomiting", "convulsion", "unconscious", "breathing difficulty", "snake bite", "stomach pain", "pregnancy complication"]
};

export default function TriagePage() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    languageCode,
    currentPatient,
    currentVitals,
    currentSymptoms,
    currentPhotoBase64,
    triageStep,
    isTriaging,
    setCurrentPatient,
    setCurrentVitals,
    setCurrentSymptoms,
    appendToSymptoms,
    setCurrentPhoto,
    setTriageStep,
    setIsTriaging,
    setCurrentResult,
    setStreamingOutput,
    addSession,
    addToSyncQueue,
    isOnline
  } = useAppStore();

  const t = LANGUAGES[languageCode]?.translations || LANGUAGES['hi'].translations;
  const langConfig = LANGUAGES[languageCode] || LANGUAGES['hi'];

  // Form states
  const [name, setName] = useState(currentPatient?.name || '');
  const [age, setAge] = useState(currentPatient?.age?.toString() || '');
  const [sex, setSex] = useState<'M' | 'F' | 'Other'>(currentPatient?.sex || 'F');
  const [village, setVillage] = useState(currentPatient?.village || '');
  const [pregnancyStatus, setPregnancyStatus] = useState(currentPatient?.pregnancyStatus || false);

  // Vitals states
  const [temp, setTemp] = useState(currentVitals?.temperature?.toString() || '');
  const [spo2, setSpo2] = useState(currentVitals?.spo2?.toString() || '');
  const [hr, setHr] = useState(currentVitals?.heartRate?.toString() || '');
  const [bpSystolic, setBpSystolic] = useState(currentVitals?.bloodPressureSystolic?.toString() || '');
  const [bpDiastolic, setBpDiastolic] = useState(currentVitals?.bloodPressureDiastolic?.toString() || '');

  // Voice recognition states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('');
  const recognitionRef = useRef<any>(null);

  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Setup Web Speech API for voice recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        // Use configured language's speech code or fallback
        recognition.lang = langConfig.speechSupported ? langConfig.sttCode : (langConfig.fallbackSttCode || 'hi-IN');

        recognition.onstart = () => {
          setIsRecording(true);
          setRecordingStatus('Listening to voice...');
        };

        recognition.onerror = (e: any) => {
          console.error("Speech recognition error:", e);
          setRecordingStatus(`Error: ${e.error}`);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
          setRecordingStatus('');
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            appendToSymptoms(finalTranscript);
          }
          if (interimTranscript) {
            setRecordingStatus(`Listening: "${interimTranscript}"`);
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [langConfig, appendToSymptoms]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Speech recognition already running", err);
      }
    }
  };

  const handleNextStep = () => {
    if (triageStep === 0) {
      if (!name.trim() || !age || !village.trim()) {
        alert("Please fill all patient information fields");
        return;
      }
      setCurrentPatient({
        name,
        age: parseInt(age),
        sex,
        village,
        district: user?.district || 'District',
        state: user?.state || 'State',
        pregnancyStatus: sex === 'F' ? pregnancyStatus : false
      });
      setTriageStep(1);
    } else if (triageStep === 1) {
      if (!currentSymptoms.trim()) {
        alert("Please speak or write symptoms before moving forward");
        return;
      }
      setCurrentVitals({
        temperature: temp ? parseFloat(temp) : undefined,
        spo2: spo2 ? parseInt(spo2) : undefined,
        heartRate: hr ? parseInt(hr) : undefined,
        bloodPressureSystolic: bpSystolic ? parseInt(bpSystolic) : undefined,
        bloodPressureDiastolic: bpDiastolic ? parseInt(bpDiastolic) : undefined
      });
      setTriageStep(2);
    } else if (triageStep === 2) {
      setTriageStep(3);
      runTriageEngine();
    }
  };

  const runTriageEngine = async () => {
    setIsTriaging(true);
    setStreamingOutput("Starting translation and symptom analysis pipeline...");

    try {
      // Step 1: Run translation pipeline to convert regional transcript to English
      const translationResult = await executeTranslationPipeline(
        { regionalLang: languageCode, transcript: currentSymptoms },
        (step, status) => setStreamingOutput(`[Step ${step}/5] ${status}`)
      );

      // Step 2: Call FastAPI backend to triage the patient using Gemini AI
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const triageResponse = await fetch(`${backendUrl}/api/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: translationResult.englishTranscript,
          age: parseInt(currentPatient?.age || '30'),
          sex: currentPatient?.sex === 'Female' ? 'F' : currentPatient?.sex === 'Male' ? 'M' : 'other',
          pregnancy_status: currentPatient?.isPregnant || false,
          lat: 0.0,
          lng: 0.0,
          state: user?.state || 'Unknown',
          district: user?.district || 'Unknown',
          season: 'summer',
          photo_base64: currentPhotoBase64
        })
      });

      if (!triageResponse.ok) {
        throw new Error('Failed to fetch triage analysis from backend');
      }

      const reader = triageResponse.body?.getReader();
      const decoder = new TextDecoder();
      let completeJsonStr = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              completeJsonStr += line.substring(6);
              setStreamingOutput(`Analyzing clinical condition: ${completeJsonStr.length} bytes...`);
            } else if (line.trim() !== '') {
              completeJsonStr += line;
            }
          }
        }
      }

      let parsedResult;
      try {
        parsedResult = JSON.parse(completeJsonStr);
      } catch(err) {
        console.error("Failed to parse AI output:", completeJsonStr);
        throw new Error("Invalid AI response format");
      }

      const finalResult = {
        severity: parsedResult.severity,
        likelyCondition: parsedResult.likely_condition,
        confidence: parsedResult.confidence || "90%",
        immediateActions: parsedResult.immediate_actions,
        redFlags: parsedResult.red_flags,
        referTo: parsedResult.refer_to,
        referTimeframe: parsedResult.refer_timeframe,
        ashaNote: parsedResult.asha_note,
        drugFirstAid: parsedResult.drug_first_aid,
        followUpDays: parsedResult.follow_up_days,
        notifyHealthDept: parsedResult.notify_health_dept,
        disclaimer: parsedResult.disclaimer || t.disclaimer
      };

      setCurrentResult(finalResult);

      // Create triage session record
      const sessionId = crypto.randomUUID();
      const newSession = {
        id: sessionId,
        patient: {
          name,
          age: parseInt(age),
          sex,
          village,
          district: user?.district || 'District',
          state: user?.state || 'State',
          pregnancyStatus
        },
        vitals: {
          temperature: temp ? parseFloat(temp) : undefined,
          spo2: spo2 ? parseInt(spo2) : undefined,
          heartRate: hr ? parseInt(hr) : undefined,
          bloodPressureSystolic: bpSystolic ? parseInt(bpSystolic) : undefined,
          bloodPressureDiastolic: bpDiastolic ? parseInt(bpDiastolic) : undefined
        },
        symptomsOriginal: currentSymptoms,
        symptomsEnglish: translationResult.englishTranscript,
        languageCode,
        result: finalResult,
        photoBase64: currentPhotoBase64 || undefined,
        referralId: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toISOString(),
        synced: false
      };

      addSession(newSession);
      addToSyncQueue(sessionId);

      // Navigate to results
      router.push('/results');
    } catch (err) {
      console.error(err);
      alert("Error processing triage: " + (err as Error).message);
    } finally {
      setIsTriaging(false);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSymptomChipClick = (symptom: string) => {
    appendToSymptoms(symptom);
  };

  const activeChips = QUICK_SYMPTOMS[languageCode] || QUICK_SYMPTOMS['hi'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 flex flex-col justify-between">
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => {
            if (triageStep > 0 && triageStep < 3) {
              setTriageStep(triageStep - 1);
            } else {
              router.push('/dashboard');
            }
          }}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <span className="text-sm font-semibold text-slate-400">
          {triageStep < 3 ? `Step ${triageStep + 1} of 3` : 'Processing...'}
        </span>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto w-full px-6 flex-grow flex flex-col justify-center py-8">
        <AnimatePresence mode="wait">
          
          {/* STEP 0: PATIENT INFORMATION FORM */}
          {triageStep === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <User className="w-6 h-6 text-teal-400" />
                  Patient Registration
                </h2>
                <p className="text-xs text-slate-400 mt-1">Register beneficiary demographics prior to starting health triage.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Patient Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Age (Years)</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                      placeholder="e.g. 34"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gender</label>
                    <select
                      value={sex}
                      onChange={(e) => setSex(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                    >
                      <option value="F">Female</option>
                      <option value="M">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {sex === 'F' && (
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <div>
                      <span className="text-sm font-semibold text-slate-200">Pregnancy Status</span>
                      <p className="text-xs text-slate-400">Is the patient currently pregnant?</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={pregnancyStatus}
                      onChange={(e) => setPregnancyStatus(e.target.checked)}
                      className="w-5 h-5 rounded text-teal-500 focus:ring-teal-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Village Name</label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                    placeholder="Enter village"
                  />
                </div>
              </div>

              <button
                onClick={handleNextStep}
                className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors mt-6 text-lg"
              >
                <span>Demographics Validated</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 1: SYMPTOMS & VITALS CAPTURE */}
          {triageStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-6 h-6 text-teal-400" />
                  Symptom & Vitals Input
                </h2>
                <p className="text-xs text-slate-400 mt-1">Record vitals and speak symptoms. Tap to record voice.</p>
              </div>

              {/* Vitals inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Temp (°C)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full bg-transparent border-0 text-white font-bold focus:outline-none p-0 mt-1 text-lg"
                    placeholder="37.0"
                  />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">SpO2 (%)</span>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full bg-transparent border-0 text-white font-bold focus:outline-none p-0 mt-1 text-lg"
                    placeholder="98"
                  />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Heart Rate</span>
                  <input
                    type="number"
                    value={hr}
                    onChange={(e) => setHr(e.target.value)}
                    className="w-full bg-transparent border-0 text-white font-bold focus:outline-none p-0 mt-1 text-lg"
                    placeholder="78"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">BP Systolic (mmHg)</span>
                  <input
                    type="number"
                    value={bpSystolic}
                    onChange={(e) => setBpSystolic(e.target.value)}
                    className="w-full bg-transparent border-0 text-white font-bold focus:outline-none p-0 mt-1 text-lg"
                    placeholder="120"
                  />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">BP Diastolic (mmHg)</span>
                  <input
                    type="number"
                    value={bpDiastolic}
                    onChange={(e) => setBpDiastolic(e.target.value)}
                    className="w-full bg-transparent border-0 text-white font-bold focus:outline-none p-0 mt-1 text-lg"
                    placeholder="80"
                  />
                </div>
              </div>

              {/* Speech-to-Text Voice Recording Button */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-900/50 border border-slate-800 rounded-2xl relative overflow-hidden">
                <button
                  onClick={toggleRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-slate-950 font-bold active:scale-90 transition-all ${
                    isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-teal-400 hover:bg-teal-500'
                  }`}
                >
                  {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
                <span className="text-xs text-slate-400 font-medium mt-3">
                  {isRecording ? 'Tap to Pause Recording' : t.startVoice}
                </span>

                {isRecording && (
                  <div className="flex items-center gap-1 mt-4 justify-center h-6">
                    <span className="w-1 bg-teal-400 h-2 rounded-full animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '0.6s' }} />
                    <span className="w-1 bg-teal-400 h-4 rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '0.7s' }} />
                    <span className="w-1 bg-teal-400 h-6 rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '0.5s' }} />
                    <span className="w-1 bg-teal-400 h-3 rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '0.8s' }} />
                    <span className="w-1 bg-teal-400 h-1 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '0.6s' }} />
                  </div>
                )}

                {recordingStatus && (
                  <p className="text-[10px] text-teal-400 mt-2 font-mono text-center max-w-xs">{recordingStatus}</p>
                )}

                {!langConfig.speechSupported && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-400 mt-3 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-md">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{t.voiceFallbackNotice}</span>
                  </div>
                )}
              </div>

              {/* Symptom Quick Select Chips */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Symptom Quick Select</span>
                <div className="flex flex-wrap gap-2">
                  {activeChips.map((symptom) => (
                    <button
                      key={symptom}
                      onClick={() => handleSymptomChipClick(symptom)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-850 hover:border-teal-500/35 hover:bg-slate-850 text-xs rounded-full text-slate-300 transition-colors"
                    >
                      + {symptom}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input for manual symptom corrections */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Symptom Log</label>
                <textarea
                  value={currentSymptoms}
                  onChange={(e) => setCurrentSymptoms(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500 transition-colors min-h-[100px] text-sm"
                  placeholder="Record symptoms using the mic or edit transcript here..."
                />
              </div>

              <button
                onClick={handleNextStep}
                className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors mt-6 text-lg"
              >
                <span>Proceed to Capture Image</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: OPTIONAL PHOTO UPLOAD */}
          {triageStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Camera className="w-6 h-6 text-teal-400" />
                  Symptomatic Image
                </h2>
                <p className="text-xs text-slate-400 mt-1">Optional image upload for severe skin rashes, physical trauma, or wounds.</p>
              </div>

              <div className="flex flex-col items-center justify-center p-8 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl relative overflow-hidden">
                {currentPhotoBase64 ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950">
                    <img
                      src={currentPhotoBase64}
                      alt="Triage context"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setCurrentPhoto(null)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-lg p-1.5 text-xs font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <>
                    <Camera className="w-12 h-12 text-slate-500 mb-3" />
                    <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer font-bold px-4 py-2.5 rounded-lg text-xs transition-colors">
                      Browse or Capture Camera
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoCapture}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-slate-500 mt-2">Maximum file size: 2MB</span>
                  </>
                )}
              </div>

              <button
                onClick={handleNextStep}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors mt-6 text-lg"
              >
                <span>Run Diagnostic Engine</span>
                <Check className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 3: RUNNING TRIAGE / PROCESSING */}
          {triageStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 space-y-6 text-center"
            >
              <RefreshCw className="w-16 h-16 text-teal-400 animate-spin" />
              <div>
                <h3 className="text-xl font-bold text-white">Evaluating Symptoms</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">Gemini 3.5 AI is checking vitals, detecting emergency codes, and matching clinical referral sites.</p>
              </div>

              {/* Pipeline progress box */}
              <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-[10px] text-teal-400 text-left">
                {isTriaging ? isTriaging : 'Processing...'}
                <div className="mt-1">{isRecording ? 'Speech recognition active' : 'Evaluating pipeline stages...'}</div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

    </div>
  );
}
