"""
Model Training Pipeline for AltScore.
Trains a reproducible RandomForest classifier on alternative credit scoring data.
Saves the fitted Pipeline and evaluation metadata.
"""

import argparse
import datetime
import hashlib
import json
import os
import sys
from typing import Dict, Any, List

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

DEFAULT_DATA_PATH = "data/Synthetic_Credit_Scoring_Dataset.csv"
MODEL_ARTIFACT_PATH = "models/alt_score_pipeline.joblib"
METADATA_PATH = "models/model_metadata.json"

# Core alternative financial indicators used in predictive model
CORE_FEATURES = [
    "Employment_Status",
    "Bank_Account_Tenure",
    "Residential_Stability",
    "Rent_Payment_History",
    "Utility_Payment_History",
    "Telecommunications_Payment_History",
    "Savings_Pattern",
    "Gig_Economy_Participation",
]

# Sensitive, protected, or invasive attributes explicitly excluded from default scoring
EXCLUDED_FEATURES = [
    "Online_Shopping_Behavior",
    "Social_Media_Footprint",
    "Age",
    "Educational_Background",
    "Profile_ID"
]

TARGET_COLUMN = "Repayment_Status"
TARGET_CLASSES = ["Default", "Late Payment", "Paid on Time"]


def calculate_file_hash(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()[:16]


def validate_and_load_data(filepath: str) -> pd.DataFrame:
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset not found at {filepath}")
    
    df = pd.read_csv(filepath)
    if df.empty:
        raise ValueError(f"Dataset at {filepath} is empty")
    
    # Check for target column
    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Required target column '{TARGET_COLUMN}' is missing in {filepath}")
    
    # Check for missing core columns
    missing_cols = [col for col in CORE_FEATURES if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required feature columns: {missing_cols}")

    # Remove duplicates
    initial_len = len(df)
    df = df.drop_duplicates()
    if len(df) < initial_len:
        print(f"Removed {initial_len - len(df)} duplicate records.")

    # Drop records where target is missing
    df = df.dropna(subset=[TARGET_COLUMN])

    print(f"Loaded {len(df)} valid records. Class distribution:")
    print(df[TARGET_COLUMN].value_counts())

    return df


def build_pipeline(feature_names: List[str]) -> Pipeline:
    """
    Creates an end-to-end Scikit-learn Pipeline with imputer and one-hot encoder
    to handle unknown categories gracefully during inference.
    """
    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", categorical_transformer, feature_names)
        ],
        remainder="drop"
    )

    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42
    )

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", clf)
    ])

    return pipeline


