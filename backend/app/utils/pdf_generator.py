import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm

def generate_bw_referral_pdf(record_data: dict, filepath: str):
    """
    Generates a secure, high-contrast, black-and-white A4 referral slip.
    Optimized for budget printers in rural primary health centers.
    """
    # Initialize page container
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=15*mm,
        leftMargin=15*mm,
        topMargin=15*mm,
        bottomMargin=15*mm
    )
    
    styles = getSampleStyleSheet()
    
    # Custom high-contrast styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.black,
        alignment=0 # Left
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.gray
    )
    
    section_title = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.black,
        spaceBefore=10,
        spaceAfter=5
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.black
    )
    
    body_normal = ParagraphStyle(
        'BodyNormal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.black
    )
    
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10,
        textColor=colors.black
    )

    story = []
    
    # Header Banner
    story.append(Paragraph("AAROGYASETU AI — REFERRAL SLIP", title_style))
    story.append(Paragraph("National Health Mission (NHM) Rural Outpost Diagnostic Triage", subtitle_style))
    story.append(Spacer(1, 5*mm))
    
    # Draw double line break using Table borders
    line_table = Table([[""]], colWidths=[180*mm])
    line_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 1.5, colors.black),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0)
    ]))
    story.append(line_table)
    story.append(Spacer(1, 5*mm))
    
    # Patient Secure Identification Data Block
    story.append(Paragraph("SECURE REFERRAL IDENTIFICATION", section_title))
    
    # Telemetry PHI masking for secure printing (Global Rule #2)
    raw_name = record_data.get("name", "Unknown")
    masked_name = raw_name[0] + "***" + raw_name[-1] if len(raw_name) > 1 else "*"
    raw_village = record_data.get("village", "Unknown")
    masked_village = raw_village[0] + "***" if len(raw_village) > 0 else "*"
    raw_age = record_data.get("age", 0)
    age_cohort = f"{ (int(raw_age) // 10) * 10 }s"

    info_data = [
        [Paragraph("Referral Slip ID:", body_bold), Paragraph(record_data.get("referralId", "N/A"), body_normal),
         Paragraph("Created Date:", body_bold), Paragraph(record_data.get("timestamp", "N/A"), body_normal)],
        [Paragraph("Patient Name:", body_bold), Paragraph(f"{masked_name} (Masked PHI)", body_normal),
         Paragraph("Age Cohort:", body_bold), Paragraph(f"{age_cohort} Category", body_normal)],
        [Paragraph("Gender Profile:", body_bold), Paragraph(record_data.get("gender", "N/A"), body_normal),
         Paragraph("Village Outpost:", body_bold), Paragraph(f"{masked_village} (Masked PHI)", body_normal)]
    ]
    
    info_table = Table(info_data, colWidths=[35*mm, 55*mm, 35*mm, 55*mm])
    info_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 6*mm))
    
    # Clinical Screening Metrics Table
    story.append(Paragraph("CLINICAL TRIAGE ASSESSMENT", section_title))
    
    symptom_para = Paragraph(record_data.get("symptoms", "No symptoms transcript detailed."), body_normal)
    severity_para = Paragraph(f"<b>{record_data.get('severity', 'LOW')} RISK PROFILE</b>", body_bold)
    
    triage_data = [
        [Paragraph("Reported Symptoms:", body_bold), symptom_para],
        [Paragraph("Classified Severity:", body_bold), severity_para]
    ]
    
    triage_table = Table(triage_data, colWidths=[45*mm, 135*mm])
    triage_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(triage_table)
    story.append(Spacer(1, 6*mm))
    
    # ASHA Guidance steps
    story.append(Paragraph("RECOMMENDED PROTOCOL PROCEDURES", section_title))
    
    action_paragraphs = []
    for idx, act in enumerate(record_data.get("actionSteps", [])):
        action_paragraphs.append(Paragraph(f"<b>{idx+1}.</b> {act}", body_normal))
        
    if not action_paragraphs:
        action_paragraphs.append(Paragraph("No emergency intervention required. Monitor patient locally.", body_normal))
        
    action_data = [[p] for p in action_paragraphs]
    action_table = Table(action_data, colWidths=[180*mm])
    action_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.gray),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(action_table)
    story.append(Spacer(1, 8*mm))
    
    # Signatures
    sig_data = [
        [Paragraph("ASHA Worker Signature", body_bold), Paragraph("Medical Officer / PHC Superintendent", body_bold)],
        ["", ""], # Space for actual physical signing
        [Paragraph("_____________________________", body_normal), Paragraph("_____________________________", body_normal)]
    ]
    sig_table = Table(sig_data, colWidths=[90*mm, 90*mm])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 10*mm))
    
    # Bottom Disclaimer and Emergency contact (Global Rule #3 & #10)
    story.append(line_table)
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph("<b>DISCLAIMER:</b> AarogyaSetu AI is an artificial intelligence triage assist tool aligned with primary NHM protocols. It does not compile official diagnostics or medicinal prescriptions. Verify physical vitals immediately.", disclaimer_style))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph("<b>EMERGENCY HOTLINE: Dial 112 immediately in case of high cardiac or respiratory failure.</b>", body_bold))
    
    # Write file out
    doc.build(story)
