import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


def generate_case_id():
    return f"CASE-{uuid.uuid4().hex[:10].upper()}"


def case_photo_upload_path(instance, filename):
    ext = filename.rsplit(".", 1)[-1].lower()
    return f"case_photos/{uuid.uuid4().hex}.{ext}"


class Case(models.Model):
    """A research case/subject record.

    Originally deliberately minimal/non-identifying (age band + sex only).
    Extended on explicit direction to also capture name, weight, blood
    group, and a photo for the "Users" search/review workflow. This is a
    real change of posture from the original no-PII design — in a genuine
    clinical/multi-tenant deployment this data would need proper consent
    capture, access controls, and retention policy beyond what this
    research prototype implements. `created_by`-scoped visibility (see
    patients/views.py::CaseViewSet) is the only access control currently
    in place.
    """

    class Sex(models.TextChoices):
        MALE = "M", "Male"
        FEMALE = "F", "Female"
        UNKNOWN = "U", "Unknown / not specified"

    class BloodGroup(models.TextChoices):
        A_POS = "A+", "A+"
        A_NEG = "A-", "A-"
        B_POS = "B+", "B+"
        B_NEG = "B-", "B-"
        AB_POS = "AB+", "AB+"
        AB_NEG = "AB-", "AB-"
        O_POS = "O+", "O+"
        O_NEG = "O-", "O-"
        UNKNOWN = "", "Unknown"

    case_id = models.CharField(max_length=32, unique=True, default=generate_case_id, editable=False)

    full_name = models.CharField(max_length=150, blank=True)
    age_years = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MaxValueValidator(130)])
    sex = models.CharField(max_length=1, choices=Sex.choices, default=Sex.UNKNOWN)
    blood_group = models.CharField(max_length=3, choices=BloodGroup.choices, blank=True)
    weight_kg = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(500)])
    photo = models.ImageField(upload_to=case_photo_upload_path, null=True, blank=True)
    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="cases"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.case_id
