import json
import os
from typing import Dict, Any, List, Tuple
import joblib
import pandas as pd

from app.core.config import settings

# In-memory cached model and metadata
_CACHED_PIPELINE = None
_CACHED_METADATA = None


def get_metadata() -> Dict[str, Any]:
    global _CACHED_METADATA
    if _CACHED_METADATA is not None:
        return _CACHED_METADATA

    if os.path.exists(settings.ACTIVE_METADATA_PATH):
        with open(settings.ACTIVE_METADATA_PATH, "r", encoding="utf-8") as f:
            _CACHED_METADATA = json.load(f)
            return _CACHED_METADATA
    
    return {
        "model_version": "altscore-rf-v1.0",
        "model_type": "RandomForestClassifier",
        "trained_at": "Not yet trained",
        "metrics": {"accuracy": 0.0, "macro_f1": 0.0},
        "score_mapping_config": {
            "min_score": 300,
            "max_score": 900,
            "weights": {"Paid on Time": 1.0, "Late Payment": 0.45, "Default": 0.05}
        }
    }


def get_pipeline():
    global _CACHED_PIPELINE
    if _CACHED_PIPELINE is not None:
        return _CACHED_PIPELINE

    if os.path.exists(settings.ACTIVE_MODEL_PATH):
        _CACHED_PIPELINE = joblib.load(settings.ACTIVE_MODEL_PATH)
        return _CACHED_PIPELINE

    return None


def invalidate_model_cache():
    global _CACHED_PIPELINE, _CACHED_METADATA
    _CACHED_PIPELINE = None
    _CACHED_METADATA = None


def calculate_experimental_score(class_probabilities: Dict[str, float]) -> int:
    """
    Documented illustrative mapping from class probabilities to 300 - 900 score.
    Weights:
      Paid on Time: 1.0
      Late Payment: 0.45
      Default: 0.05
    """
    p_paid = class_probabilities.get("Paid on Time", 0.33)
    p_late = class_probabilities.get("Late Payment", 0.33)
    p_default = class_probabilities.get("Default", 0.34)

    # Composite repayment index between 0.0 and 1.0
    index = (1.0 * p_paid) + (0.45 * p_late) + (0.05 * p_default)

    raw_score = 300 + (600 * index)
    clamped_score = max(300, min(900, int(round(raw_score))))
    return clamped_score


def determine_risk_level(score: int) -> Tuple[str, str]:
    """
    Returns (risk_level_code, badge_color).
    """
    if score >= 700:
        return "Good", "emerald"
    elif score >= 600:
        return "Fair", "blue"
    elif score >= 500:
        return "Poor", "amber"
    else:
        return "High Risk", "rose"


def generate_suggestions(data: Dict[str, Any]) -> List[str]:
    suggestions = []
    
    rent = data.get("rent_payment_history") or data.get("Rent_Payment_History", "")
    if rent in ("Frequently late", "Inconsistent"):
        suggestions.append("Set up automated reminders or direct debit for monthly rent payments.")
    elif rent == "Always on time":
        suggestions.append("Maintain consistent rent payments to solidify residential tenure record.")

    savings = data.get("savings_pattern") or data.get("Savings_Pattern", "")
    if savings in ("Little or no savings", "Prefer not to say"):
        suggestions.append("Increase recurring savings contributions to build an emergency buffer.")
    elif savings == "Regular savings":
        suggestions.append("Continue regular monthly savings to maintain strong liquidity stability.")

    utility = data.get("utility_payment_history") or data.get("Utility_Payment_History", "")
    if utility in ("Frequently late", "Inconsistent"):
        suggestions.append("Keep utility payments on time to prevent negative repayment indicators.")
    elif utility == "Always on time":
        suggestions.append("Consistent utility payments demonstrate dependable household financial management.")

    bank_tenure = data.get("bank_account_tenure") or data.get("Bank_Account_Tenure", "")
    if bank_tenure in ("No bank account", "Less than 1 year"):
        suggestions.append("Maintain an active primary bank account for at least 1-2 years to establish tenure.")

    if not suggestions:
        suggestions = [
            "Maintain consistent monthly payment records across all active utilities.",
            "Gradually build an emergency savings reserve.",
            "Keep telecommunications and digital accounts in good standing."
        ]

    return suggestions[:4]


