import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import triage, facilities, referral, translate, auth
from app.api.translate import SUPPORTED_LANGUAGES, MEDICAL_GLOSSARY

app = FastAPI(
    title="AarogyaSetu AI Triage Orchestration",
    description="ASHA voice-based rural health triage system under National Health Mission guidelines.",
    version="1.1.0"
)

# CORS Policy - Enable robust frontend dashboard communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to ASHA deployment domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(triage.router, prefix="/api", tags=["Triage"])
app.include_router(facilities.router, prefix="/api", tags=["Facilities"])
app.include_router(referral.router, prefix="/api", tags=["Referral"])
app.include_router(translate.router, prefix="/api", tags=["Translation"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AarogyaSetu AI Triage Backend",
        "version": "1.1.0",
        "auth": "Supabase-Active",
        "sync": "Firebase-Offline-Ready"
    }

@app.get("/api/health")
def health_check():
    """
    Health-check endpoint returning service versions, supported language
    count, and glossary coverage for operational monitoring.
    """
    return {
        "status": "healthy",
        "telemetry": "secure",
        "phi_masking": "active",
        "version": "1.1.0",
        "services": {
            "triage": "active",
            "facilities": "active",
            "referral": "active",
            "translation": "active",
        },
        "languages_supported": len(SUPPORTED_LANGUAGES),
        "glossary_terms": len(MEDICAL_GLOSSARY),
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
