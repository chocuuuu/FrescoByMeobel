from django.apps import AppConfig


class MastercalendarConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "mastercalendar"

    def ready(self):
        import mastercalendar.signals
