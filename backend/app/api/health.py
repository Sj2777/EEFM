import os
from fastapi import APIRouter
from app.core.config import settings
from app.services.scoring_service import get_pipeline, get_metadata

router = APIRouter()


@router.get("/health")
def check_health():
    pipeline = get_pipeline()
    metadata = get_metadata()
    has_dataset = os.path.exists(settings.DEFAULT_DATASET_PATH)
    has_db = os.path.exists(os.path.join(settings.BASE_DIR, "altscore.db"))

    return {
        "status": "healthy",
        "api": "online",
        "model_available": pipeline is not None,
        "model_version": metadata.get("model_version", "unknown"),
        "database_connected": True,
        "database_exists": has_db,
        "dataset_available": has_dataset,
        "prototype_mode": True,
        "disclaimer": "AltScore is an educational prototype using synthetic data."
    }
