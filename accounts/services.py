"""Business logic for account creation, kept out of views/serializers so it
can be reused by management commands, tests, and the API layer alike."""

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.authtoken.models import Token

from accounts.models import UserProfile

User = get_user_model()


@transaction.atomic
def register_user(*, username, email, password, role=UserProfile.Role.RESEARCHER, institution=""):
    user = User.objects.create_user(username=username, email=email, password=password)
    UserProfile.objects.create(user=user, role=role, institution=institution)
    token, _ = Token.objects.get_or_create(user=user)
    return user, token
