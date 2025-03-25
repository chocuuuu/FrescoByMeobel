from rest_framework import serializers
from payroll.models import Payroll
from salary.models import Salary
from earnings.models import Earnings
from deductions.models import Deductions
from totalovertime.models import TotalOvertime

class EarningsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Earnings
        fields = '__all__'

class DeductionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deductions
        fields = '__all__'

class TotalOvertimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TotalOvertime
        fields = '__all__'

class SalarySerializer(serializers.ModelSerializer):
    earnings = EarningsSerializer()
    deductions = DeductionsSerializer()
    overtime = TotalOvertimeSerializer()

    class Meta:
        model = Salary
        fields = '__all__'

class PayrollSerializer(serializers.ModelSerializer):
    salary_id = SalarySerializer()

    class Meta:
        model = Payroll
        fields = '__all__'
