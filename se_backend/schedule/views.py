from rest_framework.permissions import IsAdminUser, IsAuthenticated
from shared.generic_viewset import GenericViewset
from .models import Schedule
from .serializers import ScheduleSerializer

class ScheduleViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer