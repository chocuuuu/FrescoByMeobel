from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MasterCalendarViewSet

app_name = "mastercalendar"

router = DefaultRouter()
router.register(r"", MasterCalendarViewSet, basename="mastercalendar")

urlpatterns = [path("", include(router.urls))]