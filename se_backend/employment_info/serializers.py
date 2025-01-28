from rest_framework import serializers
from employment_info.models import EmploymentInfo


class EmploymentInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmploymentInfo
        fields = '__all__'

    def validate_employee_number(self, value):
        # Check if employee number is greater than 0
        if value <= 0:
            raise serializers.ValidationError("Employee number must be a positive integer.")

        # Check if the employee number is unique
        if EmploymentInfo.objects.filter(employee_number=value).exists():
            raise serializers.ValidationError("Employee number must be unique.")

        return value

    def validate_first_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("First name cannot be empty.")
        return value

    def validate_last_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Last name cannot be empty.")
        return value

    def validate_position(self, value):
        if not value.strip():
            raise serializers.ValidationError("Position cannot be empty.")
        return value

    def validate_address(self, value):
        if not value.strip():
            raise serializers.ValidationError("Address cannot be empty.")
        return value

    def validate_hire_date(self, value):
        from datetime import date
        if value > date.today():
            raise serializers.ValidationError("Hire date cannot be in the future.")
        return value

    def validate_active(self, value):
        if not isinstance(value, bool):
            raise serializers.ValidationError("Active field must be a boolean value.")
        return value
