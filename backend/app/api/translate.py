"""
AarogyaSetu AI — Translation Router
====================================
Provides multilingual translation for ASHA workers using:
  1. Google Gemini API (primary, when GEMINI_API_KEY is set)
  2. Built-in medical glossary fallback for 14 critical NHM terms
     across 13 major Indian languages

Supports all 22 Indian Scheduled Languages as defined in the
Eighth Schedule of the Constitution of India.

Privacy: No PHI is logged. Only translation metadata is emitted.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger("aarogyasetu.translate")

router = APIRouter()

# ---------------------------------------------------------------------------
# Supported Languages — 22 Scheduled Languages + English
# ---------------------------------------------------------------------------
SUPPORTED_LANGUAGES: dict[str, str] = {
    "en":    "English",
    "hi":    "Hindi",
    "kn":    "Kannada",
    "ta":    "Tamil",
    "te":    "Telugu",
    "ml":    "Malayalam",
    "mr":    "Marathi",
    "bn":    "Bengali",
    "gu":    "Gujarati",
    "pa":    "Punjabi",
    "or":    "Odia",
    "ur":    "Urdu",
    "as":    "Assamese",
    "ne":    "Nepali",
    "sa":    "Sanskrit",
    "sd":    "Sindhi",
    "ks":    "Kashmiri",
    "doi":   "Dogri",
    "kok":   "Konkani",
    "mai":   "Maithili",
    "mni":   "Manipuri",
    "sat":   "Santali",
    "bo":    "Bodo",
}

# ---------------------------------------------------------------------------
# Medical Glossary — NHM Module 6 & 7 critical terms
# Maps English term → {lang_code: translation}
# ---------------------------------------------------------------------------
MEDICAL_GLOSSARY: dict[str, dict[str, str]] = {
    "fever": {
        "hi": "बुखार", "kn": "ಜ್ವರ", "ta": "காய்ச்சல்", "te": "జ్వరం",
        "ml": "പനി", "mr": "ताप", "bn": "জ্বর", "gu": "તાવ",
        "pa": "ਬੁਖਾਰ", "or": "ଜ୍ଵର", "ur": "بخار", "as": "জ্বৰ",
        "ne": "ज्वरो",
    },
    "headache": {
        "hi": "सिरदर्द", "kn": "ತಲೆನೋವು", "ta": "தலைவலி", "te": "తలనొప్పి",
        "ml": "തലവേദന", "mr": "डोकेदुखी", "bn": "মাথাব্যথা", "gu": "માથાનો દુખાવો",
        "pa": "ਸਿਰ ਦਰਦ", "or": "ମୁଣ୍ଡ ବ୍ୟଥା", "ur": "سر درد", "as": "মূৰৰ বিষ",
        "ne": "टाउको दुखाइ",
    },
    "diarrhea": {
        "hi": "दस्त", "kn": "ಅತಿಸಾರ", "ta": "வயிற்றுப்போக்கு", "te": "అతిసారం",
        "ml": "അതിസാരം", "mr": "अतिसार", "bn": "ডায়রিয়া", "gu": "ઝાડા",
        "pa": "ਦਸਤ", "or": "ଡାଇରିଆ", "ur": "دست", "as": "ডায়েৰিয়া",
        "ne": "पखाला",
    },
    "vomiting": {
        "hi": "उल्टी", "kn": "ವಾಂತಿ", "ta": "வாந்தி", "te": "వాంతి",
        "ml": "ഛർദ്ദി", "mr": "उलटी", "bn": "বমি", "gu": "ઊલટી",
        "pa": "ਉਲਟੀ", "or": "ବାନ୍ତି", "ur": "قے", "as": "বমি",
        "ne": "बान्ता",
    },
    "convulsion": {
        "hi": "ऐंठन", "kn": "ಸೆಳೆತ", "ta": "வலிப்பு", "te": "మూర్ఛ",
        "ml": "അപസ്മാരം", "mr": "आकडी", "bn": "খিঁচুনি", "gu": "આંચકી",
        "pa": "ਕੜਵੱਲ", "or": "ମୂର୍ଚ୍ଛା", "ur": "اینٹھن", "as": "খিচনি",
        "ne": "खल्तो",
    },
    "unconscious": {
        "hi": "बेहोश", "kn": "ಪ್ರಜ್ಞಾಹೀನ", "ta": "மயக்கம்", "te": "స్పృహ తప్పడం",
        "ml": "ബോധരഹിതം", "mr": "बेशुद्ध", "bn": "অচেতন", "gu": "બેભાન",
        "pa": "ਬੇਹੋਸ਼", "or": "ଅଚେତ", "ur": "بے ہوش", "as": "অচেতন",
        "ne": "बेहोस",
    },
    "chest pain": {
        "hi": "सीने में दर्द", "kn": "ಎದೆ ನೋವು", "ta": "நெஞ்சு வலி", "te": "ఛాతీ నొప్పి",
        "ml": "നെഞ്ചുവേദന", "mr": "छातीत दुखणे", "bn": "বুকে ব্যথা", "gu": "છાતીમાં દુખાવો",
        "pa": "ਛਾਤੀ ਵਿੱਚ ਦਰਦ", "or": "ଛାତି ଯନ୍ତ୍ରଣା", "ur": "سینے میں درد", "as": "বুকুৰ বিষ",
        "ne": "छातीमा दुखाइ",
    },
    "breathing difficulty": {
        "hi": "सांस लेने में कठिनाई", "kn": "ಉಸಿರಾಟದ ತೊಂದರೆ", "ta": "சுவாசிப்பதில் சிரமம்",
        "te": "శ్వాస తీసుకోవడంలో ఇబ్బంది", "ml": "ശ്വാസതടസ്സം", "mr": "श्वास घेण्यात अडचण",
        "bn": "শ্বাসকষ্ট", "gu": "શ્વાસ લેવામાં તકલીફ", "pa": "ਸਾਹ ਲੈਣ ਵਿੱਚ ਮੁਸ਼ਕਲ",
        "or": "ଶ୍ଵାସ କଷ୍ଟ", "ur": "سانس لینے میں دشواری", "as": "উশাহ লোৱাত কষ্ট",
        "ne": "सास फेर्न गाह्रो",
    },
    "bleeding": {
        "hi": "रक्तस्राव", "kn": "ರಕ್ತಸ್ರಾವ", "ta": "இரத்தப்போக்கு", "te": "రక్తస్రావం",
        "ml": "രക്തസ്രാവം", "mr": "रक्तस्त्राव", "bn": "রক্তপাত", "gu": "રક્તસ્ત્રાવ",
        "pa": "ਖੂਨ ਵਗਣਾ", "or": "ରକ୍ତସ୍ରାବ", "ur": "خون بہنا", "as": "ৰক্তক্ষৰণ",
        "ne": "रगत बग्नु",
    },
    "snake bite": {
        "hi": "सर्पदंश", "kn": "ಹಾವಿನ ಕಡಿತ", "ta": "பாம்பு கடி", "te": "పాము కాటు",
        "ml": "പാമ്പുകടി", "mr": "साप चावणे", "bn": "সাপের কামড়", "gu": "સાપનો ડંખ",
        "pa": "ਸੱਪ ਦਾ ਡੰਗ", "or": "ସାପ କାମୁଡ଼ା", "ur": "سانپ کا کاٹنا", "as": "সাপে কামোৰা",
        "ne": "सर्पदंश",
    },
    "cough": {
        "hi": "खांसी", "kn": "ಕೆಮ್ಮು", "ta": "இருமல்", "te": "దగ్గు",
        "ml": "ചുമ", "mr": "खोकला", "bn": "কাশি", "gu": "ઉધરસ",
        "pa": "ਖੰਘ", "or": "କାଶ", "ur": "کھانسی", "as": "কাহ",
        "ne": "खोकी",
    },
    "malaria": {
        "hi": "मलेरिया", "kn": "ಮಲೇರಿಯಾ", "ta": "மலேரியா", "te": "మలేరియా",
        "ml": "മലേറിയ", "mr": "मलेरिया", "bn": "ম্যালেরিয়া", "gu": "મેલેરિયા",
        "pa": "ਮਲੇਰੀਆ", "or": "ମ୍ୟାଲେରିଆ", "ur": "ملیریا", "as": "মেলেৰিয়া",
        "ne": "मलेरिया",
    },
    "dengue": {
        "hi": "डेंगू", "kn": "ಡೆಂಗ್ಯೂ", "ta": "டெங்கு", "te": "డెంగ్యూ",
        "ml": "ഡെങ്കി", "mr": "डेंग्यू", "bn": "ডেঙ্গু", "gu": "ડેન્ગ્યુ",
        "pa": "ਡੇਂਗੂ", "or": "ଡେଙ୍ଗୁ", "ur": "ڈینگو", "as": "ডেংগু",
        "ne": "डेंगी",
    },
    "pregnancy complication": {
        "hi": "गर्भावस्था जटिलता", "kn": "ಗರ್ಭಧಾರಣೆ ಸಮಸ್ಯೆ", "ta": "கர்ப்பகால சிக்கல்",
        "te": "గర్భధారణ సమస్య", "ml": "ഗർഭകാല സങ്കീർണത", "mr": "गर्भधारणा गुंतागुंत",
        "bn": "গর্ভকালীন জটিলতা", "gu": "ગર્ભાવસ્થા જટિલતા", "pa": "ਗਰਭ ਅਵਸਥਾ ਸਮੱਸਿਆ",
        "or": "ଗର୍ଭାବସ୍ଥା ଜଟିଳତା", "ur": "حمل کی پیچیدگی", "as": "গৰ্ভাৱস্থাৰ জটিলতা",
        "ne": "गर्भावस्था जटिलता",
    },
}


# ---------------------------------------------------------------------------
# Pydantic v2 Request / Response Models
# ---------------------------------------------------------------------------

class TranslateRequest(BaseModel):
    """Incoming translation request from frontend / ASHA device."""
    text: str = Field(..., min_length=1, max_length=5000, description="Text to translate")
    source_lang: str = Field(..., description="ISO language code of source text (e.g. 'hi', 'en')")
    target_lang: str = Field(..., description="ISO language code of target language (e.g. 'en', 'ta')")


class TranslateResponse(BaseModel):
    """Translation result returned to caller."""
    translated_text: str
    method: str = Field(description="'gemini' | 'glossary' | 'passthrough'")
    confidence: str = Field(description="'high' | 'medium' | 'low'")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _glossary_translate(text: str, source_lang: str, target_lang: str) -> Optional[str]:
    """
    Attempt a glossary-based translation for known medical terms.

    Handles two directions:
      • Regional → English: look up regional text in lang→term reverse map
      • English → Regional: look up English term in MEDICAL_GLOSSARY

    Returns translated string or None if no glossary match found.
    """
    normalized = text.strip().lower()

    # English → target language
    if source_lang == "en" and target_lang != "en":
        if normalized in MEDICAL_GLOSSARY:
            return MEDICAL_GLOSSARY[normalized].get(target_lang)

    # Source language → English
    if target_lang == "en" and source_lang != "en":
        for eng_term, translations in MEDICAL_GLOSSARY.items():
            if translations.get(source_lang, "").strip().lower() == normalized:
                return eng_term

    # Source regional → Target regional (via English pivot)
    if source_lang != "en" and target_lang != "en":
        # First find the English term
        for eng_term, translations in MEDICAL_GLOSSARY.items():
            if translations.get(source_lang, "").strip().lower() == normalized:
                return translations.get(target_lang)

    return None


async def _gemini_translate(text: str, source_lang: str, target_lang: str) -> Optional[str]:
    """
    Translate using Google Gemini generative AI.

    Returns the translated text or None on failure.
    PHI Note: Only the text length is logged, never the content itself.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.debug("GEMINI_API_KEY not set — skipping Gemini translation")
        return None

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        src_name = SUPPORTED_LANGUAGES.get(source_lang, source_lang)
        tgt_name = SUPPORTED_LANGUAGES.get(target_lang, target_lang)

        prompt = (
            f"You are a medical translator for the Indian National Health Mission. "
            f"Translate the following text from {src_name} to {tgt_name}. "
            f"Use standard medical terminology appropriate for community health workers. "
            f"Return ONLY the translated text without any explanation or notes.\n\n"
            f"Text: {text}"
        )

        response = await model.generate_content_async(prompt)
        translated = response.text.strip()

        if translated:
            logger.info(
                "Gemini translation OK  src=%s tgt=%s chars_in=%d chars_out=%d",
                source_lang, target_lang, len(text), len(translated),
            )
            return translated

    except ImportError:
        logger.warning("google-generativeai package not installed — falling back to glossary")
    except Exception:
        # PHI-safe: log only metadata, never patient text
        logger.exception("Gemini translation failed  src=%s tgt=%s", source_lang, target_lang)

    return None


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/translate", response_model=TranslateResponse)
async def translate_text(req: TranslateRequest) -> TranslateResponse:
    """
    Translate text between supported Indian languages.

    Resolution order:
      1. Passthrough — if source == target, return as-is.
      2. Gemini API — highest quality, requires GEMINI_API_KEY env var.
      3. Medical glossary — offline fallback for 14 critical NHM terms.
      4. 422 error — if none of the above can handle the request.
    """
    # Validate language codes
    if req.source_lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported source language: '{req.source_lang}'. "
                   f"Supported: {list(SUPPORTED_LANGUAGES.keys())}",
        )
    if req.target_lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported target language: '{req.target_lang}'. "
                   f"Supported: {list(SUPPORTED_LANGUAGES.keys())}",
        )

    # 1. Passthrough
    if req.source_lang == req.target_lang:
        return TranslateResponse(
            translated_text=req.text,
            method="passthrough",
            confidence="high",
        )

    # 2. Gemini API
    gemini_result = await _gemini_translate(req.text, req.source_lang, req.target_lang)
    if gemini_result:
        return TranslateResponse(
            translated_text=gemini_result,
            method="gemini",
            confidence="high",
        )

    # 3. Glossary fallback
    glossary_result = _glossary_translate(req.text, req.source_lang, req.target_lang)
    if glossary_result:
        return TranslateResponse(
            translated_text=glossary_result,
            method="glossary",
            confidence="medium",
        )

    # 4. No translation available
    raise HTTPException(
        status_code=422,
        detail=(
            "Translation unavailable. Gemini API key is not configured and "
            "the term was not found in the offline medical glossary. "
            "Set GEMINI_API_KEY or use a recognised medical term."
        ),
    )


@router.get("/translate/languages")
async def list_supported_languages() -> dict:
    """Return all supported languages and glossary term count."""
    return {
        "languages": SUPPORTED_LANGUAGES,
        "total_languages": len(SUPPORTED_LANGUAGES),
        "glossary_terms": list(MEDICAL_GLOSSARY.keys()),
        "total_glossary_terms": len(MEDICAL_GLOSSARY),
    }
