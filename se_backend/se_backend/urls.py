from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views


api_prefix = "api/v1/"

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth
    path(f"{api_prefix}auth/", include("shared.auth.urls")),
    path(f"{api_prefix}auth/password_reset/",
         auth_views.PasswordResetView.as_view(template_name="reset_password.html",),
         name="password_reset"),
    path(f"{api_prefix}auth/password_reset/done/", auth_views.PasswordResetDoneView.as_view(), name="password_reset_done"),
    path(f"{api_prefix}auth/reset/<uidb64>/<token>/", auth_views.PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path(f"{api_prefix}auth/reset/done/", auth_views.PasswordResetCompleteView.as_view(), name="password_reset_complete"),
    # Apps
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
    path(f"{api_prefix}overtimehours/", include("overtimehours.urls")),
    path(f"{api_prefix}totalovertime/", include("totalovertime.urls")),
    path(f"{api_prefix}earnings/", include("earnings.urls")),
    path(f"{api_prefix}deductions/", include("deductions.urls")),
    path(f"{api_prefix}salary/", include("salary.urls")),
    path(f"{api_prefix}payroll/", include("payroll.urls")),
    path(f"{api_prefix}payslip/", include("payslip.urls")),
    path(f"{api_prefix}benefits/", include("benefits.urls")),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
