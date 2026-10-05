import pytest
from django.db.models import ProtectedError

from analysis.models import ModelVersion, MRIAnalysis

pytestmark = pytest.mark.django_db


def test_only_one_model_version_can_be_active():
    v1 = ModelVersion.objects.create(
        name="Hybrid-CNN-Swin", version="1.0.0", cnn_architecture="resnet50",
        swin_architecture="swin_tiny_patch4_window7_224", fusion_method="attention_gated", is_active=True,
    )
    v2 = ModelVersion.objects.create(
        name="Hybrid-CNN-Swin", version="1.1.0", cnn_architecture="resnet50",
        swin_architecture="swin_tiny_patch4_window7_224", fusion_method="attention_gated", is_active=True,
    )
    v1.refresh_from_db()
    v2.refresh_from_db()
    assert v1.is_active is False
    assert v2.is_active is True


def test_model_version_cannot_be_deleted_while_referenced_by_analysis(test_case, test_user):
    model_version = ModelVersion.objects.create(
        name="Hybrid-CNN-Swin", version="1.0.0", cnn_architecture="resnet50",
        swin_architecture="swin_tiny_patch4_window7_224", fusion_method="attention_gated",
    )
    MRIAnalysis.objects.create(
        case=test_case, uploaded_by=test_user, image="mri/placeholder.jpg",
        model_version=model_version, status=MRIAnalysis.Status.COMPLETED,
    )

    with pytest.raises(ProtectedError):
        model_version.delete()
