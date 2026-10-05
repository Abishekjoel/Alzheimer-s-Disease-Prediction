import pytest

pytestmark = pytest.mark.django_db


def test_dashboard_summary_reports_real_zero_for_fresh_user(authenticated_client):
    response = authenticated_client.get("/api/dashboard/summary/")
    assert response.status_code == 200
    assert response.data["total_cases"] == 0
    assert response.data["total_analyses"] == 0
    assert response.data["today_analyses"] == 0
    assert response.data["reports_generated"] == 0
    assert response.data["class_distribution"] == {"CN": 0, "MCI": 0, "AD": 0}
    assert response.data["recent_analyses"] == []


@pytest.mark.slow
def test_dashboard_summary_reflects_a_real_completed_analysis(authenticated_client, test_case, synthetic_uploaded_file):
    response = authenticated_client.post("/api/analysis/upload/", {
        "case": test_case.id, "image": synthetic_uploaded_file,
    }, format="multipart")
    assert response.status_code == 201
    assert response.data["status"] == "completed"

    summary = authenticated_client.get("/api/dashboard/summary/")
    assert summary.data["total_analyses"] == 1
    assert summary.data["today_analyses"] == 1
    predicted_class = response.data["predicted_class"]
    assert summary.data["class_distribution"][predicted_class] == 1
    assert len(summary.data["recent_analyses"]) == 1
    assert summary.data["recent_analyses"][0]["case_id"] == test_case.case_id
