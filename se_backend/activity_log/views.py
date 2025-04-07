from django_filters import rest_framework as filters
from easyaudit.models import ContentType, CRUDEvent, LoginEvent
from rest_framework import permissions, viewsets

from .filters import CRUDEventFilter
from .serializers import CRUDEventSerializer, LoginEventSerializer

from shared.utils import role_required


class CRUDEventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CRUDEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = CRUDEventFilter

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or user.role not in ["admin", "owner"]:
            return CRUDEvent.objects.none()  # Or raise PermissionDenied
        included_models = {
            "admin",
            "attendance",
            "attendancesummary",
            "employee",
            "employmentinfo",
            "totalovertime",
            "payslip",
            "schedule",
            "shift",
            "customuser",
            "owner",
        }
        content_types = ContentType.objects.filter(model__in=included_models)
        return CRUDEvent.objects.filter(content_type__in=content_types).order_by("-datetime")

class LoginEventViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = LoginEvent.objects.all()
    serializer_class = LoginEventSerializer
    permission_classes = [permissions.IsAuthenticated]