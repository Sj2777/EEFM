from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.scoring_service import get_metadata, get_pipeline
from app.services.training_service import execute_retraining

router = APIRouter()


@router.get("/model/status")
def get_model_status():
    metadata = get_metadata()
    pipeline = get_pipeline()

    return {
        "status": "ready" if pipeline is not None else "not_trained",
        "model_type": metadata.get("model_type", "RandomForestClassifier"),
        "model_version": metadata.get("model_version", "unknown"),
        "trained_at": metadata.get("trained_at", "Never"),
        "dataset_path": metadata.get("dataset_path", "data/Synthetic_Credit_Scoring_Dataset.csv"),
        "total_records": metadata.get("total_records", 0),
        "train_records": metadata.get("train_records", 0),
        "test_records": metadata.get("test_records", 0),
        "features_used": metadata.get("features", []),
        "excluded_features": metadata.get("excluded_features", []),
        "classes": metadata.get("classes", ["Paid on Time", "Late Payment", "Default"]),
        "disclaimer": metadata.get("disclaimer", "AltScore is an educational prototype.")
    }


@router.get("/model/metrics")
def get_model_metrics():
    metadata = get_metadata()
    metrics = metadata.get("metrics")

    if not metrics:
        raise HTTPException(
            status_code=404,
            detail="Model metrics not available. The model has not been trained or evaluated yet."
        )

    # In the reference image:
    # Accuracy 82.4%, Precision 80.1%, Recall 78.6%, F1 Score 79.3%
    # Actual test set values from training will be served:
    acc = metrics.get("accuracy", 0.0) * 100
    prec = metrics.get("macro_precision", 0.0) * 100
    rec = metrics.get("macro_recall", 0.0) * 100
    f1 = metrics.get("macro_f1", 0.0) * 100

    classes = metadata.get("classes", ["Paid on Time", "Late Payment", "Default"])
    cm = metrics.get("confusion_matrix", [[0, 0, 0], [0, 0, 0], [0, 0, 0]])
    report = metrics.get("classification_report", {})

    return {
        "accuracy": round(acc, 1),
        "precision": round(prec, 1),
        "recall": round(rec, 1),
        "f1_score": round(f1, 1),
        "confusion_matrix": cm,
        "classes": classes,
        "classification_report": report,
        "model_information": {
            "algorithm": metadata.get("model_type", "Random Forest"),
            "training_data": f"Synthetic ({metadata.get('train_records', 800)} users)",
            "test_accuracy": f"{round(acc, 1)}%",
            "last_trained": metadata.get("trained_at", "Apr 24, 2025")
        },
        "disclaimer": "Metrics calculated from held-out test partition (20% split) of synthetic dataset."
    }


@router.get("/model/feature-importance")
def get_model_feature_importance():
    metadata = get_metadata()
    feature_imp = metadata.get("metrics", {}).get("feature_importance", {})

    # Format for chart display
    chart_data = []
    for feat, imp in feature_imp.items():
        chart_data.append({
            "feature": feat.replace("_", " "),
            "importance": imp
        })

    return {
        "feature_importance": chart_data,
        "method": "Permutation Feature Importance (held-out test set)",
        "disclaimer": "Feature weights indicate statistical associations within synthetic training data, not real-world causal drivers."
    }


@router.post("/model/retrain")
def retrain_model(db: Session = Depends(get_db)):
    try:
        result = execute_retraining(db=db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model retraining failed: {str(e)}")
