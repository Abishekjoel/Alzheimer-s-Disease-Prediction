from rest_framework import status
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import RegisterSerializer, UpdateProfileSerializer, UserSerializer
from accounts.services import register_user


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, token = register_user(**serializer.validated_data)
        return Response(
            {"user": UserSerializer(user, context={"request": request}).data, "token": token.key},
            status=status.HTTP_201_CREATED,
        )


class LoginView(ObtainAuthToken):
    """Thin wrapper around DRF's token auth view that also returns the
    authenticated user's profile, so clients don't need a second request."""

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        token_key = response.data.get("token")
        if token_key:
            from rest_framework.authtoken.models import Token

            user = Token.objects.select_related("user").get(key=token_key).user
            response.data["user"] = UserSerializer(user, context={"request": request}).data
        return response


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        profile = request.user.profile
        serializer = UpdateProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user, context={"request": request}).data)
