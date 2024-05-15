from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from .models import User
from rest_framework.authtoken.models import Token
from rest_framework import permissions

from django.utils.translation import gettext_lazy as _
from rest_framework.authtoken.serializers import AuthTokenSerializer
from django.contrib.auth import authenticate
from rest_framework import serializers

def getTokenFromUser(user):
    token, _ = Token.objects.get_or_create(user=user)
    return token.key



def getUserDataFromUser(user):
    return {
        "token": getTokenFromUser(user),
        "username": user.username,
    }

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def getUserData(request):
    user_data = getUserDataFromUser(request.user)
    return Response(user_data)

class CustomMessageAuthTokenSerializer(AuthTokenSerializer):
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(request=self.context.get('request'),
                                username=username, password=password)
            if not user:
                msg = _('Wrong username or password.')
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = _('Must include "username" and "password".')
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs

class ObtainAuthToken(ObtainAuthToken):
    serializer_class = CustomMessageAuthTokenSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data.get("user")
        token = getTokenFromUser(user)
        tokenData = { 'token': token }
        fullData = tokenData.copy()
        fullData.update(getUserDataFromUser(user))

        return Response(fullData)

loginView = ObtainAuthToken.as_view()


