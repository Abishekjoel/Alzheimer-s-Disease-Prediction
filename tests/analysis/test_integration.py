"""
End-to-end integration test (Phase 24): MRI upload -> quality check ->
preprocessing -> hybrid model inference -> prediction -> explainability ->
database storage, all driven through the real REST API. Uses the actual
HybridCNNSwinModel (untrained weights, no downloads — see conftest.py) so
this test exercises the real forward pass, Grad-CAM, and Swin attention
extraction, not mocks.
"""

import pytest

from analysis.models import MRIAnalysis

pytestmark = pytest.mark.django_db


@pytest.mark.slow
def test_full_analysis_pipeline_via_api(authenticated_client, test_case, synthetic_uploaded_file):
    response = authenticated_client.post("/api/analysis/upload/", {
        "case": test_case.id, "image": synthetic_uploaded_file,
    }, format="multipart")

    assert response.status_code == 201
    data = response.data
    assert data["status"] == "completed"
    assert data["predicted_class"] in ("CN", "MCI", "AD")
    assert data["probabilities"] is not None
    assert abs(sum(data["probabilities"].values()) - 1.0) < 1e-3
    assert data["uncertainty_level"] in ("LOW", "MEDIUM", "HIGH")
    assert data["is_demo"] is True  # no trained checkpoint registered in tests
    assert data["gradcam_url"] is not None
    assert data["attention_map_url"] is not None

    analysis = MRIAnalysis.objects.get(pk=data["id"])
    assert analysis.status == MRIAnalysis.Status.COMPLETED
    assert analysis.model_version is not None
    assert analysis.case_id == test_case.id

    # History endpoint should now include this analysis
    history_response = authenticated_client.get("/api/analysis/history/")
    assert history_response.status_code == 200
    assert history_response.data["count"] == 1

    # Explainability endpoint
    explain_response = authenticated_client.get(f"/api/analysis/{analysis.id}/explainability/")
    assert explain_response.status_code == 200
    assert explain_response.data["gradcam_url"]

    # Report generation
    report_response = authenticated_client.get(f"/api/analysis/{analysis.id}/report/")
    assert report_response.status_code == 200
    assert report_response.data["report_url"]


def test_users_cannot_upload_to_others_case(api_client, django_user_model, test_case, synthetic_uploaded_file):
    other_user = django_user_model.objects.create_user(username="intruder", password="IntruderPass123!")
    from rest_framework.authtoken.models import Token

    token, _ = Token.objects.get_or_create(user=other_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    response = api_client.post("/api/analysis/upload/", {"case": test_case.id, "image": synthetic_uploaded_file}, format="multipart")
    assert response.status_code == 403


def test_upload_rejects_oversized_file(authenticated_client, test_case, settings):
    import io

    settings.MAX_UPLOAD_SIZE_MB = 0  # force rejection regardless of actual size
    from tests.conftest import make_synthetic_image

    buf = io.BytesIO()
    make_synthetic_image().save(buf, format="JPEG")
    buf.seek(0)
    buf.name = "too_big.jpg"

    response = authenticated_client.post("/api/analysis/upload/", {"case": test_case.id, "image": buf}, format="multipart")
    assert response.status_code == 400


def test_upload_rejects_disallowed_extension(authenticated_client, test_case):
    import io

    buf = io.BytesIO(b"not really a bitmap but wrong extension")
    buf.name = "scan.bmp"

    response = authenticated_client.post("/api/analysis/upload/", {"case": test_case.id, "image": buf}, format="multipart")
    assert response.status_code == 400
