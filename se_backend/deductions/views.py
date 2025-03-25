from rest_framework.permissions import IsAdminUser, IsAuthenticated
from shared.generic_viewset import GenericViewset
from .models import Deductions
from .serializers import DeductionsSerializer

class DeductionsViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = Deductions.objects.all()
    serializer_class = DeductionsSerializer