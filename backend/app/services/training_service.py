import datetime
import json
import os
import shutil
import tempfile
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.applicant import ModelTrainingRun
from app.services.scoring_service import invalidate_model_cache
from scripts.train_model import train_and_evaluate, calculate_file_hash


def execute_retraining(
    db: Optional[Session] = None,
    dataset_path: Optional[str] = None,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Safely retrains the model. If training succeeds, replaces the active model artifact
    and updates metadata. If it fails, retains the previous model and logs failure.
    """
    if not dataset_path:
        dataset_path = settings.DEFAULT_DATASET_PATH

    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Training dataset not found at {dataset_path}")

    run_id = f"run_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    data_hash = calculate_file_hash(dataset_path)

    # Use a temporary directory for safe atomic model replacement
    with tempfile.TemporaryDirectory() as tmpdir:
        temp_model_path = os.path.join(tmpdir, "alt_score_pipeline.joblib")
        temp_meta_path = os.path.join(tmpdir, "model_metadata.json")

        try:
            metadata = train_and_evaluate(
                data_path=dataset_path,
                model_output=temp_model_path,
                metadata_output=temp_meta_path,
                seed=seed
            )

            # Verification: ensure both artifacts were produced and are non-empty
            if not os.path.exists(temp_model_path) or os.path.getsize(temp_model_path) == 0:
                raise RuntimeError("Model pipeline artifact was not generated properly.")
            if not os.path.exists(temp_meta_path) or os.path.getsize(temp_meta_path) == 0:
                raise RuntimeError("Model metadata artifact was not generated properly.")

            # Atomically copy to active models dir
            os.makedirs(settings.MODELS_DIR, exist_ok=True)
            shutil.copy2(temp_model_path, settings.ACTIVE_MODEL_PATH)
            shutil.copy2(temp_meta_path, settings.ACTIVE_METADATA_PATH)

            # Invalidate in-memory model cache
            invalidate_model_cache()

            # Record successful training run in DB if session provided
            if db:
                run_record = ModelTrainingRun(
                    run_id=run_id,
                    model_version=metadata.get("model_version", "unknown"),
                    dataset_identifier=dataset_path,
                    dataset_rows=metadata.get("total_records", 0),
                    status="SUCCESS",
                    metrics_json=json.dumps(metadata.get("metrics", {})),
                    error_message=None,
                    trained_at=datetime.datetime.utcnow()
                )
                db.add(run_record)
                db.commit()

            return {
                "status": "success",
                "run_id": run_id,
                "model_version": metadata.get("model_version"),
                "metrics": metadata.get("metrics"),
                "total_records": metadata.get("total_records"),
                "message": "Model retrained and deployed successfully."
            }

        except Exception as e:
            # Training failed; record failure in DB and re-raise without overwriting active model
            if db:
                try:
                    run_record = ModelTrainingRun(
                        run_id=run_id,
                        model_version="failed",
                        dataset_identifier=dataset_path,
                        dataset_rows=0,
                        status="FAILED",
                        metrics_json=None,
                        error_message=str(e),
                        trained_at=datetime.datetime.utcnow()
                    )
                    db.add(run_record)
                    db.commit()
                except Exception:
                    pass

            raise RuntimeError(f"Retraining failed: {e}")
