from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from accounts.models import UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()
    age = serializers.ReadOnlyField()

    class Meta:
        model = UserProfile
        fields = [
            "role", "institution", "full_name", "date_of_birth", "age",
            "blood_group", "profile_picture_url", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_profile_picture_url(self, obj):
        if not obj.profile_picture:
            return None
        request = self.context.get("request")
        url = obj.profile_picture.url
        return request.build_absolute_uri(url) if request else url


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "date_joined", "profile"]
        read_only_fields = ["id", "date_joined"]


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Self-service profile edits. `role` is intentionally excluded —
    conceptually an admin-controlled field, not self-assignable, even
    though this app doesn't yet enforce per-role permissions elsewhere."""

    class Meta:
        model = UserProfile
        fields = ["full_name", "institution", "date_of_birth", "blood_group", "profile_picture"]

    def validate_date_of_birth(self, value):
        from datetime import date

        if value and value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=UserProfile.Role.choices, default=UserProfile.Role.RESEARCHER)
    institution = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value
