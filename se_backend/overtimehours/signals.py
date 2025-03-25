"""
import logging
from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import OvertimeHours
from totalovertime.models import TotalOvertime
from earnings.models import Earnings
from overtimebase.models import OvertimeBase
from deductions.models import Deductions

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


@receiver(post_save, sender=OvertimeHours)
def update_total_overtime(sender, instance, **kwargs):
    try:
        attendance_summary = instance.attendancesummary
        if not attendance_summary:
            logger.warning(f"No AttendanceSummary found for OvertimeHours ID {instance.id}")
            return

        user = attendance_summary.user_id
        if not user:
            logger.warning(f"No user associated with AttendanceSummary ID {attendance_summary.id}")
            return

        earnings = Earnings.objects.filter(user=user).first()
        if not earnings:
            logger.warning(f"No Earnings entry found for User ID {user}")
            return
        basic_rate = earnings.basic_rate

        overtime_base = OvertimeBase.objects.filter(user=user).first()
        if not overtime_base:
            logger.warning(f"No OvertimeBase entry found for User ID {user}")
            return
        backwage_base = overtime_base.backwage_base

        total_regularot = calculate_regularot(basic_rate, instance.regularot)
        total_regularholiday = calculate_regularholiday(basic_rate, instance.regularholiday)
        total_specialholiday = calculate_specialholiday(basic_rate, instance.specialholiday)
        total_restday = calculate_restday(basic_rate, instance.restday)
        total_nightdiff = calculate_nightdiff(basic_rate, instance.nightdiff)
        total_backwage = calculate_backwage(backwage_base, instance.backwage)
        total_late = calculate_late(basic_rate, instance.late)
        total_undertime = calculate_undertime(basic_rate, instance.undertime)

        total_overtime = (
            total_regularot + total_regularholiday + total_specialholiday +
            total_restday + total_nightdiff + total_backwage + total_late + total_undertime
        )

        total_overtime_entry, created = TotalOvertime.objects.update_or_create(
            overtimehours=instance,
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
            },
        )

        if created:
            logger.info(f"Created new TotalOvertime entry for OvertimeHours ID {instance.id}")
        else:
            logger.info(f"Updated TotalOvertime entry for OvertimeHours ID {instance.id}")
    except Exception as e:
        logger.error(f"Error updating TotalOvertime for OvertimeHours ID {instance.id}: {str(e)}")

@receiver(post_save, sender=OvertimeBase)
def update_backwage_on_overtimebase_update(sender, instance, **kwargs):
    try:
        user = instance.user
        if not user:
            logger.warning(f"No user associated with OvertimeBase ID {instance.id}")
            return

        overtime_hours = OvertimeHours.objects.filter(attendancesummary__user_id=user)
        for overtime in overtime_hours:
            total_overtime_entry = TotalOvertime.objects.filter(overtimehours=overtime).first()
            if not total_overtime_entry:
                continue

            total_backwage = calculate_backwage(instance.backwage_base, overtime.backwage)
            total_overtime_entry.total_backwage = total_backwage
            total_overtime_entry.total_overtime = (
                total_overtime_entry.total_regularot +
                total_overtime_entry.total_regularholiday +
                total_overtime_entry.total_specialholiday +
                total_overtime_entry.total_restday +
                total_overtime_entry.total_nightdiff +
                total_overtime_entry.total_late +
                total_overtime_entry.total_undertime +
                total_backwage
            )
            total_overtime_entry.save()
            logger.info(f"Updated TotalOvertime for OvertimeHours ID {overtime.id} after OvertimeBase update")
    except Exception as e:
        logger.error(f"Error updating TotalOvertime for OvertimeBase ID {instance.id}: {str(e)}")
"""
import logging
from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import OvertimeHours
from totalovertime.models import TotalOvertime
from earnings.models import Earnings
from overtimebase.models import OvertimeBase
from deductions.models import Deductions

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


def update_total_overtime_for_user(user):
    overtime_hours = OvertimeHours.objects.filter(attendancesummary__user_id=user)
    earnings = Earnings.objects.filter(user=user).first()
    overtime_base = OvertimeBase.objects.filter(user=user).first()
    deductions = Deductions.objects.filter(user=user).first()

    if not earnings:
        logger.warning(f"No Earnings entry found for User ID {user}")
        return
    if not overtime_base:
        logger.warning(f"No OvertimeBase entry found for User ID {user}")
        return
    if not deductions:
        logger.warning(f"No Deductions entry found for User ID {user}")

    basic_rate = earnings.basic_rate
    backwage_base = overtime_base.backwage_base
    late_base = to_decimal(deductions.late) if deductions else Decimal("0")

    for overtime in overtime_hours:
        total_regularot = calculate_regularot(basic_rate, overtime.regularot)
        total_regularholiday = calculate_regularholiday(basic_rate, overtime.regularholiday)
        total_specialholiday = calculate_specialholiday(basic_rate, overtime.specialholiday)
        total_restday = calculate_restday(basic_rate, overtime.restday)
        total_nightdiff = calculate_nightdiff(basic_rate, overtime.nightdiff)
        total_backwage = calculate_backwage(backwage_base, overtime.backwage)
        total_late = calculate_late(late_base, overtime.late)
        total_undertime = calculate_undertime(basic_rate, overtime.undertime)

        total_overtime = (
                total_regularot + total_regularholiday + total_specialholiday +
                total_restday + total_nightdiff + total_backwage + total_late + total_undertime
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
            },
        )
        logger.info(f"Updated TotalOvertime for OvertimeHours ID {overtime.id} after Earnings/Deductions update")


@receiver(post_save, sender=OvertimeHours)
def update_total_overtime(sender, instance, **kwargs):
    update_total_overtime_for_user(instance.attendancesummary.user_id)


@receiver(post_save, sender=OvertimeBase)
def update_backwage_on_overtimebase_update(sender, instance, **kwargs):
    update_total_overtime_for_user(instance.user)


@receiver(post_save, sender=Earnings)
def update_overtime_on_earnings_update(sender, instance, **kwargs):
    update_total_overtime_for_user(instance.user)


@receiver(post_save, sender=Deductions)
def update_overtime_on_deductions_update(sender, instance, **kwargs):
    update_total_overtime_for_user(instance.user)
