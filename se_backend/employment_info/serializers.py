from rest_framework import serializers
from employment_info.models import EmploymentInfo
from employees.models import Employee
from admins.models import Admin
from users.models import CustomUser


class EmploymentInfoSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES, write_only=True)

    class Meta:
        model = EmploymentInfo
        fields = '__all__'

    def create(self, validated_data):
        role = validated_data.pop("role")
        employment_info = EmploymentInfo.objects.create(**validated_data)

        # Create corresponding CustomUser
        email = f"{employment_info.first_name.lower()}.{employment_info.last_name.lower()}@company.com"
        user = CustomUser.objects.create_user(email=email, password="defaultpassword123", role=role)

        # Create Admin or Employee based on role
        if role == "admin":
            Admin.objects.create(user=user, employment_info=employment_info)
        elif role == "employee":
            Employee.objects.create(user=user, employment_info=employment_info)

        return employment_info

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)
        instance = super().update(instance, validated_data)

        # Update user role and corresponding model if role changes
        if role:
            user = CustomUser.objects.filter(email=f"{instance.first_name.lower()}.{instance.last_name.lower()}@company.com").first()

            if user and user.role != role:
                # Delete old role instance
                if user.role == "admin":
                    Admin.objects.filter(user=user).delete()
                elif user.role == "employee":
                    Employee.objects.filter(user=user).delete()

                # Update user role and create new role instance
                user.role = role
                user.save()

                if role == "admin":
                    Admin.objects.create(user=user, employment_info=instance)
                elif role == "employee":
                    Employee.objects.create(user=user, employment_info=instance)

        return instance


"""
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
"""