from celery import shared_task
import time
from django.core.mail import send_mail
from django.template.loader import render_to_string


@shared_task
def send_reset_email(email, reset_link, user_id):
    time.sleep(3)  # Delay before sending email

    html_content = render_to_string("reset_password_email.html", {"reset_link": reset_link, "id": user_id})

    send_mail(
        subject="[Fresco]: Password Reset Request",
        message="",
        from_email="noreply@fresco.com",
        recipient_list=[email],
        html_message=html_content,
    )
