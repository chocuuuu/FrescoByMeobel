from rest_framework.permissions import IsAdminUser, IsAuthenticated
from shared.generic_viewset import GenericViewset
from .models import Payroll
from .serializers import PayrollSerializer
from shared.pagination import StandardPagination

class PayrollViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = Payroll.objects.all()
    serializer_class = PayrollSerializer
    pagination_class = StandardPagination
