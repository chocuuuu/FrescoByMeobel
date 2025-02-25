from django.db import models

from biometricdata.models import BiometricData


class Attendance(models.Model):
    id = models.AutoField(primary_key=True)
    biometric_data_id = models.ForeignKey(BiometricData, on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=255)
    check_in_time = models.TimeField()
    check_out_time = models.TimeField()

    def __str__(self):
        return f"{self.id} - {self.biometric_data_id}"