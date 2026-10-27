import os
import json
import datetime
import pandas as pd
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.database import engine, Base, SessionLocal
from app.models.applicant import Applicant, Assessment
from app.api import (
    health,
    dashboard,
    applicants,
    score,
    assessments,
    analytics,
    model,
    data,
    reports
)
from app.services.scoring_service import get_pipeline, score_applicant_record

# Ensure database tables exist
Base.metadata.create_all(bind=engine)


def seed_database_if_empty():
    """
    Seeds initial applicant profiles from the synthetic dataset if database is empty,
    so the dashboard, records table, and analytics are immediately functional.
    """
    db = SessionLocal()
    try:
        count = db.query(Applicant).count()
        if count == 0 and os.path.exists(settings.DEFAULT_DATASET_PATH):
            print("Seeding initial records into SQLite database from synthetic dataset...")
            df = pd.read_csv(settings.DEFAULT_DATASET_PATH)
            sample_profiles = df.head(50).to_dict(orient="records")

            for idx, row in enumerate(sample_profiles, 1):
                app_id = row.get("Profile_ID", f"A{idx:04d}")
                scoring_result = score_applicant_record(row)

                applicant = Applicant(
                    applicant_id=app_id,
                    name=f"Applicant {app_id}",
                    age=int(row.get("Age", 30)),
                    employment_status=str(row.get("Employment_Status", "Salaried")),
                    educational_background=str(row.get("Educational_Background", "Bachelor's")),
                    bank_account_tenure=str(row.get("Bank_Account_Tenure", "2–5 years")),
                    residential_stability=str(row.get("Residential_Stability", "1–3 years")),
                    utility_payment_history=str(row.get("Utility_Payment_History", "Always on time")),
                    rent_payment_history=str(row.get("Rent_Payment_History", "Always on time")),
                    telecommunications_payment_history=str(row.get("Telecommunications_Payment_History", "Always on time")),
                    savings_pattern=str(row.get("Savings_Pattern", "Some savings")),
                    gig_economy_participation=str(row.get("Gig_Economy_Participation", "None")),
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(days=idx // 2, hours=idx * 2)
                )
                db.add(applicant)
                db.flush()

                assessment = Assessment(
                    assessment_id=f"ASM_{app_id}_{int(applicant.created_at.timestamp())}",
                    applicant_id=app_id,
                    score=scoring_result["score"],
                    risk_level=scoring_result["risk_level"],
                    predicted_category=scoring_result["predicted_category"],
                    repayment_probability=scoring_result["repayment_probability"],
                    class_probabilities_json=json.dumps(scoring_result["class_probabilities"]),
                    key_factors_json=json.dumps(scoring_result["key_factors"]),
                    suggestions_json=json.dumps(scoring_result["suggestions"]),
                    model_version=scoring_result["model_version"],
                    created_at=applicant.created_at
                )
                db.add(assessment)

            db.commit()
            print(f"Successfully seeded {len(sample_profiles)} applicant records and assessments.")
    except Exception as e:
        print(f"Note on seeding: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.DATA_DIR, exist_ok=True)
    os.makedirs(settings.MODELS_DIR, exist_ok=True)
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)

    # Seed records if empty
    seed_database_if_empty()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AltScore — AI-Powered Alternative Credit Scoring System API. Educational Prototype using Synthetic Data.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware - allowing port 5501, 8000, 5173 and all localhost/127.0.0.1 origins
origins_list = [o for o in settings.CORS_ORIGINS if o != "*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_list,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include Routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(applicants.router, prefix="/api", tags=["Applicants"])
app.include_router(score.router, prefix="/api", tags=["Scoring"])
app.include_router(assessments.router, prefix="/api", tags=["Assessments"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])
app.include_router(model.router, prefix="/api", tags=["Model"])
app.include_router(data.router, prefix="/api", tags=["Data"])
app.include_router(reports.router, prefix="/api", tags=["Reports"])

# ─── Serve React Frontend Build ────────────────────────────────────────────────
# This lets http://localhost:8000 serve the entire app (API + UI) from one port.
# No CORS headaches, no separate frontend server needed.

FRONTEND_DIST = os.path.join(settings.BASE_DIR, "frontend", "dist")

if os.path.isdir(FRONTEND_DIST):
    from fastapi.responses import FileResponse

    # Serve static assets (JS, CSS, images) under /assets
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

    # Serve other static files (favicon, icons) at exact paths
    @app.get("/favicon.svg", include_in_schema=False)
    async def favicon():
        fav = os.path.join(FRONTEND_DIST, "favicon.svg")
        if os.path.exists(fav):
            return FileResponse(fav, media_type="image/svg+xml")

    @app.get("/icons.svg", include_in_schema=False)
    async def icons():
        ico = os.path.join(FRONTEND_DIST, "icons.svg")
        if os.path.exists(ico):
            return FileResponse(ico, media_type="image/svg+xml")

    # SPA catch-all: any non-API path returns index.html so React Router handles it
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Don't intercept /api or /docs or /openapi.json
        if full_path.startswith("api") or full_path in ("docs", "redoc", "openapi.json"):
            return  # let FastAPI handle these normally
        # Try to serve the exact file if it exists (e.g. robots.txt)
        requested = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(requested):
            return FileResponse(requested)
        # Otherwise, return index.html for client-side routing
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
