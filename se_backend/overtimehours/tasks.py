import logging
from decimal import Decimal
from celery import shared_task
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import OvertimeHours
from totalovertime.models import TotalOvertime
from earnings.models import Earnings
from overtimebase.models import OvertimeBase
from deductions.models import Deductions
from users.models import CustomUser

logger = logging.getLogger(__name__)

def to_decimal(value):
    return Decimal(str(value)) if value else Decimal("0")

def calculate_regularot(basic_rate, regularot):
    return (to_decimal(basic_rate) / Decimal("26") / Decimal("8") * Decimal("1.25")) * to_decimal(regularot)

def calculate_regularholiday(basic_rate, regularholiday):
    return (to_decimal(basic_rate) / Decimal("26") / Decimal("8") * Decimal("2.6")) * to_decimal(regularholiday)

def calculate_specialholiday(basic_rate, specialholiday):
    return (to_decimal(basic_rate) / Decimal("26") / Decimal("8") * Decimal("1.3")) * to_decimal(specialholiday)

def calculate_restday(basic_rate, restday):
    return (to_decimal(basic_rate) / Decimal("26") / Decimal("8") * Decimal("1.69")) * to_decimal(restday)

def calculate_nightdiff(basic_rate, nightdiff):
    return (to_decimal(basic_rate) / Decimal("26") / Decimal("8") * Decimal("2.20")) * to_decimal(nightdiff)

def calculate_backwage(backwage_base, backwage):
    return to_decimal(backwage_base) * to_decimal(backwage)

def calculate_late(late_base, late):
    return to_decimal(late_base) / Decimal("26") / Decimal("8") / Decimal("60") * to_decimal(late)

def calculate_undertime(basic_rate, undertime):
    return to_decimal(basic_rate) / Decimal("26") / Decimal("8") * to_decimal(undertime)


@shared_task
def update_total_overtime_for_user(user_id=None):
    if user_id:
        user_ids = [user_id]  # Process only this user
    else:
        user_ids = list(CustomUser.objects.filter(is_active=True).values_list("id", flat=True))

    if not user_ids:
        logger.warning("No active users found")
        return

    overtime_hours = OvertimeHours.objects.filter(attendancesummary__user_id__in=user_ids)

    for overtime in overtime_hours:
        user_id = overtime.attendancesummary.user_id  # Get a single user ID
        earnings = Earnings.objects.filter(user_id=user_id).first()
        overtime_base = OvertimeBase.objects.filter(user_id=user_id).first()
        deductions = Deductions.objects.filter(user_id=user_id).first()

        if not earnings or not overtime_base or not deductions:
            logger.warning(f"Missing data for User ID {user_id}")
            continue

        basic_rate = earnings.basic_rate
        backwage_base = overtime_base.backwage_base
        late_base = to_decimal(deductions.late) if deductions else Decimal("0")

        total_regularot = calculate_regularot(basic_rate, overtime.regularot)
        total_regularholiday = calculate_regularholiday(basic_rate, overtime.regularholiday)
        total_specialholiday = calculate_specialholiday(basic_rate, overtime.specialholiday)
        total_restday = calculate_restday(basic_rate, overtime.restday)
        total_nightdiff = calculate_nightdiff(basic_rate, overtime.nightdiff)
        total_backwage = calculate_backwage(backwage_base, overtime.backwage)
        total_late = calculate_late(late_base, overtime.late)
        total_undertime = calculate_undertime(basic_rate, overtime.undertime)
        biweek_start = overtime.biweek_start

        total_overtime = (
                total_regularot + total_regularholiday + total_specialholiday +
                total_restday + total_nightdiff + total_backwage
        )

        TotalOvertime.objects.update_or_create(
            overtimehours=overtime,
            defaults={
                "total_regularot": total_regularot,
                "total_regularholiday": total_regularholiday,
                "total_specialholiday": total_specialholiday,
                "total_restday": total_restday,
                "total_nightdiff": total_nightdiff,
                "total_backwage": total_backwage,
                "total_late": total_late,
                "total_undertime": total_undertime,
                "total_overtime": total_overtime,
                "biweek_start": biweek_start,
                "user_id": user_id
            },
        )
        logger.info(f"Updated TotalOvertime for User ID {user_id} (OvertimeHours ID {overtime.id})")


@receiver(post_save, sender=OvertimeHours)
def update_total_overtime(sender, instance, **kwargs):
    update_total_overtime_for_user.delay(instance.attendancesummary.user_id)

@receiver(post_save, sender=OvertimeBase)
def update_backwage_on_overtimebase_update(sender, instance, **kwargs):
    update_total_overtime_for_user.delay(instance.user.id)

@receiver(post_save, sender=Earnings)
def update_overtime_on_earnings_update(sender, instance, **kwargs):
    update_total_overtime_for_user.delay(instance.user.id)

@receiver(post_save, sender=Deductions)
def update_overtime_on_deductions_update(sender, instance, **kwargs):
    update_total_overtime_for_user.delay(instance.user.id)
