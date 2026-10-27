import json
import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.applicant import Assessment, Applicant
from app.services.report_service import generate_assessment_pdf, generate_analytics_pdf
from app.api.dashboard import get_dashboard_summary

router = APIRouter()


@router.get("/reports/assessments/{assessment_id}")
def download_assessment_report(assessment_id: str, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.assessment_id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail=f"Assessment '{assessment_id}' not found.")

    applicant = db.query(Applicant).filter(Applicant.applicant_id == assessment.applicant_id).first()

    data = {
        "assessment_id": assessment.assessment_id,
        "applicant_id": assessment.applicant_id,
        "score": assessment.score,
        "risk_level": assessment.risk_level,
        "predicted_category": assessment.predicted_category,
        "repayment_probability": assessment.repayment_probability,
        "key_factors": json.loads(assessment.key_factors_json) if assessment.key_factors_json else {},
        "suggestions": json.loads(assessment.suggestions_json) if assessment.suggestions_json else [],
        "model_version": assessment.model_version,
        "created_at": assessment.created_at.strftime("%Y-%m-%d %H:%M UTC"),
        "applicant_data": {
            "name": applicant.name if applicant else "N/A",
            "age": applicant.age if applicant else "N/A",
            "employment_status": applicant.employment_status if applicant else "N/A",
            "educational_background": applicant.educational_background if applicant else "N/A",
            "bank_account_tenure": applicant.bank_account_tenure if applicant else "N/A",
            "residential_stability": applicant.residential_stability if applicant else "N/A",
            "rent_payment_history": applicant.rent_payment_history if applicant else "N/A",
            "utility_payment_history": applicant.utility_payment_history if applicant else "N/A",
            "telecommunications_payment_history": applicant.telecommunications_payment_history if applicant else "N/A",
            "savings_pattern": applicant.savings_pattern if applicant else "N/A",
            "gig_economy_participation": applicant.gig_economy_participation if applicant else "None",
        }
    }

    filepath = generate_assessment_pdf(data)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=500, detail="Failed to generate PDF report.")

    filename = os.path.basename(filepath)
    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/reports/analytics")
def download_analytics_report(db: Session = Depends(get_db)):
    summary = get_dashboard_summary(db)
    filepath = generate_analytics_pdf(summary)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=500, detail="Failed to generate Analytics PDF report.")

    filename = os.path.basename(filepath)
    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
