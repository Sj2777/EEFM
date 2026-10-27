import os
import datetime
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.core.config import settings


def generate_assessment_pdf(data: Dict[str, Any]) -> str:
    """
    Generates a branded PDF assessment report for a given applicant assessment.
    Returns the absolute path to the generated PDF.
    """
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    assessment_id = data.get("assessment_id", f"ASM_{int(datetime.datetime.utcnow().timestamp())}")
    filename = f"AltScore_Assessment_{assessment_id}.pdf"
    filepath = os.path.join(settings.REPORTS_DIR, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0c1a2e')
    )
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b')
    )
    section_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#64748b')
    )

    elements = []

    # Header
    elements.append(Paragraph("AltScore — Credit Assessment Report", title_style))
    elements.append(Paragraph("Alternative Financial & Stability Indicators Analysis (Educational Prototype)", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceBefore=2, spaceAfter=12))

    # Assessment Summary Table
    score = data.get("score", 0)
    risk_level = data.get("risk_level", "N/A")
    pred_category = data.get("predicted_category", "N/A")
    prob = round(data.get("repayment_probability", 0) * 100, 1)

    summary_data = [
        [
            Paragraph("<b>Applicant ID:</b>", body_style), Paragraph(str(data.get("applicant_id", "N/A")), body_style),
            Paragraph("<b>Assessment ID:</b>", body_style), Paragraph(str(assessment_id), body_style),
        ],
        [
            Paragraph("<b>Experimental Score:</b>", body_style), Paragraph(f"<b>{score}</b> / 900", body_style),
            Paragraph("<b>Risk Category:</b>", body_style), Paragraph(f"<b>{risk_level}</b>", body_style),
        ],
        [
            Paragraph("<b>Predicted Outcome:</b>", body_style), Paragraph(f"<b>{pred_category}</b>", body_style),
            Paragraph("<b>Repayment Likelihood:</b>", body_style), Paragraph(f"{prob}%", body_style),
        ],
        [
            Paragraph("<b>Assessment Date:</b>", body_style), Paragraph(str(data.get("created_at", datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M"))), body_style),
            Paragraph("<b>Model Version:</b>", body_style), Paragraph(str(data.get("model_version", "rf-v1.0")), body_style),
        ]
    ]

    t_summary = Table(summary_data, colWidths=[110, 150, 110, 170])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(t_summary)
    elements.append(Spacer(1, 12))

    # Applicant Reported Alternative Profile
    elements.append(Paragraph("Reported Alternative Profile", section_style))
    applicant = data.get("applicant_data", {})
    profile_rows = [
        [
            Paragraph("<b>Age:</b>", body_style), Paragraph(str(applicant.get("age", "N/A")), body_style),
            Paragraph("<b>Employment Status:</b>", body_style), Paragraph(str(applicant.get("employment_status", "N/A")), body_style),
        ],
        [
            Paragraph("<b>Educational Background:</b>", body_style), Paragraph(str(applicant.get("educational_background", "N/A")), body_style),
            Paragraph("<b>Bank Account Tenure:</b>", body_style), Paragraph(str(applicant.get("bank_account_tenure", "N/A")), body_style),
        ],
        [
            Paragraph("<b>Residential Stability:</b>", body_style), Paragraph(str(applicant.get("residential_stability", "N/A")), body_style),
            Paragraph("<b>Rent Payment History:</b>", body_style), Paragraph(str(applicant.get("rent_payment_history", "N/A")), body_style),
        ],
        [
            Paragraph("<b>Utility Payment History:</b>", body_style), Paragraph(str(applicant.get("utility_payment_history", "N/A")), body_style),
            Paragraph("<b>Telecom Payment History:</b>", body_style), Paragraph(str(applicant.get("telecommunications_payment_history", "N/A")), body_style),
        ],
        [
            Paragraph("<b>Savings Habit:</b>", body_style), Paragraph(str(applicant.get("savings_pattern", "N/A")), body_style),
            Paragraph("<b>Gig Economy Participation:</b>", body_style), Paragraph(str(applicant.get("gig_economy_participation", "None")), body_style),
        ]
    ]
    t_profile = Table(profile_rows, colWidths=[130, 130, 140, 140])
    t_profile.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t_profile)
    elements.append(Spacer(1, 12))

    # Key Factors
    elements.append(Paragraph("Key Indicator Weights & Explainability", section_style))
    factors = data.get("key_factors", {})
    if factors:
        factor_rows = [[Paragraph("<b>Alternative Financial Indicator</b>", body_style), Paragraph("<b>Relative Model Weight</b>", body_style)]]
        for factor_name, weight in factors.items():
            factor_rows.append([Paragraph(factor_name, body_style), Paragraph(f"{weight}%", body_style)])
        
        t_factors = Table(factor_rows, colWidths=[350, 190])
        t_factors.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f1f5f9')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_factors)
        elements.append(Spacer(1, 10))

    # Suggestions for Improvement
    suggestions = data.get("suggestions", [])
    if suggestions:
        elements.append(Paragraph("Suggestions for Repayment Record Improvement", section_style))
        for s in suggestions:
            elements.append(Paragraph(f"• {s}", body_style))
            elements.append(Spacer(1, 3))
        elements.append(Spacer(1, 10))

    # Prototype Disclaimer
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e2e8f0'), spaceBefore=8, spaceAfter=8))
    disclaimer_text = (
        "<b>Educational & Prototype Disclaimer:</b> AltScore is an experimental research prototype utilizing synthetic data. "
        "Scores and repayment predictions are illustrative and have not been validated for real-world underwriting, lending, "
        "or credit bureau reporting. Feature weights demonstrate statistical associations within simulated models and do not "
        "represent causal guarantees."
    )
    elements.append(Paragraph(disclaimer_text, disclaimer_style))

    doc.build(elements)
    return filepath


def generate_analytics_pdf(summary_data: Dict[str, Any]) -> str:
    """
    Generates a summary PDF of all aggregated applicant analytics and score distributions.
    """
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    filename = f"AltScore_Analytics_Summary_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(settings.REPORTS_DIR, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('DocTitle', parent=styles['Heading1'], fontSize=20, leading=24, textColor=colors.HexColor('#0c1a2e'))
    subtitle_style = ParagraphStyle('DocSub', parent=styles['Normal'], fontSize=10, leading=14, textColor=colors.HexColor('#64748b'))
    section_style = ParagraphStyle('SectionHeading', parent=styles['Heading2'], fontSize=12, leading=15, textColor=colors.HexColor('#1e293b'), spaceBefore=8, spaceAfter=6)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=9, leading=13, textColor=colors.HexColor('#334155'))

    elements = []
    elements.append(Paragraph("AltScore — Aggregate Analytics & Performance Report", title_style))
    elements.append(Paragraph(f"Generated on {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceBefore=2, spaceAfter=12))

    # Metrics Table
    total = summary_data.get("total_applicants", 0)
    avg_score = summary_data.get("average_experimental_score", 0)
    low_risk = summary_data.get("low_risk_count", 0)
    low_pct = summary_data.get("low_risk_percentage", 0)
    high_risk = summary_data.get("high_risk_count", 0)
    high_pct = summary_data.get("high_risk_percentage", 0)

    metrics_rows = [
        [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Value</b>", body_style)],
        [Paragraph("Total Evaluated Applicants", body_style), Paragraph(str(total), body_style)],
        [Paragraph("Average Experimental Score", body_style), Paragraph(f"{avg_score} / 900", body_style)],
        [Paragraph("Low-Risk Applicants (Good)", body_style), Paragraph(f"{low_risk} ({low_pct}%)", body_style)],
        [Paragraph("High-Risk Applicants", body_style), Paragraph(f"{high_risk} ({high_pct}%)", body_style)],
    ]
    t_metrics = Table(metrics_rows, colWidths=[300, 240])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(t_metrics)
    elements.append(Spacer(1, 14))

    # Score Bands Table
    elements.append(Paragraph("Score Range Distribution", section_style))
    score_dist = summary_data.get("score_distribution", [])
    if score_dist:
        dist_rows = [[Paragraph("<b>Score Range</b>", body_style), Paragraph("<b>Category</b>", body_style), Paragraph("<b>Applicant Count</b>", body_style)]]
        for row in score_dist:
            dist_rows.append([
                Paragraph(row.get("range", ""), body_style),
                Paragraph(row.get("label", ""), body_style),
                Paragraph(str(row.get("count", 0)), body_style),
            ])
        t_dist = Table(dist_rows, colWidths=[180, 180, 180])
        t_dist.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f1f5f9')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_dist)

    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e2e8f0'), spaceBefore=8, spaceAfter=8))
    elements.append(Paragraph("AltScore is an educational prototype using synthetic data. Scores and predictions are experimental.", subtitle_style))

    doc.build(elements)
    return filepath
