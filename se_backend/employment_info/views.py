from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework import viewsets, status
from rest_framework.response import Response

from shared.generic_viewset import GenericViewset
from shared.permissions import IsOwnerOrAdmin
from users.models import CustomUser
from admins.models import Admin
from employees.models import Employee
from .models import EmploymentInfo
from .serializers import EmploymentInfoSerializer


class EmploymentInfoViewset(GenericViewset, viewsets.ModelViewSet):
    permission_classes = [IsOwnerOrAdmin]
    queryset = EmploymentInfo.objects.all()
    serializer_class = EmploymentInfoSerializer

    def create(self, request, *args, **kwargs):
        """Create EmploymentInfo with user creation handled by the serializer."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employment_info = serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """
        Update EmploymentInfo and corresponding role-based instance.
        """
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        # Retrieve associated user
        admin = Admin.objects.filter(employment_info=instance).first()
        employee = Employee.objects.filter(employment_info=instance).first()

        user = admin.user if admin else employee.user if employee else None
        if not user:
            return Response(
                {"detail": "No user associated with this employment info."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Handle update process
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Update user if email, password, or role changes
        email = request.data.get("email")
        password = request.data.get("password")
        role = request.data.get("role")

        if email and email != user.email:
            user.email = email
        if password:
            user.set_password(password)
        if role and role != user.role:
            # Delete old role instance and create new one
            if user.role == "admin":
                Admin.objects.filter(user=user).delete()
            elif user.role == "employee":
                Employee.objects.filter(user=user).delete()

            user.role = role
            user.save()

            if role == "admin":
                Admin.objects.create(user=user, employment_info=instance)
            elif role == "employee":
                Employee.objects.create(user=user, employment_info=instance)

        user.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
