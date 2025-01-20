from django.contrib import admin
from django.urls import include, path

api_prefix = "api/v1/"

urlpatterns = [
    path("admin/", admin.site.urls),
    path(f"{api_prefix}auth/", include("shared.auth.urls")),
    path(f"{api_prefix}user/", include("users.urls")),
]