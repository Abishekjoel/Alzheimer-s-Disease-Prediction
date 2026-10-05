from datetime import date

from django.conf import settings
from django.db import models


def profile_picture_upload_path(instance, filename):
    import uuid

    ext = filename.rsplit(".", 1)[-1].lower()
    return f"profile_pics/{uuid.uuid4().hex}.{ext}"


class UserProfile(models.Model):
    """Extends Django's built-in User with research-context fields plus
    the account holder's own personal details (name, DOB, blood group,
    profile picture). This is the *user account's* profile — distinct
    from patients.models.Case, which stays deliberately minimal/
    non-identifying since that represents a research subject, not the
    person operating the system."""

    class Role(models.TextChoices):
        RESEARCHER = "researcher", "Researcher"
        CLINICIAN = "clinician", "Clinician (research use only)"
        ADMIN = "admin", "Administrator"

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

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.RESEARCHER)
    institution = models.CharField(max_length=255, blank=True)

    full_name = models.CharField(max_length=150, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    blood_group = models.CharField(max_length=3, choices=BloodGroup.choices, blank=True)
    profile_picture = models.ImageField(upload_to=profile_picture_upload_path, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

    @property
    def age(self):
        """Computed from date_of_birth rather than stored separately, so
        it can never drift out of sync with the stored birth date."""
        if not self.date_of_birth:
            return None
        today = date.today()
        years = today.year - self.date_of_birth.year
        if (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day):
            years -= 1
        return years
