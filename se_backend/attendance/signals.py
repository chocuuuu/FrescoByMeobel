import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.timezone import now
from datetime import timedelta, date, datetime, time
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


def get_biweekly_period(date, user):
    """Determine the biweekly period using payroll_period_start and payroll_period_end from the schedule."""
    schedule = Schedule.objects.filter(user_id=user).order_by('-id').first()

    if not schedule or not schedule.payroll_period_start or not schedule.payroll_period_end:
        logger.warning(f"[get_biweekly_period] No schedule or payroll period for User: {user}")
        return None

    start_date = schedule.payroll_period_start
    end_date = schedule.payroll_period_end

    # Check if the provided date falls within this range
    if start_date <= date <= end_date:
        return start_date

    # If the date doesn't fall within the range, return the closest start date.
    return start_date if date < start_date else end_date


def get_shift_details(user, date):
    """Retrieve shift details for the given user and date."""
    biweekly_start = get_biweekly_period(date, user)

    logger.debug(f"[get_shift_details] Searching for Schedule with User ID: {user}, Biweekly Start: {biweekly_start}")

    schedule = Schedule.objects.filter(
        user_id=user,
        bi_weekly_start=biweekly_start
    ).order_by('-id').first()

    if not schedule:
        logger.warning(
            f"[get_shift_details] No schedule for User: {user}, Date: {date}, Biweekly Start: {biweekly_start}")
        return None

    shift = Shift.objects.filter(date=date, id__in=schedule.shift_ids.all()).first()

    if not shift:
        logger.warning(
            f"[get_shift_details] No shift found for User: {user}, Date: {date}, Biweekly Start: {biweekly_start}")

    return shift


def update_attendance_status(attendance):
    """Update attendance status based on shift times and actual check-in/out times."""
    user = attendance.user
    record_date = attendance.date
    check_in = attendance.check_in_time
    check_out = attendance.check_out_time
    
    if not check_in or not check_out:
        return
    
    try:
        shift = get_shift_details(user, record_date)
        
        if shift:
            # Parse shift times
            shift_start = shift.shift_start
            shift_end = shift.shift_end
            
            # Calculate minutes for comparison
            shift_start_minutes = shift_start.hour * 60 + shift_start.minute
            shift_end_minutes = shift_end.hour * 60 + shift_end.minute
            check_in_minutes = check_in.hour * 60 + check_in.minute
            check_out_minutes = check_out.hour * 60 + check_out.minute
            
            # Calculate expected shift duration
            expected_minutes = shift_end_minutes - shift_start_minutes
            
            # Calculate actual worked duration
            actual_minutes = check_out_minutes - check_in_minutes
            
            # Calculate late minutes
            late_minutes = max(0, check_in_minutes - shift_start_minutes)
            
            # Calculate early departure minutes
            early_departure = max(0, shift_end_minutes - check_out_minutes)
            
            # Calculate overtime minutes
            overtime_minutes = max(0, check_out_minutes - shift_end_minutes)
            
            # Determine status based on conditions
            # Priority: Late > Undertime > Overtime > Present
            
            if late_minutes >= 15:  # If more than 15 minutes late
                attendance.status = "Late"
                logger.info(f"User {user} marked as Late on {record_date}: {late_minutes} minutes late")
            elif early_departure >= 30:  # If left 30+ minutes early
                attendance.status = "Undertime"
                logger.info(f"User {user} marked as Undertime on {record_date}: left {early_departure} minutes early")
            elif overtime_minutes >= 30:  # If stayed 30+ minutes extra
                attendance.status = "Overtime"
                logger.info(f"User {user} marked as Overtime on {record_date}: {overtime_minutes} minutes overtime")
            else:
                attendance.status = "Present"
                logger.info(f"User {user} marked as Present on {record_date}")
            
            attendance.save()
            logger.info(f"Updated attendance status for {user} on {record_date}: {attendance.status}")
    except Exception as e:
        logger.error(f"Error updating attendance status: {e}")


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

    # Update the attendance status based on shift times
    update_attendance_status(instance)

    biweekly_start = get_biweekly_period(date, user)
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
            'undertime': total_undertime_minutes // 60,
            'attendance_id': instance
        }
    )

    logger.info(f"[generate_attendance_summary] AttendanceSummary UPDATED for User: {user}, Start: {biweekly_start}")
