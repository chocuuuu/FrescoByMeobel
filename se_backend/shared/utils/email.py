from django.core.mail import send_mail
from django.core.mail.message import EmailMessage
from decouple import config

def send_email(subject: str, recipient: str, html: str):
    email = EmailMessage(
        subject=subject,
        body=html,
        from_email=config("EMAIL_HOST_USER"),
        to=[recipient],
    )
    email.content_subtype = "html"
    email.send()