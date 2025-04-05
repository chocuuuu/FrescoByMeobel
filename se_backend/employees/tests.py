from django.test import TestCase
from users.models import CustomUser
from employment_info.models import EmploymentInfo
from employee.models import Employee


class EmployeeModelTestCase(TestCase):

    def setUp(self):
        # Creating a test user
        self.user = CustomUser.objects.create_user(
            email="employee1@example.com",
            password="testpass123",
            role="employee"
        )

        # Creating a test employment info
        self.employment_info = EmploymentInfo.objects.create(
            employee_number=12345,
            first_name="John",
            last_name="Doe",
            position="Developer",
            address="123 Street",
            hire_date="2021-01-01",
            active=True
        )

        # Creating an employee linked with the user and employment info
        self.employee = Employee.objects.create(
            user=self.user,
            employment_info=self.employment_info
        )

    def test_create_employee(self):
        self.assertEqual(Employee.objects.count(), 1)
        self.assertEqual(self.employee.user.email, "employee1@example.com")
        self.assertEqual(self.employee.employment_info.position, "Developer")
        self.assertEqual(str(self.employee), f"Employee: {self.user.email} ({self.user.role})")

    def test_read_employee(self):
        employee = Employee.objects.get(id=self.employee.id)
        self.assertEqual(employee.user.email, "employee1@example.com")
        self.assertEqual(employee.employment_info.first_name, "John")

    def test_update_employee(self):
        self.employee.user.email = "new_email@example.com"
        self.employee.save()
        updated_employee = Employee.objects.get(id=self.employee.id)
        self.assertEqual(updated_employee.user.email, "new_email@example.com")

    def test_delete_employee(self):
        self.employee.delete()
        self.assertEqual(Employee.objects.count(), 0)
