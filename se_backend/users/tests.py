from django.test import TestCase
from users.models import CustomUser, UserPasswordReset
from django.contrib.auth import get_user_model
from datetime import timedelta

class CustomUserModelTestCase(TestCase):

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="testuser@example.com", password="password123", role="employee"
        )

    def test_create_user(self):
        """Test creating a user with email and password"""
        self.assertEqual(CustomUser.objects.count(), 1)
        self.assertEqual(self.user.email, "testuser@example.com")
        self.assertTrue(self.user.check_password("password123"))

    def test_create_superuser(self):
        """Test creating a superuser"""
        superuser = CustomUser.objects.create_superuser(
            email="superuser@example.com", password="superpassword"
        )
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)

    def test_user_group_assignment(self):
        """Test that user is assigned to a group based on role"""
        self.assertTrue(self.user.groups.filter(name="employee").exists())

class UserPasswordResetModelTestCase(TestCase):

    def setUp(self):
        self.password_reset = UserPasswordReset.objects.create(
            email="testuser@example.com", token="reset-token-123"
        )

    def test_password_reset_expiry(self):
        """Test that the token expires after 24 hours"""
        self.assertFalse(self.password_reset.is_expired())

        # Simulate passing 25 hours
        self.password_reset.expiry_at -= timedelta(hours=25)
        self.password_reset.save()

        self.assertTrue(self.password_reset.is_expired())
