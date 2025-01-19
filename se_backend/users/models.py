from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
from django.utils.timezone import now


class CustomUserManager(BaseUserManager):
    def create_user(self, id=None, password=None, **extra_fields):
        if id is None:
            raise ValueError("Please specify a valid ID")

        user = self.model(id=id, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, id, password=None):
        user = self.create_user(id=id, password=password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


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

    USERNAME_FIELD = "id"
    REQUIRED_FIELDS = ["email"]

    def __str__(self):
        return f"{self.id} - {self.email}"
