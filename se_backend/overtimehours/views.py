from rest_framework.permissions import IsAdminUser, IsAuthenticated
from shared.generic_viewset import GenericViewset
from .models import OvertimeHours
from .serializers import OvertimeHoursSerializer
from shared.pagination import StandardPagination

class OvertimeHoursViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = OvertimeHours.objects.all()
    serializer_class = OvertimeHoursSerializer
    pagination_class = StandardPagination