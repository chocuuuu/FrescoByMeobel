from rest_framework.permissions import IsAdminUser, IsAuthenticated

from shared.generic_viewset import GenericViewset

from .models import EmploymentInfo
from .serializers import EmploymentInfoSerializer


class EmploymentInfoViewset(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = EmploymentInfo.objects.all()
    serializer_class = EmploymentInfoSerializer