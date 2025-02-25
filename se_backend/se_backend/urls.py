from django.contrib import admin
from django.urls import include, path

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

]