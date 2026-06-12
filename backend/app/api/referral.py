import io
import os
import urllib.request
import logging
from fastapi import APIRouter, Response, HTTPException
from pydantic import BaseModel
from app.api.translate import _gemini_translate, _glossary_translate
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph as RLParagraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

logger = logging.getLogger("aarogyasetu.referral")

# Determine local font paths in backend directory
FONT_DIR = os.path.dirname(__file__)
FONT_REG_PATH = os.path.join(FONT_DIR, 'DejaVuSans.ttf')
FONT_BOLD_PATH = os.path.join(FONT_DIR, 'DejaVuSans-Bold.ttf')

FONT_NAME_REG = 'Helvetica'
FONT_NAME_BOLD = 'Helvetica-Bold'
FONT_NAME_ITALIC = 'Helvetica-Oblique'

def init_unicode_fonts():
    global FONT_NAME_REG, FONT_NAME_BOLD, FONT_NAME_ITALIC
    
    # Try local fonts first
    if os.path.exists(FONT_REG_PATH) and os.path.exists(FONT_BOLD_PATH):
        try:
            pdfmetrics.registerFont(TTFont('DejaVuSans', FONT_REG_PATH))
            pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', FONT_BOLD_PATH))
            FONT_NAME_REG = 'DejaVuSans'
            FONT_NAME_BOLD = 'DejaVuSans-Bold'
            FONT_NAME_ITALIC = 'DejaVuSans' # use same regular as fallback for oblique
            logger.info("Unicode fonts initialized successfully from local cache")
            return
        except Exception as e:
            logger.warning(f"Failed to register local fonts: {e}")

    # Try standard system font paths
    sys_paths = [
        # Linux Indic / DejaVu
        ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'),
        ('/usr/share/fonts/truetype/fonts-dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/fonts-dejavu/DejaVuSans-Bold.ttf'),
        # Windows Arial
        ('C:\\Windows\\Fonts\\arial.ttf', 'C:\\Windows\\Fonts\\arialbd.ttf'),
    ]
    for r_path, b_path in sys_paths:
        if os.path.exists(r_path) and os.path.exists(b_path):
            try:
                pdfmetrics.registerFont(TTFont('DejaVuSans', r_path))
                pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', b_path))
                FONT_NAME_REG = 'DejaVuSans'
                FONT_NAME_BOLD = 'DejaVuSans-Bold'
                FONT_NAME_ITALIC = 'DejaVuSans'
                logger.info("Unicode fonts initialized successfully from system path")
                return
            except Exception as e:
                logger.warning(f"Failed to register system fonts: {e}")

    # Try downloading DejaVuSans.ttf and DejaVuSans-Bold.ttf from raw github (~350KB each)
    try:
        reg_url = "https://github.com/reingart/pyfpdf/raw/master/fpdf/font/dejavusans.ttf"
        bold_url = "https://github.com/reingart/pyfpdf/raw/master/fpdf/font/dejavusans-bold.ttf"
        
        logger.info("Downloading DejaVuSans regular font...")
        urllib.request.urlretrieve(reg_url, FONT_REG_PATH)
        logger.info("Downloading DejaVuSans bold font...")
        urllib.request.urlretrieve(bold_url, FONT_BOLD_PATH)
        
        pdfmetrics.registerFont(TTFont('DejaVuSans', FONT_REG_PATH))
        pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', FONT_BOLD_PATH))
        FONT_NAME_REG = 'DejaVuSans'
        FONT_NAME_BOLD = 'DejaVuSans-Bold'
        FONT_NAME_ITALIC = 'DejaVuSans'
        logger.info("Unicode fonts downloaded and initialized successfully")
    except Exception as e:
        logger.warning(f"Could not download DejaVuSans: {e}. Falling back to Helvetica with transliteration.")
        FONT_NAME_REG = 'Helvetica'
        FONT_NAME_BOLD = 'Helvetica-Bold'
        FONT_NAME_ITALIC = 'Helvetica-Oblique'

# Initialize fonts
try:
    init_unicode_fonts()
except Exception as e:
    logger.exception(f"Font initialization crashed: {e}")

def sanitize_text(text: str) -> str:
    """If using standard Helvetica, strip non-latin characters to prevent ReportLab crashes."""
    if not text:
        return ""
    if FONT_NAME_REG == 'Helvetica':
        # Remove any characters outside the latin-1 range (ordinal > 255)
        # to prevent PDF metrics encoding crashes
        return "".join([c for c in text if ord(c) < 256])
    return text

def Paragraph(text: str, style) -> RLParagraph:
    """Custom Paragraph override that pre-sanitizes Indic text to prevent PDF generation crashes."""
    return RLParagraph(sanitize_text(text), style)


router = APIRouter()

