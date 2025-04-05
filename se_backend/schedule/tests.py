from django.test import TestCase
from users.models import CustomUser
from shift.models import Shift
from schedule.models import Schedule
from datetime import date

class ScheduleModelTestCase(TestCase):

    def setUp(self):
        # Create test CustomUser instance
        self.user = CustomUser.objects.create_user(
            email="employee@example.com", password="password", role="employee"
        )

        # Create Shift instance
        self.shift = Shift.objects.create(
            date=date(2025, 4, 5),
            shift_start="09:00:00",
            shift_end="17:00:00",
            expected_hours=8
        )

        # Create Schedule instance
        self.schedule = Schedule.objects.create(
            user_id=self.user,
            payroll_period=date(2025, 4, 1),
            hours=8,
            bi_weekly_start=date(2025, 4, 1),
        )
        self.schedule.shift_ids.add(self.shift)

    def test_create_schedule(self):
        self.assertEqual(Schedule.objects.count(), 1)
        self.assertEqual(self.schedule.user_id, self.user)
        self.assertEqual(self.schedule.hours, 8)
        self.assertTrue(self.schedule.shift_ids.exists())
        self.assertEqual(str(self.schedule), f"Schedule {self.schedule.id} for User {self.user.email}")

    def test_read_schedule(self):
        schedule = Schedule.objects.get(id=self.schedule.id)
        self.assertEqual(schedule.user_id, self.user)
        self.assertEqual(schedule.hours, 8)
        self.assertEqual(schedule.payroll_period, date(2025, 4, 1))

    def test_update_schedule(self):
        self.schedule.hours = 10
        self.schedule.save()
        updated_schedule = Schedule.objects.get(id=self.schedule.id)
        self.assertEqual(updated_schedule.hours, 10)

    def test_delete_schedule(self):
        self.schedule.delete()
        self.assertEqual(Schedule.objects.count(), 0)

    def test_add_shift_to_schedule(self):
        new_shift = Shift.objects.create(
            date=date(2025, 4, 6),
            shift_start="10:00:00",
            shift_end="18:00:00",
            expected_hours=8
        )
        self.schedule.shift_ids.add(new_shift)
        self.assertEqual(self.schedule.shift_ids.count(), 2)

    def test_schedule_with_holidays(self):
        self.schedule.sickleave = date(2025, 4, 7)
        self.schedule.regularholiday = [date(2025, 4, 8)]
        self.schedule.specialholiday = [date(2025, 4, 9)]
        self.schedule.nightdiff = [date(2025, 4, 10)]
        self.schedule.oncall = [date(2025, 4, 11)]
        self.schedule.vacationleave = [date(2025, 4, 12)]
        self.schedule.save()

        updated_schedule = Schedule.objects.get(id=self.schedule.id)
        self.assertEqual(updated_schedule.sickleave, date(2025, 4, 7))
        self.assertEqual(updated_schedule.regularholiday, [date(2025, 4, 8)])
        self.assertEqual(updated_schedule.specialholiday, [date(2025, 4, 9)])
        self.assertEqual(updated_schedule.nightdiff, [date(2025, 4, 10)])
        self.assertEqual(updated_schedule.oncall, [date(2025, 4, 11)])
        self.assertEqual(updated_schedule.vacationleave, [date(2025, 4, 12)])

