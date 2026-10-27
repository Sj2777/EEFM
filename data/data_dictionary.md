# AltScore Synthetic Dataset Dictionary

This synthetic dataset is generated for evaluating alternative financial indicators in educational & prototype credit scoring.

| Column Name | Type | Description | Valid Categories / Range | Used in Default Model? |
|---|---|---|---|---|
| Profile_ID | String | Unique synthetic identifier | `A0001` - `A9999` | No (ID) |
| Age | Integer | Applicant age in years | 18 - 65 | Optional (Safeguard enabled) |
| Employment_Status | Categorical | Employment nature | Salaried, Self-employed, Freelancer, Student, Unemployed, Other | Yes |
| Educational_Background | Categorical | Highest level achieved | High School, Diploma, Bachelor's, Master's, PhD, Other | Optional (Safeguard enabled) |
| Bank_Account_Tenure | Categorical | Banking duration | No bank account, Less than 1 year, 1–2 years, 2–5 years, More than 5 years | Yes |
| Residential_Stability | Categorical | Residence duration | Less than 1 year, 1–3 years, More than 3 years | Yes |
| Rent_Payment_History | Categorical | Consistency in rent | Always on time, Mostly on time, Frequently late, No payment history | Yes |
| Utility_Payment_History | Categorical | Utility bill regularity | Always on time, Mostly on time, Frequently late, No payment history | Yes |
| Telecommunications_Payment_History | Categorical | Phone/internet bill regularity | Always on time, Mostly on time, Frequently late, No payment history | Yes |
| Savings_Pattern | Categorical | Monthly savings habit | Regular savings, Some savings, Little or no savings, Prefer not to say | Yes |
| Gig_Economy_Participation | Categorical | Gig/platform work engagement | None, Part-Time, Full-Time | Yes |
| Online_Shopping_Behavior | Categorical | Discretionary digital shopping | Frequent, Occasional, None | Excluded by default (Safeguard) |
| Social_Media_Footprint | Categorical | Social activity volume | High, Medium, Low | Excluded by default (Safeguard) |
| Repayment_Status | Categorical | Ground truth target | Paid on Time, Late Payment, Default | Target Variable |

## Ethical Safeguards & Fair Lending Note
- Social media footprint and online shopping behavior are intentionally excluded from default ML models to respect privacy and prevent bias.
- Age and educational background are isolated to avoid proxy discrimination.
- All records are purely synthetic and must not be used for real-world underwriting decisions.
