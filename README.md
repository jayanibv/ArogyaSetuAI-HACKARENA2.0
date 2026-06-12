# AarogyaSetu AI (आरोग्यसेतु एआई)
> **Voice-powered rural health triage for every ASHA worker in India.**

AarogyaSetu AI is an offline-first, multilingual progressive web application (PWA) coupled with an intelligent Python FastAPI medical triage orchestration backend. It is designed to assist Accredited Social Health Activists (ASHA workers) across 28 Indian States and 8 Union Territories in performing structured health triaging, mapping emergency referrals, and syncing case histories over unstable 2G/3G/4G rural networks.

---

## 🏗️ Project Architecture

```
aarogyasetu/
├── docker-compose.yml
├── README.md
├── env.example
├── deploy.sh              # Production docker build & orchestrator
├── frontend/              # Next.js 14 PWA (App Router)
│   ├── package.json
│   ├── next.config.js
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx       # 23-Language splash selector
│       │   ├── login/         # Phone OTP worker onboarding
│       │   ├── dashboard/     # Stats, offline queue & recent triages
│       │   ├── triage/        # Multi-step voice registration wizard
│       │   ├── results/       # Severity cards, red flags & PDF referral generator
│       │   ├── map/           # Leaflet PHC/CHC facility locator maps
│       │   ├── admin/         # Telemetry, event streams & audits
│       │   └── globals.css    # severity color tokens & keyframe animations
│       └── lib/
│           ├── store.ts       # Zustand persistent offline queue
│           ├── supabaseClient.ts # Supabase client auth
│           └── i18n/
│               ├── index.ts   # Translations for all 22 scheduled languages + English
│               ├── languages.ts # State coverage arrays & fallback chains
│               ├── translate.ts # Indic medical glossary translations
│               └── autoDetect.ts # GPS-based language auto-detection
└── backend/               # Python FastAPI Orchestration Backend
    ├── main.py            # API routing & health endpoints
    ├── requirements.txt
    ├── schema.sql         # Supabase PostgreSQL tables & RLS policies
    ├── Dockerfile
    └── app/
        ├── api/
        │   ├── triage.py      # Gemini 3.5 Flash Streaming SSE + Vision Dx
        │   ├── translate.py   # Indic translation router & glossary fallbacks
        │   ├── facilities.py  # PHC/CHC Locator & Distance Matrix
        │   └── referral.py    # Black & White A4 PDF Slip Generator
        └── utils/
            └── pdf_generator.py # ReportLab PDF compilation
```

---

## 🌐 Complete Indian Language Coverage (23 Languages)

AarogyaSetu AI supports all 22 Scheduled Indian Languages under the Eighth Schedule of the Constitution of India, plus English:

| Support Level | Languages | Count | Fallback Behavior |
|---|---|---|---|
| ✅ **Full STT + TTS** | Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Odia, Urdu, English | **12** | Native Web Speech API STT and SpeechSynthesis TTS |
| ⚠️ **Partial Fallback** | Assamese, Nepali, Sindhi, Konkani, Dogri, Kashmiri, Maithili, Manipuri, Bodo, Santali, Sanskrit | **11** | Auto-falls back to closest linguistic cousin (e.g. Konkani ➜ Marathi, Assamese ➜ Bengali) |

---

## ⚡ Quick Start

### 1. Local Development (Next.js PWA)
Navigate to the frontend folder, install dependencies, and run:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your mobile viewport or Chrome.

### 2. FastAPI Backend
Ensure Python 3.10+ is installed, install requirements, and start Uvicorn:
```bash
cd backend
pip install -r requirements.txt
python main.py
```
API docs will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Docker Compose Orchestration (Recommended)
Compile and run both frontend and backend microservices using the orchestrator:
```bash
chmod +x deploy.sh
./deploy.sh
```
Or run directly:
```bash
docker-compose up --build
```

---

## 📡 Offline-First & Sync Architecture

ASHA workers operate in highly remote, zero-connectivity environments. The application utilizes a robust offline workflow:
1. **Local Storage (IndexedDB)**: Triage reports are captured and safely cached in IndexedDB.
2. **Web Speech Fallback**: On zero-network environments, the system utilizes the browser's native Web Speech API and offline TTS synthesizer.
3. **Queue & Auto-Sync**: The PWA service worker tracks connection status. When 2G/3G/4G connectivity is restored, cached offline sessions automatically sync to Supabase/Firebase backend.

---

## 🎨 Global UI/UX Constraints

- **Accessibility (WCAG 2.1 AA)**: Minimum contrast ratio of 4.5:1. All critical information uses representative icons alongside text labels to support low-literacy usage.
- **ASHA-worker Optimized UI**: Minimum touch target size of 48×48px. Clear layout optimized for a 360px viewport (typical budget Android devices used by ASHA workers).
- **Indic RTL Support**: Native RTL rendering is dynamically applied when Urdu or Sindhi is selected, swapping layout orientation seamlessly.
- **Structured Severity Color System**:
  - **LOW**: `#22C55E` (Green)
  - **MEDIUM**: `#F59E0B` (Amber)
  - **HIGH**: `#EF4444` (Red)
  - **EMERGENCY**: `#DC2626` (Crimson, triggers pulse animation + prominent 112 visual)
