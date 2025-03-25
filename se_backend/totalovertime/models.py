from django.db import models
from overtimehours.models import OvertimeHours
from users.models import CustomUser


class TotalOvertime(models.Model):
    id = models.AutoField(primary_key=True)
    overtimehours = models.ForeignKey(OvertimeHours, on_delete=models.CASCADE, null=True)
    total_regularot = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_regularholiday = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_specialholiday = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_restday = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_nightdiff = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_backwage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_overtime = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_late = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_undertime = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    biweek_start = models.DateField(null=True, blank=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)

    def __str__(self):
        return f"{self.id} - {self.overtimehours}"