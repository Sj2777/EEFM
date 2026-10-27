import os
from typing import Dict, Any, List


class Settings:
    PROJECT_NAME: str = "AltScore — AI-Powered Alternative Credit Scoring"
    API_V1_STR: str = "/api"
    
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    MODELS_DIR: str = os.path.join(BASE_DIR, "models")
    REPORTS_DIR: str = os.path.join(BASE_DIR, "reports")
    
    DEFAULT_DATASET_PATH: str = os.path.join(DATA_DIR, "Synthetic_Credit_Scoring_Dataset.csv")
    ACTIVE_MODEL_PATH: str = os.path.join(MODELS_DIR, "alt_score_pipeline.joblib")
    ACTIVE_METADATA_PATH: str = os.path.join(MODELS_DIR, "model_metadata.json")
    DATABASE_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'altscore.db')}"
    
    # Configurable illustrative risk score thresholds (300 - 900)
    SCORE_CATEGORIES: Dict[str, Dict[str, Any]] = {
        "Good": {"min": 700, "max": 900, "label": "Good Risk", "badge": "emerald"},
        "Fair": {"min": 600, "max": 699, "label": "Medium Risk", "badge": "blue"},
        "Poor": {"min": 500, "max": 599, "label": "Poor Risk", "badge": "amber"},
        "High Risk": {"min": 300, "max": 499, "label": "High Risk", "badge": "rose"},
    }

    CORS_ORIGINS: List[str] = [
        "http://localhost:5501",
        "http://127.0.0.1:5501",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]


settings = Settings()
