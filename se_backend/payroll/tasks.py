from celery import shared_task
from django.utils.timezone import now
from payroll.models import Payroll
from salary.models import Salary
from earnings.models import Earnings
from totalovertime.models import TotalOvertime

def calculate_gross_pay(earnings, overtime):
    return (
        (overtime.total_overtime if overtime else 0) +
        (earnings.basic_rate if earnings else 0) +
        (earnings.allowance if earnings else 0) +
        (earnings.ntax if earnings else 0)
    )

def calculate_total_deductions(deductions, overtime, sss, philhealth, pagibig):
    return (
        sum([
            (sss.total_employee if sss else 0),
            (philhealth.total_contribution if philhealth else 0),
            (pagibig.employee_share if pagibig else 0),
            (deductions.wtax if deductions else 0),
            (deductions.nowork if deductions else 0),
            (deductions.loan if deductions else 0),
            (deductions.charges if deductions else 0),
            (deductions.msfcloan if deductions else 0)
        ])
    ) + (
        (overtime.total_late if overtime else 0) +
        (overtime.total_undertime if overtime else 0)
    )


@shared_task
def generate_payroll_entries():
    today = now().date()
    salaries = Salary.objects.all()

    for salary in salaries:
        earnings = salary.earnings_id
        overtime = salary.overtime_id
        deductions = salary.deductions_id
        sss = salary.sss_id
        philhealth = salary.philhealth_id
        pagibig = salary.pagibig_id

        gross_pay = calculate_gross_pay(earnings, overtime)
        total_deductions = calculate_total_deductions(deductions, overtime, sss, philhealth, pagibig)
        net_pay = gross_pay - total_deductions

        # Create or update payroll entry
        Payroll.objects.update_or_create(
            salary_id=salary,
            defaults={
                "user_id": salary.user_id,
                "gross_pay": gross_pay,
                "total_deductions": total_deductions,
                "net_pay": net_pay,
                "pay_date": salary.pay_date
            }
        )

    return "Payroll entries checked and updated successfully."