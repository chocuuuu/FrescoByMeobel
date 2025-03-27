from rest_framework import serializers
from .models import Schedule
from shift.models import Shift


class ShiftSerializer(serializers.ModelSerializer):
    """Serializer for Shift model to include full shift details inside Schedule."""

    class Meta:
        model = Shift
        fields = '__all__'  # Adjust fields as needed


class ScheduleSerializer(serializers.ModelSerializer):
    """Allow writing shift_ids as IDs and reading shift details."""

    shift_ids = serializers.PrimaryKeyRelatedField(
        queryset=Shift.objects.all(), many=True, write_only=True
    )
    shifts = ShiftSerializer(many=True, read_only=True, source="shift_ids")  # Read as nested

    class Meta:
        model = Schedule
        fields = '__all__'
