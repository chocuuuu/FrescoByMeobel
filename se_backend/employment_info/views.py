from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework import viewsets, status
from rest_framework.response import Response

from shared.generic_viewset import GenericViewset
from users.models import CustomUser
from admins.models import Admin
from employees.models import Employee
from .models import EmploymentInfo
from .serializers import EmploymentInfoSerializer


class EmploymentInfoViewset(GenericViewset, viewsets.ModelViewSet):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permission_classes = [IsAuthenticated]
    queryset = EmploymentInfo.objects.all()
    serializer_class = EmploymentInfoSerializer

    def create(self, request, *args, **kwargs):
        """
        Create EmploymentInfo and corresponding CustomUser, Employee, or Admin.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employment_info = serializer.save()

        # Get user input for email, password, and role
        email = request.data.get("email")
        password = request.data.get("password")
        role = request.data.get("role")

        if not email or not password or not role:
            return Response(
                {"detail": "Email, password, and role are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create user based on provided email and password
        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            role=role
        )

        # Create either an Admin or Employee based on the role
        if role == "admin":
            Admin.objects.create(user=user, employment_info=employment_info)
        elif role == "employee":
            Employee.objects.create(user=user, employment_info=employment_info)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """
        Update EmploymentInfo and corresponding role-based instance.
        """
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        old_role = instance.customuser_set.first().role if instance.customuser_set.exists() else None

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        employment_info = serializer.save()

        # Update role, email, and password if changed
        new_role = request.data.get("role")
        email = request.data.get("email")
        password = request.data.get("password")

        user = CustomUser.objects.filter(email=email).first()

        if user:
            if old_role and old_role != new_role:
                # Delete old role instance
                if old_role == "admin":
                    Admin.objects.filter(user=user).delete()
                elif old_role == "employee":
                    Employee.objects.filter(user=user).delete()

                # Update user role
                user.role = new_role
                user.save()

                # Create new role instance
                if new_role == "admin":
                    Admin.objects.create(user=user, employment_info=employment_info)
                elif new_role == "employee":
                    Employee.objects.create(user=user, employment_info=employment_info)

            # Update email and password if provided
            if email and user.email != email:
                user.email = email
            if password:
                user.set_password(password)
            user.save()

        return Response(serializer.data, status=status.HTTP_200_OK)
