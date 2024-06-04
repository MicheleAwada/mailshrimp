from rest_framework.viewsets import ModelViewSet
from . import models
from rest_framework import permissions
from . import serializers
from rest_framework.pagination import PageNumberPagination

class CustomPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 200

class DomainViewSet(ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = models.Domain.objects.all()
    serializer_class = serializers.DomainSerializer
    pagination_class = CustomPagination

class MailBoxViewSet(ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = models.MailBox.objects.all()
    serializer_class = serializers.MailBoxSerializer