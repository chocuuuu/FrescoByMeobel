from rest_framework import serializers
from .models import Schedule
from shift.models import Shift


class ShiftSerializer(serializers.ModelSerializer):
    """Serializer for Shift model to include full shift details inside Schedule."""

    class Meta:
        model = Shift
        fields = '__all__'  # Adjust fields as needed


class ScheduleSerializer(serializers.ModelSerializer):
    """Modified serializer to include shift details instead of just shift IDs."""
    shift_ids = ShiftSerializer(many=True, read_only=True)  # Nested serializer

    class Meta:
        model = Schedule
        fields = '__all__'
