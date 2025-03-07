from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static


api_prefix = "api/v1/"

urlpatterns = [
    path("admin/", admin.site.urls),
    path(f"{api_prefix}auth/", include("shared.auth.urls")),
    path(f"{api_prefix}user/", include("users.urls")),
    path(f"{api_prefix}employment-info/", include("employment_info.urls")),
    path(f"{api_prefix}employees/", include("employees.urls")),
    path(f"{api_prefix}admins/", include("admins.urls")),
    path(f"{api_prefix}owner/", include("owner.urls")),
    path(f"{api_prefix}biometricdata/", include("biometricdata.urls")),
    path(f"{api_prefix}attendance/", include("attendance.urls")),
    path(f"{api_prefix}attendance_summary/", include("attendance_summary.urls")),
    path(f"{api_prefix}shift/", include("shift.urls")),
    path(f"{api_prefix}schedule/", include("schedule.urls")),

]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
