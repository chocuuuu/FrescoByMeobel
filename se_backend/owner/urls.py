from django.urls import include, path
from rest_framework.routers import DefaultRouter

from owner.views import OwnerViewset

app_name = "owner"

router = DefaultRouter()
router.register(r"", OwnerViewset, basename="owner")

urlpatterns = [path("", include(router.urls))]