from django.db import models


class MasterCalendar(models.Model):
    HOLIDAY_TYPES = [
        ('regular', 'Regular Holiday'),
        ('special', 'Special Holiday'),
    ]

    name = models.CharField(max_length=100)
    date = models.DateField()
    holiday_type = models.CharField(max_length=10, choices=HOLIDAY_TYPES)
    description = models.TextField(blank=True, null=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_holiday_type_display()}) - {self.date}"

    class Meta:
        ordering = ['date']
        unique_together = ['date', 'holiday_type']