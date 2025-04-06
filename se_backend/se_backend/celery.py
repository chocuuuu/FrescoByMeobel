from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from django.conf import settings
from celery.schedules import crontab


# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'se_backend.settings')

app = Celery('se_backend')

# Configure Celery using settings from Django settings.py.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load tasks from all registered Django app configs.
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)

app.conf.broker_connection_retry_on_startup = True

app.conf.beat_schedule = {
    "generate_salary_entries": {
        "task": "salary.tasks.generate_salary_entries",
        "schedule": crontab(minute=0, hour="*"),
    },
    "generate_payroll_entries": {
        "task": "payroll.tasks.generate_payroll_entries",
        "schedule": crontab(minute=0, hour="*"),
    },
    "generate_payslip_entries": {
        "task": "payslip.tasks.generate_payslip_entries",
        "schedule": crontab(minute=0, hour="*"),
    },
    "calculate_total_payroll": {
        "task": "totalpayroll.tasks.calculate_total_payroll",
        "schedule": crontab(minute=30, hour=12), # run every 12:30 pm
    },
    "sync-holidays-daily": {
        'task': 'mastercalendar.tasks.sync_holidays_for_new_calendar_entries',
        #'schedule': crontab(hour=0, minute=0),
        # "schedule": crontab(minute="*"),
        "schedule": crontab(minute="*/5"), # every 5 mins
    },
    "full-holiday-sync-weekly": {
        'task': 'mastercalendar.tasks.update_schedule_holidays',
        #'schedule': crontab(day_of_week=0, hour=1, minute=0),
        # "schedule": crontab(minute="*"),
        "schedule": crontab(minute="*/5"),  # every 5 mins
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