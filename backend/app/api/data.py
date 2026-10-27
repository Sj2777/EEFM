import io
import os
import pandas as pd
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.applicant import Applicant, Assessment
from app.core.config import settings
from scripts.train_model import CORE_FEATURES, TARGET_COLUMN

router = APIRouter()


@router.get("/data/sample")
def download_sample_data():
    """
    Provides a downloadable sample CSV containing 10 valid alternative credit profiles.
    """
    if os.path.exists(settings.DEFAULT_DATASET_PATH):
        df = pd.read_csv(settings.DEFAULT_DATASET_PATH)
        sample_df = df.head(10)
    else:
        sample_data = {
            "Profile_ID": ["A0001", "A0002"],
            "Age": [28, 42],
            "Employment_Status": ["Salaried", "Freelancer"],
            "Educational_Background": ["Graduate", "Postgraduate"],
            "Bank_Account_Tenure": ["2–5 years", "More than 5 years"],
            "Residential_Stability": ["1–3 years", "More than 3 years"],
            "Rent_Payment_History": ["Always on time", "Mostly on time"],
            "Utility_Payment_History": ["Always on time", "Mostly on time"],
            "Telecommunications_Payment_History": ["Always on time", "Always on time"],
            "Savings_Pattern": ["Regular savings", "Some savings"],
            "Gig_Economy_Participation": ["None", "Part-Time"],
            "Repayment_Status": ["Paid on Time", "Paid on Time"]
        }
        sample_df = pd.DataFrame(sample_data)

    stream = io.StringIO()
    sample_df.to_csv(stream, index=False)
    response = Response(content=stream.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=AltScore_Sample_Dataset.csv"
    return response


@router.post("/data/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    preview_only: bool = False,
    db: Session = Depends(get_db)
):
    """
    Validates uploaded CSV dataset schema and categories without blindly trusting input.
    Can preview or import into dataset directory.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded CSV has no records.")

    # Validation checks
    missing_cols = [col for col in CORE_FEATURES if col not in df.columns]
    has_target = TARGET_COLUMN in df.columns

    validation_errors = []
    if missing_cols:
        validation_errors.append(f"Missing required columns: {', '.join(missing_cols)}")
    if not has_target:
        validation_errors.append(f"Target column '{TARGET_COLUMN}' is missing.")

    preview_rows = df.head(5).to_dict(orient="records")

    if validation_errors:
        return {
            "status": "validation_failed",
            "valid": False,
            "filename": file.filename,
            "row_count": len(df),
            "columns": list(df.columns),
            "missing_columns": missing_cols,
            "errors": validation_errors,
            "preview": preview_rows
        }

    # If preview only, return validation success without persisting
    if preview_only:
        return {
            "status": "validated",
            "valid": True,
            "filename": file.filename,
            "row_count": len(df),
            "columns": list(df.columns),
            "target_classes": df[TARGET_COLUMN].value_counts().to_dict(),
            "preview": preview_rows
        }

    # Save to uploaded dataset path
    upload_path = os.path.join(settings.DATA_DIR, f"uploaded_{file.filename}")
    os.makedirs(settings.DATA_DIR, exist_ok=True)
    with open(upload_path, "wb") as f:
        f.write(content)

    return {
        "status": "imported",
        "valid": True,
        "filename": file.filename,
        "saved_path": upload_path,
        "row_count": len(df),
        "target_distribution": df[TARGET_COLUMN].value_counts().to_dict(),
        "preview": preview_rows,
        "message": f"Dataset '{file.filename}' successfully validated and staged for analysis or model retraining."
    }


@router.get("/data/export")
def export_applicant_records(
    format: str = "csv",
    db: Session = Depends(get_db)
):
    """
    Exports all applicant records and latest assessment scores to CSV.
    """
    applicants = db.query(Applicant).all()
    rows = []
    for a in applicants:
        latest = a.assessments[0] if a.assessments else None
        rows.append({
            "Applicant_ID": a.applicant_id,
            "Name": a.name,
            "Age": a.age,
            "Employment_Status": a.employment_status,
            "Educational_Background": a.educational_background,
            "Bank_Account_Tenure": a.bank_account_tenure,
            "Residential_Stability": a.residential_stability,
            "Rent_Payment_History": a.rent_payment_history,
            "Utility_Payment_History": a.utility_payment_history,
            "Telecommunications_Payment_History": a.telecommunications_payment_history,
            "Savings_Pattern": a.savings_pattern,
            "Gig_Economy_Participation": a.gig_economy_participation,
            "Score": latest.score if latest else "",
            "Risk_Level": latest.risk_level if latest else "",
            "Predicted_Category": latest.predicted_category if latest else "",
            "Assessment_Date": latest.created_at.strftime("%Y-%m-%d %H:%M") if latest else ""
        })

    df = pd.DataFrame(rows)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    response = Response(content=stream.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=AltScore_Applicants_Export.csv"
    return response
