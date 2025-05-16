from django.db.models.signals import post_save
from django.dispatch import receiver
from biometricdata.models import BiometricData
from attendance.models import Attendance
from employment_info.models import EmploymentInfo
from employees.models import Employee
from admins.models import Admin
from django.utils.timezone import localtime
from shift.models import Shift
from schedule.models import Schedule
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=BiometricData)
def update_attendance(sender, instance, **kwargs):
    emp_id = instance.emp_id  # Get emp_id from BiometricData
    record_date = localtime(instance.time).date()  # Convert timestamp to local date
    record_time = localtime(instance.time).time()  # Extract only the time

    try:
        # Step 1: Get EmploymentInfo using emp_id (employee_number)
        employment_info = EmploymentInfo.objects.get(employee_number=emp_id)

        # Step 2: Check if an Employee or Admin is linked to it
        employee = Employee.objects.filter(employment_info=employment_info).first()
        admin = Admin.objects.filter(employment_info=employment_info).first()

        if employee:
            user = employee.user  # Employee's user account
        elif admin:
            user = admin.user  # Admin's user account
        else:
            logger.warning(f"No associated user found for emp_id {emp_id}. Skipping attendance update.")
            return  # Stop execution if no user is found

        # Step 3: Get or create Attendance record for the user on the same date
        attendance, created = Attendance.objects.get_or_create(
            user=user,  # Link user via ForeignKey
            date=record_date,
            defaults={
                "check_in_time": record_time,
                "check_out_time": record_time,  # Default check-out = check-in initially
                "status": "Present",
            }
        )

        # Step 4: If the user scans again later, update check-out time
        if not created and record_time > attendance.check_out_time:
            attendance.check_out_time = record_time
            
            # Get the user's schedule and shift for this date
            try:
                # Find the most recent schedule for this user
                schedule = Schedule.objects.filter(user_id=user).order_by('-id').first()
                
                if schedule and schedule.shift_ids.exists():
                    # Find the shift for this specific date
                    shift = Shift.objects.filter(date=record_date, id__in=schedule.shift_ids.all()).first()
                    
                    if shift:
                        # Parse shift times
                        shift_start = shift.shift_start
                        shift_end = shift.shift_end
                        
                        # Calculate minutes for comparison
                        shift_start_minutes = shift_start.hour * 60 + shift_start.minute
                        shift_end_minutes = shift_end.hour * 60 + shift_end.minute
                        check_in_minutes = attendance.check_in_time.hour * 60 + attendance.check_in_time.minute
                        check_out_minutes = record_time.hour * 60 + record_time.minute
                        
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
            except Exception as e:
                logger.error(f"Error updating attendance status: {e}")
                # Keep the default status if there's an error
            
            attendance.save()

    except EmploymentInfo.DoesNotExist:
        logger.warning(f"EmploymentInfo not found for emp_id {emp_id}. Skipping update.")
