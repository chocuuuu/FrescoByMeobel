from datetime import datetime
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.urls import reverse
from django.conf import settings
from django.contrib import messages
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.shortcuts import get_object_or_404,render
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework import generics, permissions, status, views
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.http import HttpResponseRedirect

from employment_info.models import EmploymentInfo
from shared.utils.email import send_email
from users.models import CustomUser, UserPasswordReset

from shared.auth.serializers import ChangeEmailSerializer, ChangePasswordSerializer, LoginSerializer, ResetPasswordRequestSerializer, ResetPasswordSerializer



class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer


class ChangeEmailView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangeEmailSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        self.perform_update(serializer)

        return Response(
            {
                "message": "Password changed successfully!",
            },
            status=status.HTTP_200_OK,
        )


class SendResetPasswordLink(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = ResetPasswordRequestSerializer
    template_name = "reset_password.html"

    def get(self, request):
        return render(request, self.template_name)

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        email = request.data["email"]
        user = get_object_or_404(CustomUser, email=email)

        # Generate password reset token and encoded user ID
        token = PasswordResetTokenGenerator().make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

        # Save reset token in the database (optional, if you store tokens)
        reset = UserPasswordReset(email=email, token=token)
        reset.save()

        # Generate the backend reset link
        reset_link = request.build_absolute_uri(
            reverse("reset-password", kwargs={"token": token})
        )

        # Send the reset email
        send_email(
            subject="[Fresco]: Password Reset Request",
            recipient=user.email,
            html=render_to_string(
                "reset_password_email.html",
                {
                    "reset_link": reset_link,
                    "id": user.id,
                },
            ),
        )

        return render(request, "reset_password_sent.html", {"email": email})


class ResetPasswordView(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer
    permission_classes = []

    def get(self, request, token):
        """Render the password reset form."""
        return render(request, "password_reset_confirm.html", {"token": token})

    def post(self, request, token):
        """Handle password reset form submission."""
        new_password = request.POST.get("new_password")
        confirm_password = request.POST.get("confirm_password")

        if new_password != confirm_password:
            messages.error(request, "Passwords do not match.")
            return render(request, "password_reset_confirm.html", {"token": token})

        reset_obj = UserPasswordReset.objects.filter(token=token).first()
        if not reset_obj:
            messages.error(request, "Invalid token.")
            return render(request, "password_reset_confirm.html", {"token": token})

        user = CustomUser.objects.filter(email=reset_obj.email).first()
        if not user:
            messages.error(request, "No user found.")
            return render(request, "password_reset_confirm.html", {"token": token})

        # Update user password
        user.set_password(new_password)
        user.save()
        reset_obj.delete()

        messages.success(request, "Password has been updated successfully.")
        # Redirect dynamically based on settings
        frontend_domain = settings.FRONTEND_DOMAIN.rstrip("/")
        return HttpResponseRedirect(frontend_domain)

class ValidateResetPasswordTokenView(views.APIView):
    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response(
                {"error": "Token is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        reset_obj = UserPasswordReset.objects.filter(token=token).first()
        current_time = timezone.now()
        token_created_date: datetime = reset_obj.created_at
        password_timeout_duration = 3600  # 1 hour in seconds
        is_expired = (
            abs(current_time - token_created_date)
        ).total_seconds() > password_timeout_duration

        if is_expired or not reset_obj:
            return Response(
                {"error": "Token has expired or is invalid."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"message": "Token is valid."}, status=status.HTTP_200_OK)