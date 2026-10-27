import datetime
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.applicant import Applicant, Assessment
from app.schemas.applicant import ScoreRequest, ScoreResponse
from app.services.scoring_service import score_applicant_record

router = APIRouter()


@router.post("/score", response_model=ScoreResponse)
def evaluate_applicant_score(
    payload: ScoreRequest,
    db: Session = Depends(get_db)
):
    applicant_data = payload.model_dump()
    scoring_result = score_applicant_record(applicant_data)

    applicant_id = payload.applicant_id.strip() if payload.applicant_id else ""
    if not applicant_id:
        count = db.query(Applicant).count() + 1
        applicant_id = f"A{count:04d}"

    ts_ms = int(datetime.datetime.utcnow().timestamp() * 1000)
    rand_suffix = uuid.uuid4().hex[:4]
    assessment_id = f"ASM_{applicant_id}_{ts_ms}_{rand_suffix}"
    now = datetime.datetime.utcnow()

    # If persist is True, save to database
    if payload.persist:
        applicant = db.query(Applicant).filter(Applicant.applicant_id == applicant_id).first()
        if not applicant:
            applicant = Applicant(
                applicant_id=applicant_id,
                name=payload.name or f"Applicant {applicant_id}",
                age=payload.age,
                employment_status=payload.employment_status,
                educational_background=payload.educational_background,
                bank_account_tenure=payload.bank_account_tenure,
                residential_stability=payload.residential_stability,
                utility_payment_history=payload.utility_payment_history,
                rent_payment_history=payload.rent_payment_history,
                telecommunications_payment_history=payload.telecommunications_payment_history,
                savings_pattern=payload.savings_pattern,
                gig_economy_participation=payload.gig_economy_participation or "None",
            )
            db.add(applicant)
            db.flush()
        else:
            # Update attributes
            applicant.age = payload.age
            applicant.employment_status = payload.employment_status
            applicant.educational_background = payload.educational_background
            applicant.bank_account_tenure = payload.bank_account_tenure
            applicant.residential_stability = payload.residential_stability
            applicant.utility_payment_history = payload.utility_payment_history
            applicant.rent_payment_history = payload.rent_payment_history
            applicant.telecommunications_payment_history = payload.telecommunications_payment_history
            applicant.savings_pattern = payload.savings_pattern
            if payload.gig_economy_participation:
                applicant.gig_economy_participation = payload.gig_economy_participation
            applicant.updated_at = now

        assessment = Assessment(
            assessment_id=assessment_id,
            applicant_id=applicant_id,
            score=scoring_result["score"],
            risk_level=scoring_result["risk_level"],
            predicted_category=scoring_result["predicted_category"],
            repayment_probability=scoring_result["repayment_probability"],
            class_probabilities_json=json.dumps(scoring_result["class_probabilities"]),
            key_factors_json=json.dumps(scoring_result["key_factors"]),
            suggestions_json=json.dumps(scoring_result["suggestions"]),
            model_version=scoring_result["model_version"],
            created_at=now
        )
        db.add(assessment)
        db.commit()

    return ScoreResponse(
        applicant_id=applicant_id,
        assessment_id=assessment_id,
        score=scoring_result["score"],
        risk_level=scoring_result["risk_level"],
        predicted_category=scoring_result["predicted_category"],
        repayment_probability=scoring_result["repayment_probability"],
        class_probabilities=scoring_result["class_probabilities"],
        key_factors=scoring_result["key_factors"],
        suggestions=scoring_result["suggestions"],
        summary_text=scoring_result["summary_text"],
        model_version=scoring_result["model_version"],
        created_at=now,
        disclaimer=scoring_result["disclaimer"]
    )
