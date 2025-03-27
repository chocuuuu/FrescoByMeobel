from rest_framework import serializers
from .models import OvertimeHours

class OvertimeHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = OvertimeHours
        fields = '__all__'