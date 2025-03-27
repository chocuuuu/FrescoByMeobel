from celery import shared_task
from django.utils.timezone import now
from datetime import datetime, timedelta
import logging
from users.models import CustomUser
from salary.models import Salary
from earnings.models import Earnings
from deductions.models import Deductions
from totalovertime.models import TotalOvertime

# Configure logging
logger = logging.getLogger(__name__)


@shared_task
def generate_salary_entries():
    today = now().date()
    logger.info(f"Starting salary entry generation process on {today}")
    users = CustomUser.objects.filter(is_active=True)
    logger.info(f"Found {users.count()} active users.")

    for user in users:
        logger.info(f"Processing salary for user: {user.id} - {user.email}")

        latest_earnings = Earnings.objects.filter(user=user).order_by('-id').first()
        latest_deductions = Deductions.objects.filter(user=user).order_by('-id').first()

        if not latest_earnings:
            logger.warning(f"No earnings found for user: {user.id}")
        if not latest_deductions:
            logger.warning(f"No deductions found for user: {user.id}")

        overtime_entries = TotalOvertime.objects.filter(user=user).order_by('-biweek_start')[:2]
        logger.info(f"Found {overtime_entries.count()} overtime entries for user: {user.id}")

        for overtime in overtime_entries:
            biweek_start = overtime.biweek_start
            biweek_month = biweek_start.month
            biweek_year = biweek_start.year

            if biweek_start.day >= 28:
                pay_date = datetime(biweek_year, biweek_month + 1, 15).date()
            else:
                pay_date = datetime(biweek_year, biweek_month, 1) + timedelta(days=31)
                pay_date = pay_date.replace(day=1) - timedelta(days=1)

            logger.info(f"Determined pay date {pay_date} for user: {user.id}")

            if Salary.objects.filter(user_id=user.id, pay_date=pay_date).exists():
                logger.info(f"Salary entry already exists for user: {user.id} on {pay_date}. Skipping.")
                continue

            Salary.objects.create(
                user_id=user,
                earnings_id=latest_earnings,
                deductions_id=latest_deductions,
                overtime_id=overtime,
                pay_date=pay_date
            )
            logger.info(f"Salary entry created for user: {user.id} on {pay_date}")

    logger.info("Salary entry generation process completed.")
    return "Salary entries checked and generated."
