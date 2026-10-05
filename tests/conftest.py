import io

import numpy as np
import pytest
from PIL import Image
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def _isolate_media_root(tmp_path, settings):
    """Redirects uploaded MRIs, Grad-CAM/attention overlays, and generated
    PDF reports to a per-test temp directory instead of the project's real
    media/ folder, so running the test suite never leaves files behind in
    the repository."""
    media_root = tmp_path / "media"
    media_root.mkdir(exist_ok=True)
    settings.MEDIA_ROOT = str(media_root)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def test_user(django_user_model):
    return django_user_model.objects.create_user(username="tester", email="tester@example.com", password="TestPass123!")


@pytest.fixture
def authenticated_client(api_client, test_user):
    from rest_framework.authtoken.models import Token

    token, _ = Token.objects.get_or_create(user=test_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return api_client


@pytest.fixture
def test_case(test_user):
    from patients.models import Case

    return Case.objects.create(created_by=test_user, age_years=70, sex="F")


def make_synthetic_image(size=(224, 224), seed=0, mean=128, std=40):
    """Grayscale noise replicated across channels — a stand-in for a real
    (grayscale) MRI slice. Independent per-channel noise would make this
    a "colorful" image and get correctly rejected by the quality gate's
    colorfulness check (see analysis.services.quality_check), the same
    way a real non-MRI photo is."""
    rng = np.random.default_rng(seed)
    gray = np.clip(rng.normal(loc=mean, scale=std, size=size), 0, 255).astype("uint8")
    array = np.stack([gray, gray, gray], axis=-1)
    return Image.fromarray(array)


@pytest.fixture
def synthetic_pil_image():
    return make_synthetic_image()


@pytest.fixture
def synthetic_uploaded_file():
    img = make_synthetic_image()
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    buf.name = "synthetic_mri.jpg"
    return buf
