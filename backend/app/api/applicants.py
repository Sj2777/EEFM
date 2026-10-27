import datetime
import json
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from app.db.database import get_db
from app.models.applicant import Applicant, Assessment
from app.schemas.applicant import (
    ApplicantCreate,
    ApplicantResponse,
    ApplicantDetailResponse,
    AssessmentResponse
)
from app.services.scoring_service import score_applicant_record

router = APIRouter()


@router.post("/applicants", status_code=status.HTTP_201_CREATED)
def create_applicant_and_assessment(
    payload: ApplicantCreate,
    db: Session = Depends(get_db)
):
    # Auto-generate applicant ID if missing or empty
    applicant_id = payload.applicant_id.strip() if payload.applicant_id else ""
    if not applicant_id:
        count = db.query(Applicant).count() + 1
        applicant_id = f"A{count:04d}"

    # Check for duplicate applicant ID
    existing = db.query(Applicant).filter(Applicant.applicant_id == applicant_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Applicant ID '{applicant_id}' already exists. Please provide a unique ID or leave blank to auto-generate."
        )

    # 1. Run scoring pipeline on submitted financial features
    applicant_dict = payload.model_dump()
    scoring_result = score_applicant_record(applicant_dict)

    # 2. Persist Applicant
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

    # 3. Persist Assessment
    ts_ms = int(datetime.datetime.utcnow().timestamp() * 1000)
    rand_suffix = uuid.uuid4().hex[:4]
    assessment_id = f"ASM_{applicant_id}_{ts_ms}_{rand_suffix}"
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
    )
    db.add(assessment)
    db.commit()
    db.refresh(applicant)
    db.refresh(assessment)

    return {
        "applicant": {
            "id": applicant.id,
            "applicant_id": applicant.applicant_id,
            "name": applicant.name,
            "age": applicant.age,
            "employment_status": applicant.employment_status,
            "educational_background": applicant.educational_background,
            "bank_account_tenure": applicant.bank_account_tenure,
            "residential_stability": applicant.residential_stability,
            "utility_payment_history": applicant.utility_payment_history,
            "rent_payment_history": applicant.rent_payment_history,
            "telecommunications_payment_history": applicant.telecommunications_payment_history,
            "savings_pattern": applicant.savings_pattern,
            "gig_economy_participation": applicant.gig_economy_participation,
            "created_at": applicant.created_at,
            "updated_at": applicant.updated_at,
        },
        "assessment": {
            "assessment_id": assessment.assessment_id,
            "applicant_id": assessment.applicant_id,
            "score": assessment.score,
            "risk_level": assessment.risk_level,
            "predicted_category": assessment.predicted_category,
            "repayment_probability": assessment.repayment_probability,
            "class_probabilities": json.loads(assessment.class_probabilities_json),
            "key_factors": json.loads(assessment.key_factors_json),
            "suggestions": json.loads(assessment.suggestions_json),
            "summary_text": scoring_result["summary_text"],
            "model_version": assessment.model_version,
            "created_at": assessment.created_at,
            "disclaimer": scoring_result["disclaimer"]
        }
    }


