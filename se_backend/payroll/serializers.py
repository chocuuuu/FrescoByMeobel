from rest_framework import serializers
from payroll.models import Payroll
from salary.models import Salary
from earnings.models import Earnings
from deductions.models import Deductions
from totalovertime.models import TotalOvertime
from benefits.models import SSS, Philhealth, Pagibig

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

class SSSSerializer(serializers.ModelSerializer):
    class Meta:
        model = SSS
        fields = '__all__'

class PhilhealthSerializer(serializers.ModelSerializer):
    class Meta:
        model = Philhealth
        fields = '__all__'

class PagibigSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pagibig
        fields = '__all__'

class SalarySerializer(serializers.ModelSerializer):
    earnings_id = EarningsSerializer()
    deductions_id = DeductionsSerializer()
    overtime_id = TotalOvertimeSerializer()
    sss_id = SSSSerializer()
    philhealth_id = PhilhealthSerializer()
    pagibig_id = PagibigSerializer()

    class Meta:
        model = Salary
        fields = '__all__'

class PayrollSerializer(serializers.ModelSerializer):
    salary_id = SalarySerializer()

    class Meta:
        model = Payroll
        fields = '__all__'
