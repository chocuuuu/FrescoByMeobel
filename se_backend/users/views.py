from rest_framework.permissions import IsAdminUser, IsAuthenticated

from shared.generic_viewset import GenericViewset

from .models import CustomUser
from .serializers import CustomUserSerializer


# Create your views here.
class UserViewset(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer