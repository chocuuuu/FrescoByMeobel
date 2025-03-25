from rest_framework.permissions import IsAdminUser, IsAuthenticated
from shared.generic_viewset import GenericViewset
from .models import TotalOvertime
from .serializers import TotalOvertimeSerializer
from shared.pagination import StandardPagination

class TotalOvertimeViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = TotalOvertime.objects.all()
    serializer_class = TotalOvertimeSerializer
    pagination_class = StandardPagination