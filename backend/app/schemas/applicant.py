from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime


class ApplicantBase(BaseModel):
    applicant_id: Optional[str] = Field(None, description="Optional custom unique ID; auto-generated if omitted")
    name: Optional[str] = Field(None, description="Applicant display name")
    age: int = Field(..., ge=18, le=100, description="Applicant age (18-100)")
    employment_status: str = Field(..., description="Employment type (Salaried, Self-employed, Freelancer, Student, Unemployed, Other)")
    educational_background: str = Field(..., description="Highest education completed")
    bank_account_tenure: str = Field(..., description="Duration with bank account")
    residential_stability: str = Field(..., description="Duration at current residence")
    utility_payment_history: str = Field(..., description="Utility bill payment history")
    rent_payment_history: str = Field(..., description="Rent payment history")
    telecommunications_payment_history: str = Field(..., description="Phone/internet bill payment history")
    savings_pattern: str = Field(..., description="Monthly savings behavior")
    gig_economy_participation: Optional[str] = Field("None", description="Gig or platform economy involvement")

    @field_validator("age")
    @classmethod
    def validate_age(cls, v):
        if v < 18 or v > 100:
            raise ValueError("Age must be between 18 and 100")
        return v


class ApplicantCreate(ApplicantBase):
    pass


class AssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    assessment_id: str
    applicant_id: str
    score: int
    risk_level: str
    predicted_category: str
    repayment_probability: float
    class_probabilities: Dict[str, float]
    key_factors: Dict[str, float]
    suggestions: List[str]
    model_version: str
    created_at: datetime


class ApplicantResponse(ApplicantBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    applicant_id: str
    created_at: datetime
    updated_at: datetime
    latest_assessment: Optional[AssessmentResponse] = None


class ApplicantDetailResponse(ApplicantResponse):
    assessments: List[AssessmentResponse] = []


class ScoreRequest(ApplicantBase):
    persist: bool = Field(True, description="Whether to persist the applicant and assessment to the database")


class ScoreResponse(BaseModel):
    applicant_id: str
    assessment_id: str
    score: int
    risk_level: str
    predicted_category: str
    repayment_probability: float
    class_probabilities: Dict[str, float]
    key_factors: Dict[str, float]
    suggestions: List[str]
    summary_text: str
    model_version: str
    created_at: datetime
    disclaimer: str


class DashboardSummary(BaseModel):
    total_applicants: int
    average_experimental_score: int
    low_risk_count: int
    low_risk_percentage: float
    high_risk_count: int
    high_risk_percentage: float
    score_distribution: List[Dict[str, Any]]
    repayment_distribution: List[Dict[str, Any]]
    recent_assessments: List[Dict[str, Any]]
    disclaimer: str


class ModelStatusResponse(BaseModel):
    model_type: str
    model_version: str
    trained_at: str
    dataset_path: str
    total_records: int
    train_records: int
    test_records: int
    metrics: Dict[str, Any]
    feature_importance: Dict[str, float]
    features_used: List[str]
    excluded_features: List[str]
    disclaimer: str
