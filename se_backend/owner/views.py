from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from shared.generic_viewset import GenericViewset
from .models import Owner
from .serializers import OwnerSerializer


class OwnerViewset(GenericViewset, viewsets.ModelViewSet):
    queryset = Owner.objects.all()
    serializer_class = OwnerSerializer
    permission_classes = [IsAuthenticated]

    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]

    def get_permissions(self):
        if self.action in self.protected_views:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        """
        Creates an Owner instance using an existing user.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data.pop("user_id")
        permissions = serializer.validated_data.get("permissions", "")  # Fetch permissions

        owner = Owner.objects.create(user=user, permissions=permissions)  # Pass permissions

        return Response(self.get_serializer(owner).data, status=status.HTTP_201_CREATED)


    def update(self, request, *args, **kwargs):
        """
        Updates the Owner instance, allowing user changes.
        """
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        if "user_id" in serializer.validated_data:
            instance.user = serializer.validated_data.pop("user_id")

        instance.save()

        return Response(self.get_serializer(instance).data, status=status.HTTP_200_OK)