# Schema mapping requested by User
class ReferralRequest(BaseModel):
    patient_name: str
    patient_age: int
    patient_sex: str
    village: str
    district: str
    state: str
    language_code: str      # e.g. "kn-IN" or "hi-IN"
    symptoms_original: str  # in regional language
    symptoms_english: str   # translated
    triage_result: dict     # full triage JSON from /api/triage
    facility: dict          # from /api/facilities
    asha_name: str
    asha_id: str
    asha_phone: str

# Bilingual translation maps for PDF (Global Rule #3 & #10)
REGIONAL_TRANSLATIONS = {
    "hi-IN": {
        "title": "ASHA Health Referral / आशा स्वास्थ्य रेफरल",
        "patient_details": "PATIENT PROFILE / मरीज की जानकारी",
        "symptoms": "SYMPTOMS TRANSCRIPT / मरीज के लक्षण",
        "triage": "AI TRIAGE SUMMARY / एआई स्वास्थ्य वर्गीकरण",
        "instruction": "REFERRAL OUTPOST ROUTING / रेफरल अस्पताल निर्देश",
        "disclaimer": "यह रेफरल एआई सहायता (AarogyaSetu AI) से तैयार किया गया है। डॉक्टर से जांच कराएं। आपातकाल में 108 या 112 डायल करें।",
        "severity": "गंभीरता स्तर",
        "condition": "संभावित स्वास्थ्य स्थिति",
        "urgency": "रेफरल तत्परता",
        "asha_sign": "ASHA Worker Signature / आशा कार्यकर्ता हस्ताक्षर"
    },
    "kn-IN": {
        "title": "ASHA Health Referral / ಆಶಾ ಆರೋಗ್ಯ ರೆಫರಲ್",
        "patient_details": "PATIENT PROFILE / ರೋಗಿಯ ಮಾಹಿತಿ",
        "symptoms": "SYMPTOMS TRANSCRIPT / ರೋಗದ ಲಕ್ಷಣಗಳು",
        "triage": "AI TRIAGE SUMMARY / ಎಐ ತಪಾಸಣೆ ವಿವರಗಳು",
        "instruction": "REFERRAL OUTPOST ROUTING / ರೆಫರಲ್ ಆಸ್ಪತ್ರೆ ವಿವರ",
        "disclaimer": "ಈ ರೆಫರಲ್ ಅನ್ನು ಎಐ ಮೂಲಕ ರಚಿಸಲಾಗಿದೆ (AarogyaSetu AI). ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ. ತುರ್ತು ಸ್ಥಿತಿಯಲ್ಲಿ 108 ಅಥವಾ 112 ಗೆ ಕರೆ ಮಾಡಿ.",
        "severity": "ತೀವ್ರತೆ ಮಟ್ಟ",
        "condition": "ಸಂಭಾವ್ಯ ಕಾಯಿಲೆ",
        "urgency": "ರೆಫರಲ್ ತುರ್ತು",
        "asha_sign": "ASHA Worker Signature / ಆಶಾ ಕಾರ್ಯಕರ್ತೆ ಸಹಿ"
    },
    "default": {
        "title": "ASHA Health Referral Slip",
        "patient_details": "PATIENT DETAILS",
        "symptoms": "SYMPTOMS TRANSCRIPT",
        "triage": "AI TRIAGE RESULT",
        "instruction": "REFERRAL INSTRUCTION",
        "disclaimer": "This referral was generated with AI assistance (AarogyaSetu AI). Clinical diagnosis must be confirmed by a qualified professional. In emergency, call 108 or 112.",
        "severity": "Severity",
        "condition": "Likely Condition",
        "urgency": "Referral Urgency",
        "asha_sign": "ASHA Worker Signature"
    }
}

async def translate_referral_fields(req: ReferralRequest, lang_code: str) -> dict:
    # Resolves translation keys
    lang_key = lang_code if lang_code in REGIONAL_TRANSLATIONS else "default"
    return REGIONAL_TRANSLATIONS[lang_key]

