from rest_framework.permissions import IsAdminUser, IsAuthenticated
from shared.generic_viewset import GenericViewset
from .models import SSS, Pagibig, Philhealth
from .serializers import SSSSerializer, PhilhealthSerializer, PagibigSerializer

class SSSViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = SSS.objects.all()
    serializer_class = SSSSerializer

class PhilhealthViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = Philhealth.objects.all()
    serializer_class = PhilhealthSerializer

class PagibigViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = Pagibig.objects.all()
    serializer_class = PagibigSerializer