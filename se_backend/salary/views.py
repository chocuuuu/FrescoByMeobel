from rest_framework.permissions import IsAdminUser, IsAuthenticated
from shared.generic_viewset import GenericViewset
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Salary
from .serializers import SalarySerializer
from shared.pagination import StandardPagination
from salary.tasks import generate_salary_entries

class SalaryViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = Salary.objects.all()
    serializer_class = SalarySerializer
    pagination_class = StandardPagination


class TriggerSalaryTaskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        task = generate_salary_entries.delay()  # Call task directly
        return Response({"message": "Salary generation task triggered.", "task_id": task.id}, status=status.HTTP_202_ACCEPTED)