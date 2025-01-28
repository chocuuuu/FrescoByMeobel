from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from shared.generic_viewset import GenericViewset
from .models import Employee
from .serializers import EmployeeSerializer


class EmployeeViewset(GenericViewset, viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]

    def get_permissions(self):
        if self.action in self.protected_views:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        """
        Creates an Employee instance using existing user and employment_info.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data.pop("user_id")
        employment_info = serializer.validated_data.pop("employment_info_id")

        employee = Employee.objects.create(user=user, employment_info=employment_info)

        return Response(self.get_serializer(employee).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """
        Updates the Employee instance, allowing user and employment_info changes.
        """
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        if "user_id" in serializer.validated_data:
            instance.user = serializer.validated_data.pop("user_id")
        if "employment_info_id" in serializer.validated_data:
            instance.employment_info = serializer.validated_data.pop("employment_info_id")

        instance.save()

        return Response(self.get_serializer(instance).data, status=status.HTTP_200_OK)
