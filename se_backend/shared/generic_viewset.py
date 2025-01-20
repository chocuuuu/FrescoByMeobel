from django.core.paginator import Paginator
from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


class GenericViewset(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    include_list_view = True  # Add this line
    protected_views = []
    permissions = [AllowAny]  # Default permission

    def get_protected_views(self):
        """
        Process protected_views to handle 'all' keyword and return final list of protected views
        """
        all_actions = {
            "create",
            "retrieve",
            "update",
            "partial_update",
            "destroy",
            "list",
        }

        if "all" in self.protected_views:
            return list(all_actions)
        return self.protected_views

    def get_permissions(self):
        protected_views = self.get_protected_views()
        if self.action in protected_views:
            return [permission() for permission in self.permissions]
        return [AllowAny()]

    def list(self, request, *args, **kwargs):
        if not self.include_list_view:  # Add this check
            return Response(status=405)  # 405 Method Not Allowed
        queryset = self.filter_queryset(self.get_queryset())
        limit = int(request.query_params.get("limit", 100))
        paginator = Paginator(queryset, limit)
        page = paginator.get_page(1)
        serializer = self.get_serializer(page, many=True)
        return Response(serializer.data)
