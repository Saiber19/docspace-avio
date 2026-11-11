from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Workspace, Document, Version, Permission, AuditLog

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = 'Gestor' if (user.is_staff or getattr(user, 'role', '') == 'manager') else 'Colaborador'
        token['is_staff'] = user.is_staff
        return token

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class WorkspaceSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Workspace
        fields = ['id', 'name', 'owner', 'created_at']
        read_only_fields = ['owner']

class VersionSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Version
        fields = ['id', 'document', 'version_number', 'content', 'author_username', 'created_at']
        read_only_fields = ['version_number', 'author', 'created_at']

class DocumentSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    versions = VersionSerializer(many=True, read_only=True)

    class Meta:
        model = Document
        fields = ['id', 'workspace', 'title', 'content', 'created_by_username', 'created_at', 'updated_at', 'versions']
        read_only_fields = ['created_by', 'workspace']

class PermissionSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Permission
        fields = ['id', 'document', 'user', 'user_username', 'level']

class AuditLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user_username', 'workspace', 'action', 'resource_type', 'resource_id', 'timestamp', 'details']
        read_only_fields = ['timestamp']