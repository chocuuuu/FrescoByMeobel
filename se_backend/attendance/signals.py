import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.timezone import now
from datetime import timedelta
from .models import Attendance
from attendance_summary.models import AttendanceSummary
from shift.models import Shift
from schedule.models import Schedule

logger = logging.getLogger(__name__)


def calculate_minutes(check_in, check_out):
    """Calculate total worked minutes, deducting a one-hour break if applicable."""
    if not check_in or not check_out:
        return 0

    total_minutes = (check_out.hour * 60 + check_out.minute) - (check_in.hour * 60 + check_in.minute)
    worked_minutes = max(0, total_minutes - 60)

    logger.debug(f"[calculate_minutes] Check-in: {check_in}, Check-out: {check_out}, Worked: {worked_minutes}")
    return worked_minutes


def get_shift_details(user, date):
    """Retrieve shift details for the given user and date."""
    biweekly_start = get_biweekly_period(date)

    logger.debug(f"[get_shift_details] Searching for Schedule with User ID: {user}, Biweekly Start: {biweekly_start}")

    schedules = Schedule.objects.filter(user_id=user).values('id', 'bi_weekly_start')
    logger.debug(f"[get_shift_details] Available schedules for User {user}: {list(schedules)}")


    schedule = Schedule.objects.filter(
        user_id=user,
        bi_weekly_start=biweekly_start
    ).order_by('-id').first()

    if not schedule:
        logger.warning(f"[get_shift_details] No schedule for User: {user}, Date: {date}, Biweekly Start: {biweekly_start}")
        return None

    shift = Shift.objects.filter(date=date, id__in=schedule.shift_ids.all()).first()

    if not shift:
        logger.warning(f"[get_shift_details] No shift found for User: {user}, Date: {date}, Biweekly Start: {biweekly_start}")

    return shift



def get_biweekly_period(date):
    """Determine the biweekly period start date."""
    first_day = date.replace(day=1)
    if date.day < 16:
        return first_day
    else:
        return first_day + timedelta(days=15)



@receiver(post_save, sender=Attendance)
def generate_attendance_summary(sender, instance, **kwargs):
    """Update Attendance Summary based on daily attendance."""
    user = instance.user
    date = instance.date
    check_in = instance.check_in_time
    check_out = instance.check_out_time

    logger.debug(f"[generate_attendance_summary] Processing attendance for User: {user}, Date: {date}")

    if not check_in or not check_out or check_in == check_out:
        logger.warning(f"[generate_attendance_summary] Skipping invalid attendance for User: {user}, Date: {date}")
        return

    biweekly_start = get_biweekly_period(date)
    shift = get_shift_details(user, date)

    if not shift:
        logger.warning(f"[generate_attendance_summary] No shift for User: {user}, Date: {date}. Skipping.")
        return

    actual_minutes = calculate_minutes(check_in, check_out)
    expected_minutes = shift.expected_hours * 60  # Do not subtract 1 hour break

    shift_start_minutes = shift.shift_start.hour * 60 + shift.shift_start.minute
    check_in_minutes = check_in.hour * 60 + check_in.minute
    late_minutes = max(0, check_in_minutes - shift_start_minutes)

    overtime_minutes = max(0, actual_minutes - expected_minutes)
    undertime_minutes = max(0, expected_minutes - actual_minutes)

    biweekly_attendance = Attendance.objects.filter(
        user=user,
        date__gte=biweekly_start,
        date__lt=biweekly_start + timedelta(days=15)
    )

    total_actual_minutes = sum(calculate_minutes(att.check_in_time, att.check_out_time) for att in biweekly_attendance)
    total_overtime_minutes = sum(
        max(0, calculate_minutes(att.check_in_time, att.check_out_time) - (
            get_shift_details(user, att.date).expected_hours * 60 if get_shift_details(user, att.date) else 480))
        for att in biweekly_attendance
    )
    total_late_minutes = sum(
        max(0, (att.check_in_time.hour * 60 + att.check_in_time.minute) -
            ((get_shift_details(user, att.date).shift_start.hour * 60 + get_shift_details(user,
                                                                                          att.date).shift_start.minute)
             if get_shift_details(user, att.date) else 0))
        for att in biweekly_attendance
    )
    total_undertime_minutes = sum(
        max(0, (get_shift_details(user, att.date).expected_hours * 60 if get_shift_details(user, att.date) else 480) -
            calculate_minutes(att.check_in_time, att.check_out_time))
        for att in biweekly_attendance
    )

    logger.debug(f"[generate_attendance_summary] Biweekly Totals for User: {user}, Start: {biweekly_start}, "
                 f"Total Actual: {total_actual_minutes}, Total Overtime: {total_overtime_minutes}, "
                 f"Total Late: {total_late_minutes}, Total Undertime: {total_undertime_minutes}")

    summary, _ = AttendanceSummary.objects.update_or_create(
        user_id=user,
        date=biweekly_start,
        defaults={
            'actual_hours': total_actual_minutes // 60,
            'overtime_hours': total_overtime_minutes // 60,
            'late_minutes': total_late_minutes,
            'undertime': total_undertime_minutes,
            'attendance_id': instance
        }
    )

    logger.info(f"[generate_attendance_summary] AttendanceSummary UPDATED for User: {user}, Start: {biweekly_start}")