@router.get("/applicants")
def list_applicants(
    search: Optional[str] = Query(None, description="Search by ID or name"),
    employment_status: Optional[str] = Query(None, description="Filter by employment status"),
    risk_level: Optional[str] = Query(None, description="Filter by risk category (Good, Fair, Poor, High Risk)"),
    score_min: Optional[int] = Query(None, ge=300, le=900),
    score_max: Optional[int] = Query(None, ge=300, le=900),
    sort_by: str = Query("date", description="Sort by 'date', 'score', or 'id'"),
    sort_order: str = Query("desc", description="'asc' or 'desc'"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Applicant)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter((Applicant.applicant_id.ilike(search_term)) | (Applicant.name.ilike(search_term)))

    if employment_status and employment_status.lower() != "all":
        query = query.filter(Applicant.employment_status.ilike(employment_status))

    # Join latest assessment for risk level / score filters
    if risk_level and risk_level.lower() != "all":
        query = query.join(Assessment).filter(Assessment.risk_level.ilike(risk_level))

    if score_min is not None:
        query = query.join(Assessment).filter(Assessment.score >= score_min)

    if score_max is not None:
        query = query.join(Assessment).filter(Assessment.score <= score_max)

    # Sorting
    if sort_by == "score":
        order_col = Assessment.score
        query = query.outerjoin(Assessment)
    elif sort_by == "id":
        order_col = Applicant.applicant_id
    else:
        order_col = Applicant.created_at

    if sort_order == "asc":
        query = query.order_by(asc(order_col))
    else:
        query = query.order_by(desc(order_col))

    total = query.distinct().count()
    applicants = query.distinct().offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for a in applicants:
        latest = a.assessments[0] if a.assessments else None
        items.append({
            "id": a.id,
            "applicant_id": a.applicant_id,
            "name": a.name or f"Applicant {a.applicant_id}",
            "age": a.age,
            "employment_status": a.employment_status,
            "educational_background": a.educational_background,
            "bank_account_tenure": a.bank_account_tenure,
            "residential_stability": a.residential_stability,
            "rent_payment_history": a.rent_payment_history,
            "utility_payment_history": a.utility_payment_history,
            "telecommunications_payment_history": a.telecommunications_payment_history,
            "savings_pattern": a.savings_pattern,
            "gig_economy_participation": a.gig_economy_participation,
            "score": latest.score if latest else None,
            "risk_level": latest.risk_level if latest else "Not Scored",
            "predicted_category": latest.predicted_category if latest else "Pending",
            "assessment_id": latest.assessment_id if latest else None,
            "created_at": a.created_at.strftime("%b %d, %Y"),
            "date": latest.created_at.strftime("%b %d, %Y") if latest else a.created_at.strftime("%b %d, %Y")
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 1
    }


@router.get("/applicants/{applicant_id}")
def get_applicant_detail(applicant_id: str, db: Session = Depends(get_db)):
    applicant = db.query(Applicant).filter(Applicant.applicant_id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail=f"Applicant '{applicant_id}' not found.")

    assessments = []
    for a in applicant.assessments:
        assessments.append({
            "assessment_id": a.assessment_id,
            "applicant_id": a.applicant_id,
            "score": a.score,
            "risk_level": a.risk_level,
            "predicted_category": a.predicted_category,
            "repayment_probability": a.repayment_probability,
            "class_probabilities": json.loads(a.class_probabilities_json) if a.class_probabilities_json else {},
            "key_factors": json.loads(a.key_factors_json) if a.key_factors_json else {},
            "suggestions": json.loads(a.suggestions_json) if a.suggestions_json else [],
            "model_version": a.model_version,
            "created_at": a.created_at.isoformat(),
            "date": a.created_at.strftime("%b %d, %Y %H:%M")
        })

    latest = assessments[0] if assessments else None

    return {
        "applicant_id": applicant.applicant_id,
        "name": applicant.name or f"Applicant {applicant.applicant_id}",
        "age": applicant.age,
        "employment_status": applicant.employment_status,
        "educational_background": applicant.educational_background,
        "bank_account_tenure": applicant.bank_account_tenure,
        "residential_stability": applicant.residential_stability,
        "rent_payment_history": applicant.rent_payment_history,
        "utility_payment_history": applicant.utility_payment_history,
        "telecommunications_payment_history": applicant.telecommunications_payment_history,
        "savings_pattern": applicant.savings_pattern,
        "gig_economy_participation": applicant.gig_economy_participation,
        "created_at": applicant.created_at.isoformat(),
        "latest_assessment": latest,
        "assessments": assessments
    }


@router.get("/applicants/{applicant_id}/assessments")
def get_applicant_assessments(applicant_id: str, db: Session = Depends(get_db)):
    applicant = db.query(Applicant).filter(Applicant.applicant_id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail=f"Applicant '{applicant_id}' not found.")

    return [
        {
            "assessment_id": a.assessment_id,
            "applicant_id": a.applicant_id,
            "score": a.score,
            "risk_level": a.risk_level,
            "predicted_category": a.predicted_category,
            "repayment_probability": a.repayment_probability,
            "class_probabilities": json.loads(a.class_probabilities_json) if a.class_probabilities_json else {},
            "key_factors": json.loads(a.key_factors_json) if a.key_factors_json else {},
            "suggestions": json.loads(a.suggestions_json) if a.suggestions_json else [],
            "model_version": a.model_version,
            "created_at": a.created_at.isoformat(),
            "date": a.created_at.strftime("%b %d, %Y %H:%M")
        }
        for a in applicant.assessments
    ]


@router.post("/applicants/{applicant_id}/assessments", status_code=status.HTTP_201_CREATED)
def reassess_applicant(
    applicant_id: str,
    payload: ApplicantCreate,
    db: Session = Depends(get_db)
):
    """
    Reassesses an existing applicant with newly submitted alternative financial indicators,
    updating the applicant attributes while preserving all past assessment history.
    """
    applicant = db.query(Applicant).filter(Applicant.applicant_id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail=f"Applicant '{applicant_id}' not found.")

    # Update applicant attributes
    applicant.age = payload.age
    applicant.employment_status = payload.employment_status
    applicant.educational_background = payload.educational_background
    applicant.bank_account_tenure = payload.bank_account_tenure
    applicant.residential_stability = payload.residential_stability
    applicant.rent_payment_history = payload.rent_payment_history
    applicant.utility_payment_history = payload.utility_payment_history
    applicant.telecommunications_payment_history = payload.telecommunications_payment_history
    applicant.savings_pattern = payload.savings_pattern
    if payload.gig_economy_participation:
        applicant.gig_economy_participation = payload.gig_economy_participation
    applicant.updated_at = datetime.datetime.utcnow()

    # Run ML scoring pipeline
    scoring_result = score_applicant_record(payload.model_dump())

    # Create new historical assessment record
    ts_ms = int(datetime.datetime.utcnow().timestamp() * 1000)
    rand_suffix = uuid.uuid4().hex[:4]
    assessment_id = f"ASM_{applicant_id}_{ts_ms}_{rand_suffix}"
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
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return {
        "assessment_id": assessment.assessment_id,
        "applicant_id": assessment.applicant_id,
        "score": assessment.score,
        "risk_level": assessment.risk_level,
        "predicted_category": assessment.predicted_category,
        "repayment_probability": assessment.repayment_probability,
        "class_probabilities": json.loads(assessment.class_probabilities_json),
        "key_factors": json.loads(assessment.key_factors_json),
        "suggestions": json.loads(assessment.suggestions_json),
        "summary_text": scoring_result["summary_text"],
        "model_version": assessment.model_version,
        "created_at": assessment.created_at,
        "disclaimer": scoring_result["disclaimer"]
    }
