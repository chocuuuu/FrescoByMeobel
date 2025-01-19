from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
from django.utils.timezone import now


class CustomUserManager(BaseUserManager):
    def _get_next_available_id(self):
        """
        Get the next available ID by finding the maximum existing ID
        and incrementing it.
        """
        last_user = CustomUser.objects.order_by("id").last()
        if last_user:
            return last_user.id + 1
        return 1

    def create_user(self, email=None, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)

        # Assign the next available ID
        extra_fields.setdefault("id", self._get_next_available_id())

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email=email, password=password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("employee", "Employee"),
    )

    id = models.AutoField(primary_key=True)
    email = models.EmailField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    role = models.CharField(
        max_length=50, choices=ROLE_CHOICES, blank=False, null=False
    )
    created_at = models.DateTimeField(default=now, editable=False)

    objects = CustomUserManager()

    USERNAME_FIELD = "id"  # Login requires `id` and `password`
    REQUIRED_FIELDS = ["email"]  # Superuser creation requires `email` and `password`

    def __str__(self):
        return f"{self.id} - {self.email}"
