class DomainViewSet(ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = models.Domain.objects.all()
    serializer_class = serializers.DomainSerializer
    pagination_class = CustomPagination

