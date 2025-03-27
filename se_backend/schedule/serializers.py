from rest_framework import serializers
from .models import Schedule
from shift.models import Shift


class ShiftSerializer(serializers.ModelSerializer):
    """Serializer for Shift model to include full shift details inside Schedule."""

    class Meta:
        model = Shift
        fields = '__all__'  # Adjust fields as needed


class ScheduleSerializer(serializers.ModelSerializer):
    shift_ids = serializers.PrimaryKeyRelatedField(
        queryset=Shift.objects.all(), many=True
    )

    class Meta:
        model = Schedule
        fields = '__all__'

    def create(self, validated_data):
        shift_ids = validated_data.pop('shift_ids', [])  # Extract shift IDs
        schedule = Schedule.objects.create(**validated_data)  # Create schedule
        schedule.shift_ids.set(shift_ids)  # Explicitly assign shifts
        return schedule
