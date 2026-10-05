import pytest

from patients.models import Case

pytestmark = pytest.mark.django_db


def test_create_case_requires_authentication(api_client):
    response = api_client.post("/api/patients/cases/", {"age_years": 65, "sex": "M"})
    assert response.status_code == 401


def test_create_case_assigns_owner(authenticated_client, test_user):
    response = authenticated_client.post("/api/patients/cases/", {"age_years": 65, "sex": "M"})
    assert response.status_code == 201
    case = Case.objects.get(pk=response.data["id"])
    assert case.created_by == test_user
    assert case.case_id.startswith("CASE-")


def test_users_only_see_own_cases(authenticated_client, django_user_model, test_case, test_user):
    from rest_framework.authtoken.models import Token
    from rest_framework.test import APIClient

    other_user = django_user_model.objects.create_user(username="other", password="OtherPass123!")
    other_token, _ = Token.objects.get_or_create(user=other_user)
    other_client = APIClient()
    other_client.credentials(HTTP_AUTHORIZATION=f"Token {other_token.key}")

    response = other_client.get("/api/patients/cases/")
    assert response.status_code == 200
    assert response.data["count"] == 0

    response = authenticated_client.get("/api/patients/cases/")
    assert response.data["count"] == 1


def test_case_does_not_collect_unneeded_identifiers():
    """The Case model was deliberately extended (full_name, weight_kg,
    blood_group, photo) to support the Users search/review workflow — see
    the model docstring for that change of direction. It still doesn't
    collect identifiers the app has no use for."""
    field_names = {f.name for f in Case._meta.fields}
    assert "full_name" in field_names  # intentionally added
    assert "date_of_birth" not in field_names  # age_years is enough
    assert "ssn" not in field_names
    assert "address" not in field_names


def test_case_serializer_exposes_patient_fields(authenticated_client):
    response = authenticated_client.post("/api/patients/cases/", {
        "full_name": "Ada Lovelace", "age_years": 52, "sex": "F",
        "blood_group": "O+", "weight_kg": 68.5,
    })
    assert response.status_code == 201
    assert response.data["full_name"] == "Ada Lovelace"
    assert response.data["blood_group"] == "O+"
    assert response.data["weight_kg"] == 68.5
    assert response.data["latest_analysis"] is None


def test_case_filter_by_blood_group_and_search(authenticated_client):
    authenticated_client.post("/api/patients/cases/", {"full_name": "Ada Lovelace", "blood_group": "O+"})
    authenticated_client.post("/api/patients/cases/", {"full_name": "Alan Turing", "blood_group": "A-"})

    # "+" is passed via `data=` (not hand-built into the URL string) so
    # the test client URL-encodes it — a literal "+" in a query string is
    # otherwise decoded as a space per application/x-www-form-urlencoded.
    response = authenticated_client.get("/api/patients/cases/", {"blood_group": "O+"})
    assert response.data["count"] == 1
    assert response.data["results"][0]["full_name"] == "Ada Lovelace"

    response = authenticated_client.get("/api/patients/cases/", {"search": "turing"})
    assert response.data["count"] == 1
    assert response.data["results"][0]["full_name"] == "Alan Turing"
