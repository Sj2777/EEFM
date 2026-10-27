import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.applicant import Assessment, Applicant

router = APIRouter()


@router.get("/assessments/{assessment_id}")
def get_assessment(assessment_id: str, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.assessment_id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail=f"Assessment '{assessment_id}' not found.")

    applicant = db.query(Applicant).filter(Applicant.applicant_id == assessment.applicant_id).first()

    key_factors = json.loads(assessment.key_factors_json) if assessment.key_factors_json else {}
    suggestions = json.loads(assessment.suggestions_json) if assessment.suggestions_json else []
    class_probabilities = json.loads(assessment.class_probabilities_json) if assessment.class_probabilities_json else {}

    applicant_data = {}
    if applicant:
        applicant_data = {
            "name": applicant.name,
            "age": applicant.age,
            "employment_status": applicant.employment_status,
            "educational_background": applicant.educational_background,
            "bank_account_tenure": applicant.bank_account_tenure,
            "residential_stability": applicant.residential_stability,
            "rent_payment_history": applicant.rent_payment_history,
            "utility_payment_history": applicant.utility_payment_history,
            "telecommunications_payment_history": applicant.telecommunications_payment_history,
            "savings_pattern": applicant.savings_pattern,
            "gig_economy_participation": applicant.gig_economy_participation
        }

    return {
        "assessment_id": assessment.assessment_id,
        "applicant_id": assessment.applicant_id,
        "score": assessment.score,
        "risk_level": assessment.risk_level,
        "predicted_category": assessment.predicted_category,
        "repayment_probability": assessment.repayment_probability,
        "class_probabilities": class_probabilities,
        "key_factors": key_factors,
        "suggestions": suggestions,
        "model_version": assessment.model_version,
        "created_at": assessment.created_at.isoformat(),
        "date": assessment.created_at.strftime("%b %d, %Y %H:%M"),
        "applicant_data": applicant_data,
        "disclaimer": "AltScore is an educational prototype using synthetic data. Scores and predictions are experimental and have not been validated for real-world lending decisions."
    }
