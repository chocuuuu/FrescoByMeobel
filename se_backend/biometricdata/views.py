# import aiohttp
# import asyncio
# from datetime import datetime
# from rest_framework import generics, status
# from rest_framework.response import Response
# from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from shared.generic_viewset import GenericViewset
from .models import BiometricData
from .serializers import BiometricDataSerializer


# async on standby before proper integration
"""
ZKTECO_DEVICE_IP = "192.168.1.201"
ZKTECO_PORT = 4370

class FetchBiometricData(APIView):
    async def fetch_logs(self):
        url = f"http://{ZKTECO_DEVICE_IP}/get-logs"
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    biometric_entries = [
                        BiometricData(
                            user_id=log["user_id"],
                            emp_id=log["emp_id"],
                            name=log["name"],
                            time=datetime.strptime(log["time"], "%Y-%m-%d %H:%M:%S"),
                            work_code=log["work_code"],
                            work_state=log["work_state"],
                            terminal_name=log["terminal_name"]
                        ) for log in data
                    ]
                    BiometricData.objects.bulk_create(biometric_entries)

    async def get(self, request):
        await self.fetch_logs()
        return Response({"message": "Biometric data fetched successfully."}, status=status.HTTP_200_OK)
"""


class BiometricDataViewSet(GenericViewset):
    protected_views = ["create", "update", "partial_update", "retrieve", "destroy"]
    permissions = [IsAuthenticated]
    queryset = BiometricData.objects.all()
    serializer_class = BiometricDataSerializer