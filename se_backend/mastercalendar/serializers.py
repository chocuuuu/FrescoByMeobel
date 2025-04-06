from rest_framework import serializers
from .models import MasterCalendar

class MasterCalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = MasterCalendar
        fields = '__all__'