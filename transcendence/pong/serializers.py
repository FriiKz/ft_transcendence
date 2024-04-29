from rest_framework import serializers
from .models import RoomName
from accounts.models import CustomUser

class RoomNameSerializer(serializers.ModelSerializer):
    created_by = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all())
    opponent = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all())

    class Meta:
        model = RoomName
        fields = ['name', 'created_by', 'opponent', 'public']