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
    permission_classes = [IsAuthenticated]
    queryset = EmploymentInfo.objects.all()
    serializer_class = EmploymentInfoSerializer

    def create(self, request, *args, **kwargs):
        """Create EmploymentInfo with user creation handled by the serializer."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employment_info = serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update EmploymentInfo, ensuring user role sync."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        old_role = instance.user.role if instance.user else None

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        employment_info = serializer.save()

        # Update user role if changed
        new_role = request.data.get("role")
        if old_role and new_role and old_role != new_role:
            user = instance.user
            if user:
                # Delete old role instance
                if old_role == "admin":
                    Admin.objects.filter(user=user).delete()
                elif old_role == "employee":
                    Employee.objects.filter(user=user).delete()

                # Update user role and create new role instance
                user.role = new_role
                user.save()

                if new_role == "admin":
                    Admin.objects.create(user=user, employment_info=employment_info)
                elif new_role == "employee":
                    Employee.objects.create(user=user, employment_info=employment_info)

        return Response(serializer.data, status=status.HTTP_200_OK)
