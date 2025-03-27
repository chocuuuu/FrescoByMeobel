from django.db import models
from users.models import CustomUser
from shift.models import Shift
from earnings.models import Earnings
from deductions.models import Deductions
from totalovertime.models import TotalOvertime

class Salary(models.Model):
    id = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)
    #shift_id = models.ForeignKey(Shift, on_delete=models.CASCADE, null=True)
    earnings_id = models.ForeignKey(Earnings, on_delete=models.CASCADE, null=True)
    deductions_id = models.ForeignKey(Deductions, on_delete=models.CASCADE, null=True)
    overtime_id = models.ForeignKey(TotalOvertime, on_delete=models.CASCADE, null=True)
    pay_date = models.DateField()

    def __str__(self):
        return f"{self.id} - {self.user_id}"