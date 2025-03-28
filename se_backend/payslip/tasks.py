from celery import shared_task
from django.utils.timezone import now
from payslip.models import Payslip
from payroll.models import Payroll

@shared_task
def generate_payslip_entries():
    payrolls = Payroll.objects.all()

    for payroll in payrolls:
        # Check if a payslip already exists for this payroll
        if Payslip.objects.filter(payroll_id=payroll).exists():
            continue

        Payslip.objects.create(
            user_id=payroll.user_id,
            payroll_id=payroll,
            status=False,
            approved_at=None,
            generated_at=None,
            is_protected=True
        )

    return "Payslip entries generated successfully."
