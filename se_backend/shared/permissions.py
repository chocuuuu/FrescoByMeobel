from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit objects.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class IsCustomerPermission(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit objects.
    """

    def has_permission(self, request, view):
        if request.user and request.user.is_customer:
            return True
        return False

class IsOwner(permissions.BasePermission):
    """Allows access only to users with the 'owner' role."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "owner"

class IsAdmin(permissions.BasePermission):
    """Allows access only to users with the 'admin' role."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"

class IsEmployee(permissions.BasePermission):
    """Allows access only to users with the 'employee' role."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "employee"


class IsOwnerOrAdmin(permissions.BasePermission):
    message = "Only owners and admins have access to this resource."

    def has_permission(self, request, view):
        # First ensure user is authenticated
        if not request.user.is_authenticated:
            print(f"Permission denied: User not authenticated")
            return False

        # Check if user model has role attribute
        if not hasattr(request.user, 'role'):
            print(f"Permission denied: User has no role attribute")
            return False

        # Check role
        has_permission = request.user.role in ['owner', 'admin']
        print(
            f"Permission check: User {request.user.id} with role {request.user.role} - Has permission: {has_permission}")
        return has_permission