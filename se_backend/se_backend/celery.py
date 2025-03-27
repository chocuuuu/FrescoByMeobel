from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'se_backend.settings')

app = Celery('se_backend')

# Configure Celery using settings from Django settings.py.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load tasks from all registered Django app configs.
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)

app.conf.broker_connection_retry_on_startup = True

app.conf.beat_schedule = {
    "update_total_overtime_for_user": {
        "task": "overtimehours.tasks.update_total_overtime_for_user",
        "schedule": 60.0,
    },
    "generate_salary_entries": {
        "task": "salary.tasks.generate_salary_entries",
        "schedule": 60.0,  # Run every 60 seconds
    },
    "generate_payroll_entries": {
        "task": "payroll.tasks.generate_payroll_entries",
        "schedule": 60.0,  # Run every 60 seconds
    },
    "generate_payslip_entries": {
        "task": "payslip.tasks.generate_payslip_entries",
        "schedule": 60.0,  # Run every 60 seconds
    },

}

"""
app.conf.beat_schedule = {
    "generate_attendance_summary_task": {
        "task": "attendance.tasks.generate_attendance_summary_task",
        "schedule": 60.0,
    }

}
"""
"""
app.conf.beat_schedule = {
    "fetch_biometricdata": {
        "task": "biometricdata.tasks.fetch_biometricdata_entries",
        "schedule": 60.0,  # Run every 60 seconds
    },
}
"""