def train_and_evaluate(
    data_path: str = DEFAULT_DATA_PATH,
    model_output: str = MODEL_ARTIFACT_PATH,
    metadata_output: str = METADATA_PATH,
    seed: int = 42
) -> Dict[str, Any]:
    df = validate_and_load_data(data_path)
    data_hash = calculate_file_hash(data_path)

    X = df[CORE_FEATURES]
    y = df[TARGET_COLUMN]

    # Stratified train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=seed, stratify=y
    )

    print(f"Training set: {len(X_train)} samples, Test set: {len(X_test)} samples")

    pipeline = build_pipeline(CORE_FEATURES)
    pipeline.fit(X_train, y_train)

    # Predictions on test set
    y_pred = pipeline.predict(X_test)
    y_pred_proba = pipeline.predict_proba(X_test)

    # Classes in pipeline
    classes = list(pipeline.classes_)

    # Test metrics
    acc = accuracy_score(y_test, y_pred)
    prec_macro = precision_score(y_test, y_pred, average="macro", zero_division=0)
    rec_macro = recall_score(y_test, y_pred, average="macro", zero_division=0)
    f1_macro = f1_score(y_test, y_pred, average="macro", zero_division=0)

    prec_weighted = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec_weighted = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1_weighted = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    cm = confusion_matrix(y_test, y_pred, labels=classes).tolist()
    report = classification_report(y_test, y_pred, labels=classes, output_dict=True, zero_division=0)

    # Permutation feature importance on test set
    perm_importance = permutation_importance(
        pipeline, X_test, y_test, n_repeats=10, random_state=seed, n_jobs=-1
    )

    feature_importances = {}
    for idx, feature in enumerate(CORE_FEATURES):
        feature_importances[feature] = round(float(perm_importance.importances_mean[idx]), 4)

    # Normalize relative feature importances to sum to 100%
    total_imp = sum(max(0, v) for v in feature_importances.values())
    if total_imp > 0:
        normalized_importances = {
            k: round((max(0, v) / total_imp) * 100, 1)
            for k, v in feature_importances.items()
        }
    else:
        normalized_importances = {k: 12.5 for k in CORE_FEATURES}

    # Sort descending
    sorted_importances = dict(sorted(normalized_importances.items(), key=lambda item: item[1], reverse=True))

    print("\n--- Model Evaluation on Test Set ---")
    print(f"Accuracy:          {acc * 100:.2f}%")
    print(f"Macro Precision:   {prec_macro * 100:.2f}%")
    print(f"Macro Recall:      {rec_macro * 100:.2f}%")
    print(f"Macro F1-Score:    {f1_macro * 100:.2f}%")
    print("\nConfusion Matrix (Classes:", classes, "):")
    print(np.array(cm))
    print("\nPermutation Feature Importance (%):")
    for feat, imp in sorted_importances.items():
        print(f"  {feat}: {imp}%")

    # Save model artifact
    os.makedirs(os.path.dirname(os.path.abspath(model_output)), exist_ok=True)
    joblib.dump(pipeline, model_output)
    print(f"\nModel pipeline saved to {model_output}")

    # Build metadata
    metadata = {
        "model_type": "RandomForestClassifier",
        "model_version": f"rf-v1-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M')}",
        "trained_at": datetime.datetime.utcnow().isoformat() + "Z",
        "dataset_path": data_path,
        "dataset_hash": data_hash,
        "total_records": len(df),
        "train_records": len(X_train),
        "test_records": len(X_test),
        "random_seed": seed,
        "features": CORE_FEATURES,
        "excluded_features": EXCLUDED_FEATURES,
        "classes": classes,
        "metrics": {
            "accuracy": round(float(acc), 4),
            "macro_precision": round(float(prec_macro), 4),
            "macro_recall": round(float(rec_macro), 4),
            "macro_f1": round(float(f1_macro), 4),
            "weighted_precision": round(float(prec_weighted), 4),
            "weighted_recall": round(float(rec_weighted), 4),
            "weighted_f1": round(float(f1_weighted), 4),
            "confusion_matrix": cm,
            "classification_report": report,
            "feature_importance": sorted_importances
        },
        "score_mapping_config": {
            "min_score": 300,
            "max_score": 900,
            "weights": {
                "Paid on Time": 1.0,
                "Late Payment": 0.45,
                "Default": 0.05
            },
            "risk_categories": {
                "Good": {"min": 700, "max": 900, "color": "emerald"},
                "Fair": {"min": 600, "max": 699, "color": "blue"},
                "Poor": {"min": 500, "max": 599, "color": "amber"},
                "High Risk": {"min": 300, "max": 499, "color": "rose"}
            }
        },
        "disclaimer": "AltScore is an educational prototype using synthetic data. Scores and predictions are experimental and have not been validated for real-world lending decisions."
    }

    os.makedirs(os.path.dirname(os.path.abspath(metadata_output)), exist_ok=True)
    with open(metadata_output, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Model metadata saved to {metadata_output}")

    return metadata


def main():
    parser = argparse.ArgumentParser(description="Train AltScore ML Pipeline.")
    parser.add_argument("--data", type=str, default=DEFAULT_DATA_PATH, help="Path to CSV dataset")
    parser.add_argument("--model-out", type=str, default=MODEL_ARTIFACT_PATH, help="Output path for joblib pipeline")
    parser.add_argument("--metadata-out", type=str, default=METADATA_PATH, help="Output path for metadata JSON")
    parser.add_argument("--seed", type=int, default=42, help="Random state seed")
    args = parser.parse_args()

    try:
        train_and_evaluate(
            data_path=args.data,
            model_output=args.model_out,
            metadata_output=args.metadata_out,
            seed=args.seed
        )
    except Exception as e:
        print(f"Error during training: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
