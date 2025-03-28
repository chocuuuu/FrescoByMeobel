from rest_framework.permissions import IsAdminUser, IsAuthenticated
from shared.generic_viewset import GenericViewset
from .models import Payslip
from .serializers import PayslipSerializer
from shared.pagination import StandardPagination

class PayslipViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = Payslip.objects.all()
    serializer_class = PayslipSerializer
    pagination_class = StandardPagination
