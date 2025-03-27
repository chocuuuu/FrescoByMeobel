from rest_framework.permissions import IsAdminUser, IsAuthenticated
from shared.generic_viewset import GenericViewset
from .models import Earnings
from .serializers import EarningsSerializer

class EarningsViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = Earnings.objects.all()
    serializer_class = EarningsSerializer