def build_referral_pdf(req: ReferralRequest, trans: dict) -> bytes:
    buffer = io.BytesIO()
    
    # Initialize Doc template
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15*mm,
        leftMargin=15*mm,
        topMargin=15*mm,
        bottomMargin=15*mm
    )
    
    styles = getSampleStyleSheet()
    
    # B&W high contrast style configurations (Global Rule #9)
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName=FONT_NAME_BOLD,
        fontSize=18,
        leading=22,
        textColor=colors.black
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName=FONT_NAME_REG,
        fontSize=9,
        leading=11,
        textColor=colors.gray
    )
    
    section_title = ParagraphStyle(
        'SecTitle',
        parent=styles['Heading2'],
        fontName=FONT_NAME_BOLD,
        fontSize=11,
        leading=15,
        textColor=colors.black,
        spaceBefore=8,
        spaceAfter=4
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName=FONT_NAME_BOLD,
        fontSize=9,
        leading=13,
        textColor=colors.black
    )
    
    body_normal = ParagraphStyle(
        'BodyNorm',
        parent=styles['Normal'],
        fontName=FONT_NAME_REG,
        fontSize=9,
        leading=13,
        textColor=colors.black
    )
    
    small_disclaimer = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName=FONT_NAME_ITALIC,
        fontSize=7.5,
        leading=10,
        textColor=colors.black
    )

    story = []
    
    # SECTION 1: HEADER BLOCK
    story.append(Paragraph(f"<b>{trans['title']}</b>", title_style))
    story.append(Paragraph("Ministry of Health & Family Welfare — National Health Mission (NHM) Outpost", subtitle_style))
    story.append(Spacer(1, 3*mm))
    
    # Table border line
    line_table = Table([[""]], colWidths=[180*mm])
    line_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 1.2, colors.black),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0)
    ]))
    story.append(line_table)
    story.append(Spacer(1, 4*mm))
    
    # SECTION 2: PATIENT DETAILS
    story.append(Paragraph(trans["patient_details"], section_title))
    
    # Mask patient details securely (Global Rule #2)
    masked_name = req.patient_name[0] + "***" + req.patient_name[-1] if len(req.patient_name) > 1 else "*"
    masked_village = req.village[0] + "***" if req.village else "*"
    age_cohort = f"{(req.patient_age // 10) * 10}s"

    patient_data = [
        [Paragraph("Patient Name:", body_bold), Paragraph(f"{masked_name} (Masked)", body_normal),
         Paragraph("Age Cohort:", body_bold), Paragraph(f"{age_cohort} Category", body_normal)],
        [Paragraph("Gender:", body_bold), Paragraph(req.patient_sex, body_normal),
         Paragraph("Village Outpost:", body_bold), Paragraph(f"{masked_village} (Masked)", body_normal)],
        [Paragraph("District:", body_bold), Paragraph(req.district, body_normal),
         Paragraph("State Outpost:", body_bold), Paragraph(req.state, body_normal)]
    ]
    
    pat_table = Table(patient_data, colWidths=[35*mm, 55*mm, 35*mm, 55*mm])
    pat_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(pat_table)
    story.append(Spacer(1, 4*mm))
    
    # SECTION 3: SYMPTOMS TRANSCRIPT
    story.append(Paragraph(trans["symptoms"], section_title))
    symptom_data = [
        [Paragraph("Symptoms (English):", body_bold), Paragraph(req.symptoms_english, body_normal)]
    ]
    sym_table = Table(symptom_data, colWidths=[40*mm, 140*mm])
    sym_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(sym_table)
    story.append(Spacer(1, 4*mm))
    
    # SECTION 4: AI TRIAGE RESULT
    story.append(Paragraph(trans["triage"], section_title))
    triage = req.triage_result
    
    severity_val = triage.get("severity", "LOW")
    actions_para = [Paragraph(f"- {a}", body_normal) for a in triage.get("immediate_actions", [])]
    flags_para = [Paragraph(f"- {f}", body_normal) for f in triage.get("red_flags", [])]
    
    # Helper to stack elements
    def make_cell(paras):
        cell_story = []
        for p in paras:
            cell_story.append(p)
        return cell_story

    triage_data = [
        [Paragraph(f"{trans['severity']}:", body_bold), Paragraph(f"<b>{severity_val} RISK</b>", body_bold)],
        [Paragraph(f"{trans['condition']}:", body_bold), Paragraph(triage.get("likely_condition", "N/A"), body_normal)],
        [Paragraph("Immediate Actions:", body_bold), make_cell(actions_para)],
        [Paragraph("Red Flags to Watch:", body_bold), make_cell(flags_para)],
        [Paragraph("First Aid / Suppliments:", body_bold), Paragraph(str(triage.get("drug_first_aid", "None")), body_normal)]
    ]
    triage_table = Table(triage_data, colWidths=[45*mm, 135*mm])
    triage_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(triage_table)
    story.append(Spacer(1, 4*mm))
    
    # SECTION 5: REFERRAL INSTRUCTION
    story.append(Paragraph(trans["instruction"], section_title))
    fac = req.facility
    
    instruction_data = [
        [Paragraph("Refer To:", body_bold), Paragraph(fac.get("name", "Nearest PHC/CHC Outpost"), body_normal),
         Paragraph("Urgency timeframe:", body_bold), Paragraph(triage.get("refer_timeframe", "Routine"), body_bold)],
        [Paragraph("Address Outpost:", body_bold), Paragraph(fac.get("address", "NHM Rural Outpost Junction"), body_normal),
         Paragraph("Contact Helpline:", body_bold), Paragraph(fac.get("phone", "108"), body_normal)]
    ]
    
    ins_table = Table(instruction_data, colWidths=[35*mm, 55*mm, 35*mm, 55*mm])
    ins_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(ins_table)
    story.append(Spacer(1, 5*mm))
    
    # SECTION 6: ASHA SIGNATURE BLOCK
    story.append(Paragraph(trans["asha_sign"], section_title))
    asha_data = [
        [Paragraph(f"ASHA Name: {req.asha_name}", body_normal), Paragraph("ASHA ID: " + req.asha_id, body_normal), Paragraph("Date: __________________", body_normal)],
        [Paragraph(f"Phone: {req.asha_phone}", body_normal), Paragraph(f"Village/Ward: {req.village}", body_normal), Paragraph("ASHA Signature: [ Box below ]", body_normal)],
        ["", "", ""], # space for signing box
        ["", "", ""]
    ]
    
    asha_table = Table(asha_data, colWidths=[60*mm, 60*mm, 60*mm])
    asha_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,1), 0.5, colors.black), # grid for credentials
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOX', (2, 1), (2, 3), 1, colors.black), # signature signoff box bounds
    ]))
    story.append(asha_table)
    story.append(Spacer(1, 6*mm))
    
    # SECTION 7: DISCLAIMER (Bilingual disclaimer and Helpline 108/112)
    story.append(line_table)
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(f"<b>BILINGUAL DISCLAIMER:</b> {trans['disclaimer']}", small_disclaimer))
    story.append(Spacer(1, 1.5*mm))
    story.append(Paragraph("<b>🚨 EMERGENCY SERVICES: DIAL 108 FOR AMBULANCE Outpost OR 112 GENERAL HELPLINE IMMEDIATELY!</b>", body_bold))
    
    # Render document
    doc.build(story)
    
    buffer.seek(0)
    return buffer.getvalue()

async def translate_to_english(text: str, source_lang: str) -> str:
    if not text or not source_lang or source_lang == "en":
        return text
    # Clean language code (e.g. "hi-IN" -> "hi")
    lang = source_lang.split("-")[0].lower()
    if lang == "en":
        return text
    try:
        # Try gemini translate to English
        res = await _gemini_translate(text, lang, "en")
        if res:
            return res
    except Exception as e:
        logger.warning(f"Gemini translation to English failed: {e}")
    
    try:
        # Try glossary fallback
        res = _glossary_translate(text, lang, "en")
        if res:
            return res
    except Exception as e:
        logger.warning(f"Glossary translation to English failed: {e}")
        
    return text

@router.post("/referral")
async def generate_referral(req: ReferralRequest):
    try:
        source_lang = req.language_code
        
        # Translate clinical / patient details to English
        # 1. Symptoms English fallback
        if not req.symptoms_english and req.symptoms_original:
            req.symptoms_english = await translate_to_english(req.symptoms_original, source_lang)
        elif req.symptoms_original:
            req.symptoms_english = await translate_to_english(req.symptoms_original, source_lang)
            
        # 2. ASHA notes
        triage = req.triage_result or {}
        if "asha_note" in triage and triage["asha_note"]:
            triage["asha_note"] = await translate_to_english(triage["asha_note"], source_lang)
            
        # 3. Immediate actions list
        if "immediate_actions" in triage and triage["immediate_actions"]:
            translated_actions = []
            for action in triage["immediate_actions"]:
                translated_action = await translate_to_english(action, source_lang)
                translated_actions.append(translated_action)
            triage["immediate_actions"] = translated_actions
            
        # 4. Red flags list
        if "red_flags" in triage and triage["red_flags"]:
            translated_flags = []
            for flag in triage["red_flags"]:
                translated_flag = await translate_to_english(flag, source_lang)
                translated_flags.append(translated_flag)
            triage["red_flags"] = translated_flags
            
        # 5. Likely condition
        if "likely_condition" in triage and triage["likely_condition"]:
            triage["likely_condition"] = await translate_to_english(triage["likely_condition"], source_lang)
            
        # 6. Drug/First aid
        if "drug_first_aid" in triage and triage["drug_first_aid"]:
            triage["drug_first_aid"] = await translate_to_english(triage["drug_first_aid"], source_lang)
            
        # 7. Facility name and address
        fac = req.facility or {}
        if "name" in fac and fac["name"]:
            fac["name"] = await translate_to_english(fac["name"], source_lang)
        if "address" in fac and fac["address"]:
            fac["address"] = await translate_to_english(fac["address"], source_lang)
            
        req.triage_result = triage
        req.facility = fac

        # Force English translation headers for the PDF slip as requested
        translated = REGIONAL_TRANSLATIONS["default"]
        
        # Build document
        pdf_bytes = build_referral_pdf(req, translated)
        
        return Response(
            pdf_bytes, 
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="referral_{req.patient_name}.pdf"'}
        )
    except Exception as e:
        logger.exception("PDF generation failed:")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
