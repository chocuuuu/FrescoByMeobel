from django.test import TestCase
from users.models import CustomUser
from attendance_summary.models import AttendanceSummary
from .models import OvertimeHours
from datetime import date, time
from attendance.models import Attendance
from django.db.models.signals import post_save
from attendance_summary import signals as summary_signals


class OvertimeHoursModelTestCase(TestCase):

    def setUp(self):
        # Disconnect signal with dispatch_uid
        post_save.disconnect(
            receiver=summary_signals.update_overtime_hours,
            sender=AttendanceSummary,
            dispatch_uid="update_overtime_hours"
        )
        # Create test user
        self.user = CustomUser.objects.create_user(
            email="testuser@example.com", password="password", role="employee"
        )

        # Create test attendance
        self.attendance = Attendance.objects.create(
            user=self.user,
            date=date.today(),
            status="Present",
            check_in_time=time(9, 0),
            check_out_time=time(17, 0)
        )

        # Create test attendance summary
        self.attendance_summary = AttendanceSummary.objects.create(
            user_id=self.user,
            date=date.today(),
            actual_hours=40,
            overtime_hours=5,
            late_minutes=15,
            undertime=0,
            attendance_id=self.attendance
        )

        # Manually create OvertimeHours
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

    def tearDown(self):
        # Reconnect signal with dispatch_uid
        post_save.connect(
            receiver=summary_signals.update_overtime_hours,
            sender=AttendanceSummary,
            dispatch_uid="update_overtime_hours"
        )

    def test_create_overtime_hours(self):
        self.assertEqual(OvertimeHours.objects.count(), 1)
        self.assertEqual(self.overtime_hours.regularot, 2)
        self.assertEqual(self.overtime_hours.nightdiff, 1)
        self.assertEqual(
            str(self.overtime_hours),
            f"{self.overtime_hours.id} - {self.user} - {self.overtime_hours.biweek_start}"
        )

    def test_read_overtime_hours(self):
        overtime = OvertimeHours.objects.get(id=self.overtime_hours.id)
        self.assertEqual(overtime.regularholiday, 1)
        self.assertEqual(overtime.restday, 0)

    def test_update_overtime_hours(self):
        self.overtime_hours.regularot = 3
        self.overtime_hours.save()
        updated = OvertimeHours.objects.get(id=self.overtime_hours.id)
        self.assertEqual(updated.regularot, 3)

    def test_delete_overtime_hours(self):
        self.overtime_hours.delete()
        self.assertEqual(OvertimeHours.objects.count(), 0)
