from rest_framework.permissions import IsAdminUser, IsAuthenticated
from shared.generic_viewset import GenericViewset
from .models import AttendanceSummary
from .serializers import AttendanceSummarySerializer

class AttendanceSummaryViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = AttendanceSummary.objects.all()
    serializer_class = AttendanceSummarySerializer