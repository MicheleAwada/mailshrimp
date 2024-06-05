from django.contrib import admin
from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'domain', views.DomainViewSet)
router.register(r'mailbox', views.MailBoxViewSet)

urlpatterns = [
]

urlpatterns += router.urls