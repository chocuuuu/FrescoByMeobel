from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from shared.generic_viewset import GenericViewset
from .models import Admin
from .serializers import AdminSerializer


class AdminViewset(GenericViewset, viewsets.ModelViewSet):
    queryset = Admin.objects.all()
    serializer_class = AdminSerializer
    permission_classes = [IsAuthenticated]

    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]

    def get_permissions(self):
        if self.action in self.protected_views:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    # Commented out as admin creation is now handled via EmploymentInfo creation
    # def create(self, request, *args, **kwargs):
    #     """
    #     Creates an Admin instance using existing user and employment_info.
    #     """
    #     serializer = self.get_serializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)

    #     user = serializer.validated_data.pop("user_id")
    #     employment_info = serializer.validated_data.pop("employment_info_id")

    #     admin = Admin.objects.create(user=user, employment_info=employment_info)

    #     return Response(self.get_serializer(admin).data, status=status.HTTP_201_CREATED)

    # Commented out as admin updates should be managed via user and employment_info updates
    # def update(self, request, *args, **kwargs):
    #     """
    #     Updates the Admin instance, allowing user and employment_info changes.
    #     """
    #     partial = kwargs.pop("partial", False)
    #     instance = self.get_object()

    #     serializer = self.get_serializer(instance, data=request.data, partial=partial)
    #     serializer.is_valid(raise_exception=True)

    #     if "user_id" in serializer.validated_data:
    #         instance.user = serializer.validated_data.pop("user_id")
    #     if "employment_info_id" in serializer.validated_data:
    #         instance.employment_info = serializer.validated_data.pop("employment_info_id")

    #     instance.save()

    #     return Response(self.get_serializer(instance).data, status=status.HTTP_200_OK)
