import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Applicant(Base):
    __tablename__ = "applicants"

    id = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=True)  # Optional display name
    age = Column(Integer, nullable=False)
    employment_status = Column(String(64), nullable=False)
    educational_background = Column(String(64), nullable=False)
    bank_account_tenure = Column(String(64), nullable=False)
    residential_stability = Column(String(64), nullable=False)
    utility_payment_history = Column(String(64), nullable=False)
    rent_payment_history = Column(String(64), nullable=False)
    telecommunications_payment_history = Column(String(64), nullable=False)
    savings_pattern = Column(String(64), nullable=False)
    gig_economy_participation = Column(String(64), default="None", nullable=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    assessments = relationship("Assessment", back_populates="applicant", cascade="all, delete-orphan", order_by="desc(Assessment.created_at)")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(String(64), unique=True, index=True, nullable=False)
    applicant_id = Column(String(64), ForeignKey("applicants.applicant_id"), nullable=False, index=True)
    
    score = Column(Integer, nullable=False)  # 300 - 900
    risk_level = Column(String(64), nullable=False)  # Good, Fair, Poor, High Risk
    predicted_category = Column(String(64), nullable=False)  # Paid on Time, Late Payment, Default
    repayment_probability = Column(Float, nullable=False)  # 0.0 - 1.0 (calibrated class probability)
    
    class_probabilities_json = Column(Text, nullable=True)  # JSON string of class probas
    key_factors_json = Column(Text, nullable=True)  # JSON string of factor percentage impacts
    suggestions_json = Column(Text, nullable=True)  # JSON string of actionable tips
    
    model_version = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)

    applicant = relationship("Applicant", back_populates="assessments")


class ModelTrainingRun(Base):
    __tablename__ = "model_training_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(64), unique=True, index=True, nullable=False)
    model_version = Column(String(64), nullable=False)
    dataset_identifier = Column(String(256), nullable=False)
    dataset_rows = Column(Integer, nullable=False)
    status = Column(String(32), nullable=False)  # SUCCESS, FAILED
    metrics_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    trained_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
