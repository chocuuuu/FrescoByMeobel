from celery import shared_task
from django.utils.timezone import now
from datetime import datetime, timedelta
from users.models import CustomUser
from salary.models import Salary
from earnings.models import Earnings
from deductions.models import Deductions
from totalovertime.models import TotalOvertime


@shared_task
def generate_salary_entries():
    today = now().date()
    users = CustomUser.objects.filter(is_active=True)

    for user in users:
        # Get latest earnings and deductions
        latest_earnings = Earnings.objects.filter(user=user).order_by('-id').first()
        latest_deductions = Deductions.objects.filter(user=user).order_by('-id').first()

        # Fetch last two TotalOvertime entries to ensure two salary entries per month
        overtime_entries = TotalOvertime.objects.filter(user=user).order_by('-biweek_start')[:2]

        for overtime in overtime_entries:
            biweek_start = overtime.biweek_start
            biweek_month = biweek_start.month
            biweek_year = biweek_start.year

            # Determine pay date based on biweek_start
            if biweek_start.day >= 28:  # End of the month -> 15th of next month
                pay_date = datetime(biweek_year, biweek_month + 1, 15).date()
            else:  # 15th of the month -> End of the same month
                pay_date = datetime(biweek_year, biweek_month, 1) + timedelta(days=31)
                pay_date = pay_date.replace(day=1) - timedelta(days=1)

            # Check if salary entry already exists for this user and pay date
            if Salary.objects.filter(user_id=user.id, pay_date=pay_date).exists():
                continue  # Skip if salary entry already exists

            # Create Salary entry
            Salary.objects.create(
                user_id=user,
                earnings_id=latest_earnings,
                deductions_id=latest_deductions,
                overtime_id=overtime,
                pay_date=pay_date
            )

    return f"Salary entries checked and generated."
