"""
Model Evaluation Script for AltScore.
Loads the trained pipeline and evaluates metrics against a test dataset.
"""

import sys
import os
import argparse
import json
import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from scripts.train_model import CORE_FEATURES, TARGET_COLUMN


def evaluate(
    model_path: str = "models/alt_score_pipeline.joblib",
    data_path: str = "data/Synthetic_Credit_Scoring_Dataset.csv",
    metadata_path: str = "models/model_metadata.json"
):
    if not os.path.exists(model_path):
        print(f"Error: Model pipeline not found at {model_path}", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(data_path):
        print(f"Error: Dataset not found at {data_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Loading model from {model_path}...")
    pipeline = joblib.load(model_path)

    print(f"Loading data from {data_path}...")
    df = pd.read_csv(data_path)

    if TARGET_COLUMN not in df.columns:
        print(f"Error: Target column '{TARGET_COLUMN}' not in data.", file=sys.stderr)
        sys.exit(1)

    X = df[CORE_FEATURES]
    y = df[TARGET_COLUMN]

    y_pred = pipeline.predict(X)
    classes = list(pipeline.classes_)

    acc = accuracy_score(y, y_pred)
    prec = precision_score(y, y_pred, average="macro", zero_division=0)
    rec = recall_score(y, y_pred, average="macro", zero_division=0)
    f1 = f1_score(y, y_pred, average="macro", zero_division=0)
    cm = confusion_matrix(y, y_pred, labels=classes)

    print("\n================ ALTSCORE MODEL EVALUATION ================")
    print(f"Dataset Size:     {len(df)} records")
    print(f"Overall Accuracy: {acc * 100:.2f}%")
    print(f"Macro Precision:  {prec * 100:.2f}%")
    print(f"Macro Recall:     {rec * 100:.2f}%")
    print(f"Macro F1-Score:   {f1 * 100:.2f}%")
    print("-----------------------------------------------------------")
    print("Confusion Matrix:")
    print("Classes:", classes)
    print(cm)
    print("-----------------------------------------------------------")
    print("Classification Report:")
    print(classification_report(y, y_pred, labels=classes, zero_division=0))
    print("===========================================================")

    if os.path.exists(metadata_path):
        with open(metadata_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        print(f"Model Version: {meta.get('model_version')}")
        print(f"Trained At:    {meta.get('trained_at')}")


def main():
    parser = argparse.ArgumentParser(description="Evaluate AltScore model against dataset.")
    parser.add_argument("--model", type=str, default="models/alt_score_pipeline.joblib")
    parser.add_argument("--data", type=str, default="data/Synthetic_Credit_Scoring_Dataset.csv")
    parser.add_argument("--metadata", type=str, default="models/model_metadata.json")
    args = parser.parse_args()

    evaluate(args.model, args.data, args.metadata)


if __name__ == "__main__":
    main()
