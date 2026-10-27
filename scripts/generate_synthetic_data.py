"""
Synthetic Credit Scoring Dataset Generator for AltScore.
Generates reproducible synthetic alternative credit profile records with realistic behavioral correlations.
All generated records are strictly synthetic and for educational / demonstration purposes only.
"""

import argparse
import csv
import os
import random
from typing import Dict, List, Any

# Fix random seed for reproducibility
DEFAULT_SEED = 42

EMPLOYMENT_OPTIONS = [
    "Salaried",
    "Self-employed",
    "Freelancer",
    "Student",
    "Unemployed",
    "Other"
]

EDUCATION_OPTIONS = [
    "High School",
    "Diploma",
    "Bachelor's",
    "Master's",
    "PhD",
    "Other"
]

BANK_TENURE_OPTIONS = [
    "No bank account",
    "Less than 1 year",
    "1–2 years",
    "2–5 years",
    "More than 5 years"
]

RESIDENTIAL_OPTIONS = [
    "Less than 1 year",
    "1–3 years",
    "More than 3 years"
]

PAYMENT_OPTIONS = [
    "Always on time",
    "Mostly on time",
    "Frequently late",
    "No payment history"
]

SAVINGS_OPTIONS = [
    "Regular savings",
    "Some savings",
    "Little or no savings",
    "Prefer not to say"
]

GIG_OPTIONS = [
    "None",
    "Part-Time",
    "Full-Time"
]

ONLINE_SHOPPING_OPTIONS = [
    "Frequent",
    "Occasional",
    "None"
]

SOCIAL_MEDIA_OPTIONS = [
    "High",
    "Medium",
    "Low"
]


def determine_repayment_status(
    rent: str,
    utility: str,
    telecom: str,
    bank_tenure: str,
    employment: str,
    savings: str,
    rng: random.Random
) -> str:
    """
    Simulates repayment behavior based on alternative financial stability signals.
    Higher stability & timeliness -> higher likelihood of 'Paid on Time'.
    Irregularity & late payments -> higher likelihood of 'Late Payment' or 'Default'.
    """
    score = 50.0  # baseline

    # Rent payment weighting
    if rent == "Always on time":
        score += 25
    elif rent == "Mostly on time":
        score += 10
    elif rent == "Frequently late":
        score -= 30
    elif rent == "No payment history":
        score -= 5

    # Utility payment weighting
    if utility == "Always on time":
        score += 15
    elif utility == "Mostly on time":
        score += 5
    elif utility == "Frequently late":
        score -= 20

    # Telecom payment weighting
    if telecom == "Always on time":
        score += 10
    elif telecom == "Mostly on time":
        score += 3
    elif telecom == "Frequently late":
        score -= 15

    # Bank account tenure weighting
    if bank_tenure == "More than 5 years":
        score += 15
    elif bank_tenure == "2–5 years":
        score += 10
    elif bank_tenure == "1–2 years":
        score += 5
    elif bank_tenure == "Less than 1 year":
        score -= 5
    elif bank_tenure == "No bank account":
        score -= 15

    # Employment weighting
    if employment == "Salaried":
        score += 10
    elif employment in ("Self-employed", "Freelancer"):
        score += 5
    elif employment == "Student":
        score += 0
    elif employment == "Unemployed":
        score -= 20

    # Savings pattern weighting
    if savings == "Regular savings":
        score += 15
    elif savings == "Some savings":
        score += 5
    elif savings == "Little or no savings":
        score -= 15

    # Add realistic stochastic noise
    noise = rng.gauss(0, 12)
    final_score = score + noise

    if final_score >= 65:
        return "Paid on Time"
    elif final_score >= 42:
        return "Late Payment"
    else:
        return "Default"


def generate_profiles(count: int = 1000, seed: int = DEFAULT_SEED) -> List[Dict[str, Any]]:
    rng = random.Random(seed)
    profiles = []

    for i in range(1, count + 1):
        profile_id = f"A{i:04d}"
        age = rng.randint(18, 65)
        
        # Weighted selection for realistic representation
        employment = rng.choices(
            EMPLOYMENT_OPTIONS,
            weights=[0.40, 0.22, 0.16, 0.12, 0.08, 0.02]
        )[0]
        
        education = rng.choices(
            EDUCATION_OPTIONS,
            weights=[0.25, 0.15, 0.40, 0.14, 0.04, 0.02]
        )[0]

        bank_tenure = rng.choices(
            BANK_TENURE_OPTIONS,
            weights=[0.08, 0.17, 0.25, 0.30, 0.20]
        )[0]

        residential_stability = rng.choices(
            RESIDENTIAL_OPTIONS,
            weights=[0.20, 0.45, 0.35]
        )[0]

        rent = rng.choices(
            PAYMENT_OPTIONS,
            weights=[0.55, 0.25, 0.15, 0.05]
        )[0]

        utility = rng.choices(
            PAYMENT_OPTIONS,
            weights=[0.60, 0.25, 0.12, 0.03]
        )[0]

        telecom = rng.choices(
            PAYMENT_OPTIONS,
            weights=[0.65, 0.22, 0.10, 0.03]
        )[0]

        savings = rng.choices(
            SAVINGS_OPTIONS,
            weights=[0.30, 0.40, 0.25, 0.05]
        )[0]

        gig = rng.choices(
            GIG_OPTIONS,
            weights=[0.60, 0.25, 0.15]
        )[0]

        online_shopping = rng.choices(
            ONLINE_SHOPPING_OPTIONS,
            weights=[0.35, 0.50, 0.15]
        )[0]

        social_media = rng.choices(
            SOCIAL_MEDIA_OPTIONS,
            weights=[0.25, 0.50, 0.25]
        )[0]

        repayment = determine_repayment_status(
            rent=rent,
            utility=utility,
            telecom=telecom,
            bank_tenure=bank_tenure,
            employment=employment,
            savings=savings,
            rng=rng
        )

        profiles.append({
            "Profile_ID": profile_id,
            "Age": age,
            "Employment_Status": employment,
            "Educational_Background": education,
            "Bank_Account_Tenure": bank_tenure,
            "Residential_Stability": residential_stability,
            "Rent_Payment_History": rent,
            "Utility_Payment_History": utility,
            "Telecommunications_Payment_History": telecom,
            "Savings_Pattern": savings,
            "Gig_Economy_Participation": gig,
            "Online_Shopping_Behavior": online_shopping,
            "Social_Media_Footprint": social_media,
            "Repayment_Status": repayment
        })

    return profiles


