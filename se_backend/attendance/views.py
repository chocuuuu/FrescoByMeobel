from rest_framework.permissions import IsAdminUser, IsAuthenticated
from shared.generic_viewset import GenericViewset
from .models import Attendance
from .serializers import AttendanceSerializer

class AttendanceViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer