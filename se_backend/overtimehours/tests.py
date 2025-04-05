from django.test import TestCase
from users.models import CustomUser
from attendance_summary.models import AttendanceSummary
from .models import OvertimeHours
from datetime import date


class OvertimeHoursModelTestCase(TestCase):

    def setUp(self):
        # Creating test instances for CustomUser and AttendanceSummary
        self.user = CustomUser.objects.create_user(
            email="testuser@example.com", password="password", role="employee"
        )
        self.attendance_summary = AttendanceSummary.objects.create(
            user_id=self.user,
            date=date.today(),
            actual_hours=40,
            overtime_hours=5,
            late_minutes=15,
            undertime=0
        )

        # Creating an OvertimeHours instance
        self.overtime_hours = OvertimeHours.objects.create(
            attendancesummary=self.attendance_summary,
            user=self.user,
            regularot=2,
            regularholiday=1,
            specialholiday=0,
            restday=0,
            nightdiff=1,
            backwage=0,
            late=15,
            undertime=0,
            biweek_start=date.today()
        )

    def test_create_overtime_hours(self):
        self.assertEqual(OvertimeHours.objects.count(), 1)
        self.assertEqual(self.overtime_hours.regularot, 2)
        self.assertEqual(self.overtime_hours.nightdiff, 1)
        self.assertEqual(str(self.overtime_hours), f"{self.overtime_hours.id} - {self.user} - {self.overtime_hours.biweek_start}")

    def test_read_overtime_hours(self):
        overtime = OvertimeHours.objects.get(id=self.overtime_hours.id)
        self.assertEqual(overtime.regularholiday, 1)
        self.assertEqual(overtime.restday, 0)

    def test_update_overtime_hours(self):
        self.overtime_hours.regularot = 3
        self.overtime_hours.save()
        updated_overtime = OvertimeHours.objects.get(id=self.overtime_hours.id)
        self.assertEqual(updated_overtime.regularot, 3)

    def test_delete_overtime_hours(self):
        self.overtime_hours.delete()
        self.assertEqual(OvertimeHours.objects.count(), 0)
