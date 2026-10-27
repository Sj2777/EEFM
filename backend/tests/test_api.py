import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.main import app, seed_database_if_empty
from app.db.database import engine, Base
from app.services.scoring_service import calculate_experimental_score, determine_risk_level

# Ensure tables and seed exist for tests
Base.metadata.create_all(bind=engine)
seed_database_if_empty()

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_available"] is True


def test_score_mapping_bounds():
    # Test boundary conditions
    score_low = calculate_experimental_score({"Paid on Time": 0.0, "Late Payment": 0.0, "Default": 1.0})
    score_high = calculate_experimental_score({"Paid on Time": 1.0, "Late Payment": 0.0, "Default": 0.0})
    score_mid = calculate_experimental_score({"Paid on Time": 0.5, "Late Payment": 0.3, "Default": 0.2})

    assert 300 <= score_low <= 900
    assert 300 <= score_high <= 900
    assert 300 <= score_mid <= 900
    assert score_high > score_low


def test_risk_level_determination():
    assert determine_risk_level(750)[0] == "Good"
    assert determine_risk_level(650)[0] == "Fair"
    assert determine_risk_level(550)[0] == "Poor"
    assert determine_risk_level(450)[0] == "High Risk"


def test_score_endpoint():
    payload = {
        "applicant_id": "TEST_A999",
        "name": "Jane Doe",
        "age": 29,
        "employment_status": "Salaried",
        "educational_background": "Graduate",
        "bank_account_tenure": "2–5 years",
        "residential_stability": "1–3 years",
        "utility_payment_history": "Always on time",
        "rent_payment_history": "Always on time",
        "telecommunications_payment_history": "Always on time",
        "savings_pattern": "Regular savings",
        "gig_economy_participation": "None",
        "persist": True
    }
    response = client.post("/api/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert 300 <= data["score"] <= 900
    assert data["predicted_category"] in ["Paid on Time", "Late Payment", "Default"]
    assert "class_probabilities" in data
    assert "key_factors" in data
    assert "suggestions" in data
    assert "disclaimer" in data


def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_applicants" in data
    assert "average_experimental_score" in data
    assert "score_distribution" in data
    assert len(data["score_distribution"]) == 4


def test_applicants_list_and_search():
    response = client.get("/api/applicants?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) > 0


def test_applicant_reassessment():
    import uuid
    test_id = f"TEST_REASSESS_{uuid.uuid4().hex[:6]}"
    # 1. Create applicant
    payload = {
        "applicant_id": test_id,
        "name": "Alex Smith",
        "age": 35,
        "employment_status": "Freelancer",
        "educational_background": "Bachelor's",
        "bank_account_tenure": "1–2 years",
        "residential_stability": "1–3 years",
        "utility_payment_history": "Mostly on time",
        "rent_payment_history": "Mostly on time",
        "telecommunications_payment_history": "Always on time",
        "savings_pattern": "Some savings",
        "gig_economy_participation": "Part-Time"
    }
    r1 = client.post("/api/applicants", json=payload)
    assert r1.status_code == 201

    # 2. Reassess with improved payment habits
    payload_reassess = payload.copy()
    payload_reassess["rent_payment_history"] = "Always on time"
    payload_reassess["savings_pattern"] = "Regular savings"
    r2 = client.post(f"/api/applicants/{test_id}/assessments", json=payload_reassess)
    assert r2.status_code == 201
    new_assessment = r2.json()
    assert "score" in new_assessment

    # 3. Verify history preserves both assessments
    r3 = client.get(f"/api/applicants/{test_id}/assessments")
    assert r3.status_code == 200
    history = r3.json()
    assert len(history) >= 2


def test_model_metrics():
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "accuracy" in data
    assert "precision" in data
    assert "recall" in data
    assert "f1_score" in data
    assert "confusion_matrix" in data


def test_analytics_summary():
    response = client.get("/api/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "score_donut" in data
    assert "payment_trends" in data
    assert "payment_patterns" in data


def test_sample_csv_download():
    response = client.get("/api/data/sample")
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    assert "Profile_ID" in response.text


def test_cors_port_5501():
    # Test that requests originating from frontend on port 5501 are allowed with CORS headers
    headers = {
        "Origin": "http://localhost:5501",
        "Access-Control-Request-Method": "GET"
    }
    response = client.get("/api/health", headers={"Origin": "http://localhost:5501"})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5501"

    # Preflight OPTIONS request
    preflight = client.options(
        "/api/score",
        headers={
            "Origin": "http://127.0.0.1:5501",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        }
    )
    assert preflight.status_code == 200
    assert preflight.headers.get("access-control-allow-origin") == "http://127.0.0.1:5501"

