from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets
from .models import Shift
from .serializers import ShiftSerializer

class ShiftViewSet(viewsets.ModelViewSet):
    permissions = [IsAuthenticated]
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer

    def create(self, request, *args, **kwargs):
        """Handles both single and bulk shift creation"""
        is_bulk = isinstance(request.data, list)

        if is_bulk:
            serializer = self.get_serializer(data=request.data, many=True)
        else:
            serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            if is_bulk:
                shifts = [Shift(**shift) for shift in serializer.validated_data]
                Shift.objects.bulk_create(shifts)  # Bulk insert shifts
            else:
                self.perform_create(serializer)

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