def generate_key_factors(data: Dict[str, Any], metadata: Dict[str, Any]) -> Dict[str, float]:
    """
    Computes key factor percentage impacts based on model feature importances
    and applicant attributes.
    """
    base_importance = metadata.get("metrics", {}).get("feature_importance", {})
    
    # Standard friendly factor labels
    label_map = {
        "Employment_Status": "Employment Status",
        "Bank_Account_Tenure": "Bank Account Tenure",
        "Rent_Payment_History": "Payment History (Rent)",
        "Utility_Payment_History": "Payment History (Utilities)",
        "Telecommunications_Payment_History": "Telecom Payments",
        "Savings_Pattern": "Savings Pattern",
        "Residential_Stability": "Residential Stability",
        "Gig_Economy_Participation": "Other Factors"
    }

    factors = {}
    if base_importance:
        for k, v in base_importance.items():
            label = label_map.get(k, k.replace("_", " "))
            factors[label] = round(float(v), 1)
    else:
        factors = {
            "Employment Status": 25.0,
            "Bank Account Tenure": 20.0,
            "Payment History (Rent)": 18.0,
            "Payment History (Utilities)": 15.0,
            "Savings Pattern": 12.0,
            "Other Factors": 10.0
        }

    return factors


def score_applicant_record(applicant_data: Dict[str, Any]) -> Dict[str, Any]:
    pipeline = get_pipeline()
    metadata = get_metadata()

    # Normalize keys for model features
    row = {
        "Employment_Status": applicant_data.get("employment_status") or applicant_data.get("Employment_Status", "Other"),
        "Bank_Account_Tenure": applicant_data.get("bank_account_tenure") or applicant_data.get("Bank_Account_Tenure", "Less than 1 year"),
        "Residential_Stability": applicant_data.get("residential_stability") or applicant_data.get("Residential_Stability", "1–3 years"),
        "Rent_Payment_History": applicant_data.get("rent_payment_history") or applicant_data.get("Rent_Payment_History", "Mostly on time"),
        "Utility_Payment_History": applicant_data.get("utility_payment_history") or applicant_data.get("Utility_Payment_History", "Mostly on time"),
        "Telecommunications_Payment_History": applicant_data.get("telecommunications_payment_history") or applicant_data.get("Telecommunications_Payment_History", "Always on time"),
        "Savings_Pattern": applicant_data.get("savings_pattern") or applicant_data.get("Savings_Pattern", "Some savings"),
        "Gig_Economy_Participation": applicant_data.get("gig_economy_participation") or applicant_data.get("Gig_Economy_Participation", "None"),
    }

    df_input = pd.DataFrame([row])

    if pipeline is not None:
        predicted_category = str(pipeline.predict(df_input)[0])
        probas = pipeline.predict_proba(df_input)[0]
        class_probas = {str(c): round(float(p), 4) for c, p in zip(pipeline.classes_, probas)}
    else:
        # Fallback heuristic if model is not yet trained
        predicted_category = "Paid on Time"
        class_probas = {"Paid on Time": 0.70, "Late Payment": 0.20, "Default": 0.10}

    repayment_prob = class_probas.get("Paid on Time", 0.50)
    score = calculate_experimental_score(class_probas)
    risk_level, badge_color = determine_risk_level(score)

    key_factors = generate_key_factors(applicant_data, metadata)
    suggestions = generate_suggestions(applicant_data)

    if score >= 700:
        summary = "This applicant shows a good chance of repaying on time based on their alternative financial indicators."
    elif score >= 600:
        summary = "This applicant demonstrates moderate financial stability with fair payment consistency across accounts."
    elif score >= 500:
        summary = "This applicant shows elevated risk due to irregular payment history or limited alternative tenure."
    else:
        summary = "This applicant exhibits high risk patterns across rental, utility, or account history indicators."

    return {
        "score": score,
        "risk_level": risk_level,
        "badge_color": badge_color,
        "predicted_category": predicted_category,
        "repayment_probability": repayment_prob,
        "class_probabilities": class_probas,
        "key_factors": key_factors,
        "suggestions": suggestions,
        "summary_text": summary,
        "model_version": metadata.get("model_version", "rf-v1.0"),
        "disclaimer": "AltScore is an educational prototype using synthetic data. Scores and predictions are experimental and have not been validated for real-world lending decisions."
    }
