from django.db import models

from salary.models import Salary
from users.models import CustomUser


class Payroll(models.Model):
    id = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)
    salary_id = models.ForeignKey(Salary, on_delete=models.CASCADE, null=True)
    gross_pay = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_pay = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pay_date = models.DateField()

    def __str__(self):
        return f"{self.id} - {self.user_id}"