def save_dataset_and_dictionary(profiles: List[Dict[str, Any]], output_path: str):
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    if not profiles:
        raise ValueError("No profiles to write.")

    fieldnames = list(profiles[0].keys())

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(profiles)

    print(f"Saved {len(profiles)} records to {output_path}")

    # Generate Data Dictionary
    dict_path = os.path.join(os.path.dirname(output_path), "data_dictionary.md")
    with open(dict_path, "w", encoding="utf-8") as f:
        f.write("# AltScore Synthetic Dataset Dictionary\n\n")
        f.write("This synthetic dataset is generated for evaluating alternative financial indicators in educational & prototype credit scoring.\n\n")
        f.write("| Column Name | Type | Description | Valid Categories / Range | Used in Default Model? |\n")
        f.write("|---|---|---|---|---|\n")
        f.write("| Profile_ID | String | Unique synthetic identifier | `A0001` - `A9999` | No (ID) |\n")
        f.write("| Age | Integer | Applicant age in years | 18 - 65 | Optional (Safeguard enabled) |\n")
        f.write("| Employment_Status | Categorical | Employment nature | Salaried, Self-employed, Freelancer, Student, Unemployed, Other | Yes |\n")
        f.write("| Educational_Background | Categorical | Highest level achieved | High School, Diploma, Bachelor's, Master's, PhD, Other | Optional (Safeguard enabled) |\n")
        f.write("| Bank_Account_Tenure | Categorical | Banking duration | No bank account, Less than 1 year, 1–2 years, 2–5 years, More than 5 years | Yes |\n")
        f.write("| Residential_Stability | Categorical | Residence duration | Less than 1 year, 1–3 years, More than 3 years | Yes |\n")
        f.write("| Rent_Payment_History | Categorical | Consistency in rent | Always on time, Mostly on time, Frequently late, No payment history | Yes |\n")
        f.write("| Utility_Payment_History | Categorical | Utility bill regularity | Always on time, Mostly on time, Frequently late, No payment history | Yes |\n")
        f.write("| Telecommunications_Payment_History | Categorical | Phone/internet bill regularity | Always on time, Mostly on time, Frequently late, No payment history | Yes |\n")
        f.write("| Savings_Pattern | Categorical | Monthly savings habit | Regular savings, Some savings, Little or no savings, Prefer not to say | Yes |\n")
        f.write("| Gig_Economy_Participation | Categorical | Gig/platform work engagement | None, Part-Time, Full-Time | Yes |\n")
        f.write("| Online_Shopping_Behavior | Categorical | Discretionary digital shopping | Frequent, Occasional, None | Excluded by default (Safeguard) |\n")
        f.write("| Social_Media_Footprint | Categorical | Social activity volume | High, Medium, Low | Excluded by default (Safeguard) |\n")
        f.write("| Repayment_Status | Categorical | Ground truth target | Paid on Time, Late Payment, Default | Target Variable |\n\n")
        f.write("## Ethical Safeguards & Fair Lending Note\n")
        f.write("- Social media footprint and online shopping behavior are intentionally excluded from default ML models to respect privacy and prevent bias.\n")
        f.write("- Age and educational background are isolated to avoid proxy discrimination.\n")
        f.write("- All records are purely synthetic and must not be used for real-world underwriting decisions.\n")

    print(f"Saved data dictionary to {dict_path}")


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic alternative credit scoring dataset.")
    parser.add_argument("--rows", type=int, default=1000, help="Number of records to generate (default: 1000)")
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED, help="Random seed for reproducibility")
    parser.add_argument("--output", type=str, default="data/Synthetic_Credit_Scoring_Dataset.csv", help="Output CSV path")
    args = parser.parse_args()

    profiles = generate_profiles(count=args.rows, seed=args.seed)
    save_dataset_and_dictionary(profiles, args.output)


if __name__ == "__main__":
    main()
