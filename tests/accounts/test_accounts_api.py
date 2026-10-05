import pytest

pytestmark = pytest.mark.django_db


def test_register_creates_user_and_token(api_client):
    response = api_client.post("/api/accounts/register/", {
        "username": "newuser", "email": "newuser@example.com", "password": "SuperSecurePass123!",
    })
    assert response.status_code == 201
    assert response.data["user"]["username"] == "newuser"
    assert "token" in response.data
    assert response.data["user"]["profile"]["role"] == "researcher"


def test_register_rejects_duplicate_username(api_client, test_user):
    response = api_client.post("/api/accounts/register/", {
        "username": test_user.username, "email": "another@example.com", "password": "SuperSecurePass123!",
    })
    assert response.status_code == 400


def test_login_returns_token(api_client, test_user):
    response = api_client.post("/api/accounts/login/", {
        "username": test_user.username, "password": "TestPass123!",
    })
    assert response.status_code == 200
    assert "token" in response.data


def test_profile_requires_authentication(api_client):
    response = api_client.get("/api/accounts/profile/")
    assert response.status_code == 401


def test_profile_returns_authenticated_user(authenticated_client, test_user):
    response = authenticated_client.get("/api/accounts/profile/")
    assert response.status_code == 200
    assert response.data["username"] == test_user.username
