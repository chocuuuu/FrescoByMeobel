from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from attendance.models import Attendance
from attendance_summary.models import AttendanceSummary
from shift.models import Shift
from schedule.models import Schedule

User = get_user_model()


class AttendanceSummarySignalTest(TestCase):
    def setUp(self):
        # Create test users with email as primary identifier
        self.user1 = User.objects.create_user(email="employee1@example.com", password="testpass123")
        self.user2 = User.objects.create_user(email="employee2@example.com", password="testpass123")

        # Create shifts
        self.shift1 = Shift.objects.create(
            date=timezone.now().date(),
            shift_start=timezone.now().time(),
            shift_end=timezone.now().time(),
            expected_hours=8
        )

        # Create schedules for the users
        self.schedule1 = Schedule.objects.create(
            user_id=self.user1,
            payroll_period=timezone.now().date(),
            hours=40,
            bi_weekly_start=timezone.now().date(),
            days=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]  # Explicitly setting days
        )
        self.schedule1.shift_ids.add(self.shift1)

        self.schedule2 = Schedule.objects.create(
            user_id=self.user2,
            payroll_period=timezone.now().date(),
            hours=40,
            bi_weekly_start=timezone.now().date(),
            days=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]  # Explicitly setting days
        )
        self.schedule2.shift_ids.add(self.shift1)

    def test_15_days_attendance(self):
        """Test that AttendanceSummary is generated after 15 days."""
        for i in range(15):
            Attendance.objects.create(
                user=self.user1,
                date=timezone.now().date(),
                status="Present",
                check_in_time=timezone.now().time(),
                check_out_time=timezone.now().time()
            )
        self.assertTrue(AttendanceSummary.objects.filter(user_id=self.user1).exists())

    def test_attendance_multiple_users(self):
        """Test that multiple users' attendance generates separate summaries."""
        Attendance.objects.create(user=self.user1, date=timezone.now().date(), status="Present",
                                  check_in_time=timezone.now().time(), check_out_time=timezone.now().time())
        Attendance.objects.create(user=self.user2, date=timezone.now().date(), status="Present",
                                  check_in_time=timezone.now().time(), check_out_time=timezone.now().time())

        summaries = AttendanceSummary.objects.all()
        self.assertEqual(summaries.count(), 2)

    def test_late_check_in(self):
        """Test that late check-ins update late_minutes field."""
        att = Attendance.objects.create(user=self.user1, date=timezone.now().date(), status="Late",
                                        check_in_time=(timezone.now() + timezone.timedelta(minutes=30)).time(),
                                        check_out_time=timezone.now().time())
        summary = AttendanceSummary.objects.filter(user_id=self.user1).first()
        self.assertGreater(summary.late_minutes, 0)

    def test_early_check_out(self):
        """Test that early check-outs update undertime field."""
        att = Attendance.objects.create(user=self.user1, date=timezone.now().date(), status="Present",
                                        check_in_time=timezone.now().time(),
                                        check_out_time=(timezone.now() - timezone.timedelta(minutes=30)).time())
        summary = AttendanceSummary.objects.filter(user_id=self.user1).first()
        self.assertGreater(summary.undertime, 0)

    def test_overtime(self):
        """Test that overtime hours are correctly calculated."""
        att = Attendance.objects.create(user=self.user1, date=timezone.now().date(), status="Present",
                                        check_in_time=timezone.now().time(),
                                        check_out_time=(timezone.now() + timezone.timedelta(hours=2)).time())
        summary = AttendanceSummary.objects.filter(user_id=self.user1).first()
        self.assertGreater(summary.overtime_hours, 0)

    def test_no_attendance_summary_if_no_shift(self):
        """Test that AttendanceSummary is not generated if there is no shift."""
        user_no_shift = User.objects.create_user(email="noschedule@example.com", password="testpass123")
        Attendance.objects.create(user=user_no_shift, date=timezone.now().date(), status="Present",
                                  check_in_time=timezone.now().time(), check_out_time=timezone.now().time())
        self.assertFalse(AttendanceSummary.objects.filter(user_id=user_no_shift).exists())

    def test_new_summary_after_15_days(self):
        """Test that a new AttendanceSummary is generated for the next 15-day period."""
        for i in range(30):
            Attendance.objects.create(
                user=self.user1,
                date=timezone.now().date() - timezone.timedelta(days=i),
                status="Present",
                check_in_time=timezone.now().time(),
                check_out_time=timezone.now().time()
            )
        self.assertEqual(AttendanceSummary.objects.filter(user_id=self.user1).count(), 2)
