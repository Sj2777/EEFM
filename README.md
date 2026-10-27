# AltScore — AI-Powered Alternative Credit Scoring System

![AltScore Architecture](https://img.shields.io/badge/Status-Operational-10b981?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn%20RandomForest-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![SQLite](https://img.shields.io/badge/Database-SQLite%203%20ORM-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

**AltScore** is an end-to-end, portfolio-grade alternative credit intelligence web application. It evaluates repayment reliability for individuals with limited or non-existent traditional credit bureau histories (e.g., college students, gig economy workers, freelance creatives, independent contractors, and thin-file individuals) using non-traditional behavioral, utility, telecom, and stability indicators.

> **Disclaimer:** AltScore is an educational research prototype using synthetic datasets. Experimental credit scores (300–900) and repayment category predictions are illustrative model outputs and have not been validated for real-world underwriting or commercial lending decisions.

---

## 📸 System Architecture & Visual Design

AltScore features a dark navy-blue sidebar, pale blue/white backdrop, and color-coded risk indicators:
- **Good (700–900)**: `#10b981` (Emerald Green)
- **Fair (600–699)**: `#3b82f6` (Electric Blue)
- **Poor (500–599)**: `#f59e0b` (Amber Warning)
- **High Risk (300–499)**: `#ef4444` (Rose Alert)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ALTSCORE ARCHITECTURE                           │
├────────────────────────────────┬───────────────────────────────────────┤
│ FRONTEND (React 19 + Vite + TS) │ BACKEND (FastAPI + Python 3.11)       │
│ • Dark Navy Nav Sidebar        │ • RESTful API Endpoints (/api/*)      │
│ • 7 Functional Pages           │ • Scikit-learn Pipeline Inference     │
│ • SVG Score Gauge & Recharts   │ • Atomic Safe Retraining Service      │
│ • React Hook Form + Zod        │ • ReportLab PDF Generator Engine      │
│ • Quick-Fill Demo Profiles     │ • SQLite Database (SQLAlchemy ORM)    │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 🚀 The 7 Core Application Pages

1. **Dashboard (`/`)**
   - High-level metric cards: Total Applicants, Average Score, Low-Risk %, High-Risk %.
   - Real-time Recharts: 4-tier Score Distribution bar chart & Repayment prediction donut chart.
   - 5 most recent assessments with instant view actions.
   - Prototype synthetic data badge and informational notice.

2. **New Applicant (`/new-applicant`)**
   - Structured 2-section form (Demographics & Non-Traditional Stability Indicators).
   - Zod schema validation for age (18–100), employment, utility, telecom, rent, and savings.
   - **4 Quick-Fill One-Click Demo Profiles**:
     - *College Student (Thin-File)*
     - *Gig-Economy Driver*
     - *Freelance Designer*
     - *Credit-Stressed Freelancer*
   - Real-time scoring submission routing to the explanation dashboard.

3. **Credit Score & Explanation (`/score/:assessmentId`)**
   - 240-degree SVG score arc gauge display with color-coded tiering.
   - Multi-class repayment probability distributions (Paid on Time, Late Payment, Default).
   - Key influencing factor weights calculated from model feature importance.
   - Actionable personalized steps for score improvement.
   - **Re-assess** button (stores historical assessments without overwriting).
   - **Download Assessment PDF** report with formatted headers.

4. **Applicant Records (`/records`)**
   - Paginated searchable directory of all scored borrowers.
   - Live filters by Employment Status, Risk Tier, and Score range.
   - Multi-column sorting (Date, Score, Applicant ID).
   - **Export CSV** button downloading the complete database.

5. **Analytics & Reports (`/analytics`)**
   - Portfolio summary: Analyzed profiles, average, min, max, and median score.
   - Score tier breakdown donut chart.
   - 6-month on-time payment trend lines (Rent, Utilities, Telecom compliance).
   - Breakdown tables comparing average scores by employment category.
   - **Download Portfolio Analytics PDF** button.

6. **Model Performance (`/model`)**
   - Real metrics evaluated on held-out test split (20% partition): Accuracy, Precision, Recall, F1-Score.
   - 3×3 Confusion Matrix (Paid on Time, Late Payment, Default).
   - Permutation feature importance horizontal bar chart.
   - Per-class classification report (precision, recall, f1, support).
   - Model specifications card with **Ethical Fairness Safeguards**.
   - **Retrain Model** trigger with progress feedback.

7. **Settings & Data (`/settings`)**
   - **Dataset Management**: Drag-and-drop or select CSV file to validate schema and preview rows.
   - **Download Sample CSV** (10-row pre-formatted template).
   - **Export Database** (persisted applicant SQLite database as CSV).
   - **Atomic Model Retraining**: Validates new models in a candidate staging folder before deployment.
   - Ethical governance disclosure (listing excluded demographic variables).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite 8 |
| **Styling & Icons** | Tailwind CSS v4, Lucide React, Canvas Confetti |
| **Charts & Visualization** | Recharts, Custom SVG Arc Gauges |
| **Form Handling** | React Hook Form, Zod Resolver |
| **Backend Framework** | FastAPI (ASGI), Uvicorn, Pydantic v2 |
| **Data Processing & ML** | Pandas, NumPy, Scikit-learn (RandomForestClassifier), Joblib |
| **Database & ORM** | SQLite 3, SQLAlchemy 2.0 |
| **PDF Generation** | ReportLab 4.x |
| **Testing** | Pytest, Starlette TestClient |

---

## ⚖️ Machine Learning & Ethical Safeguards

### Score Formula (300–900 Scale)
AltScore translates multi-class probability outputs into an experimental 300–900 credit score:
$$\text{Score} = 300 + 600 \times \left(1.0 \cdot P(\text{Paid on Time}) + 0.45 \cdot P(\text{Late Payment}) + 0.05 \cdot P(\text{Default})\right)$$
Clamped securely between $300$ and $900$.

### Active Feature Inputs (8 Indicators)
- `Employment_Status` (Salaried, Self-employed, Freelancer, Student, etc.)
- `Bank_Account_Tenure` (Duration of banking relationship)
- `Residential_Stability` (Tenure at current residence)
- `Utility_Payment_History` (Electricity, water, gas compliance)
- `Rent_Payment_History` (Rental payment track record)
- `Telecommunications_Payment_History` (Mobile/broadband bill compliance)
- `Savings_Pattern` (Monthly surplus allocation)
- `Gig_Economy_Participation` (Platform economy activity)

### Explicitly Excluded Features (Ethical Safeguards)
To prevent algorithmic discrimination and privacy infringement:
- ❌ **Age**: Excluded to comply with fair lending principles.
- ❌ **Educational Background**: Excluded to prevent socio-economic bias proxies.
- ❌ **Social Media Footprint**: Excluded as an invasive non-financial signal.
- ❌ **Online Shopping Habits**: Excluded due to consumer privacy boundaries.

---

## 💻 Local Setup & Execution Guide (Windows PowerShell)

### Prerequisites
- Python 3.11+
- Node.js v18+ & npm

### 1. Clone & Enter Project Root
```powershell
cd d:\techrush2\anti
```

### 2. Run Backend (FastAPI Server)
```powershell
# Using the pre-configured virtual environment:
& ".\backend\.venv\Scripts\uvicorn.exe" app.main:app --reload --host 0.0.0.0 --port 8000
```
> The API will be live at: **http://localhost:8000**  
> Interactive OpenAPI documentation at: **http://localhost:8000/docs**

### 3. Run Frontend (React Vite Dev Server)
In a separate terminal window:
```powershell
cd d:\techrush2\anti\frontend
npm.cmd run dev
```
> The web interface will open at: **http://localhost:5173** (with API requests proxied to port 8000).

---

## 🧪 Running Automated Tests

Run the backend Pytest test suite from the project root:
```powershell
cd d:\techrush2\anti
& ".\backend\.venv\Scripts\pytest.exe" backend/tests/test_api.py -v
```

### Test Coverage Checklist:
- [x] `test_health_check` — Server status confirmation
- [x] `test_score_mapping_bounds` — Score clamped between 300 and 900
- [x] `test_risk_level_determination` — Correct category assignment
- [x] `test_score_endpoint` — ML model scoring inference
- [x] `test_dashboard_summary` — Aggregated metric calculations
- [x] `test_applicants_list_and_search` — Query filtering and pagination
- [x] `test_applicant_reassessment` — Historical assessment retention
- [x] `test_model_metrics` — Confusion matrix & held-out accuracy
- [x] `test_analytics_summary` — Portfolio trend aggregations
- [x] `test_sample_csv_download` — CSV sample generator

---

## 📡 Complete REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & system status |
| `GET` | `/api/dashboard/summary` | Metric cards & score distribution |
| `GET` | `/api/dashboard/charts` | Score & repayment charts data |
| `POST` | `/api/score` | Compute score for applicant |
| `POST` | `/api/applicants` | Create applicant & run assessment |
| `GET` | `/api/applicants` | Paginated search, filter & sort applicants |
| `GET` | `/api/applicants/{id}` | Single applicant details & history |
| `POST` | `/api/applicants/{id}/assessments` | Re-score existing applicant |
| `GET` | `/api/assessments/{id}` | Assessment results, factors & suggestions |
| `GET` | `/api/analytics/summary` | Macro distribution & payment trends |
| `GET` | `/api/model/status` | Model type, version & feature list |
| `GET` | `/api/model/metrics` | Test accuracy, confusion matrix & report |
| `GET` | `/api/model/feature-importance` | Permutation feature weights |
| `POST` | `/api/model/retrain` | Retrain RandomForest model |
| `GET` | `/api/data/sample` | Download sample CSV template |
| `POST` | `/api/data/upload` | Upload & validate new CSV dataset |
| `GET` | `/api/data/export` | Export database records to CSV |
| `GET` | `/api/reports/assessments/{id}` | Download assessment PDF report |
| `GET` | `/api/reports/analytics` | Download analytics summary PDF |

---

## 📄 License & Academic Attribution
Developed as an experimental portfolio demonstration in alternative credit risk modeling, fair lending algorithms, and modern full-stack engineering.
