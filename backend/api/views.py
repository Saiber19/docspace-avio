from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Workspace, Document, Version, Permission, AuditLog
from .serializers import (
    UserSerializer,
    WorkspaceSerializer,
    DocumentSerializer,
    VersionSerializer,
    PermissionSerializer,
    AuditLogSerializer
)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = 'Gestor' if (user.is_staff or user.role == 'manager') else 'Colaborador'
        token['is_staff'] = user.is_staff
        return token

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        user = request.user
        role = 'Gestor' if (user.is_staff or getattr(user, 'role', '') == 'manager') else 'Colaborador'
        return Response({
            'username': user.username,
            'email': user.email,
            'role': role,
            'is_staff': user.is_staff
        })

class WorkspaceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', '') == 'manager':
            return Workspace.objects.all()
        return Workspace.objects.filter(documents__permissions__user=user).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        if not (user.is_staff or getattr(user, 'role', '') == 'manager'):
            return Response({'error': 'Solo los gestores pueden crear espacios de trabajo.'}, status=status.HTTP_403_FORBIDDEN)
        
        workspace = serializer.save(owner=user)
        AuditLog.objects.create(
            user=user,
            workspace=workspace,
            action='CREATE',
            resource_type='Workspace',
            resource_id=workspace.id,
            details=f'Espacio de trabajo creado: {workspace.name}'
        )

class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', '') == 'manager':
            return Document.objects.all()
        return Document.objects.filter(permissions__user=user).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        if not (user.is_staff or getattr(user, 'role', '') == 'manager'):
            return Response({'error': 'Solo los gestores pueden crear documentos en el sistema.'}, status=status.HTTP_403_FORBIDDEN)

        workspace_id = self.request.data.get('workspace')
        workspace = Workspace.objects.get(id=workspace_id)

        document = serializer.save(created_by=user, workspace=workspace)
        
        Version.objects.create(
            document=document,
            version_number=1,
            content=document.content,
            author=user
        )
        
        Permission.objects.create(document=document, user=user, level='admin')

        AuditLog.objects.create(
            user=user,
            workspace=workspace,
            action='CREATE',
            resource_type='Document',
            resource_id=document.id,
            details=f'Documento creado: {document.title}'
        )

    def perform_update(self, serializer):
        document = serializer.instance
        user = self.request.user

        is_owner = document.workspace.owner == user
        is_manager = user.is_staff or getattr(user, 'role', '') == 'manager'
        has_edit_perm = Permission.objects.filter(
            document=document, user=user, level__in=['edit', 'admin']
        ).exists()

        if not (is_manager or is_owner or has_edit_perm):
            return Response({'error': 'No tienes permisos de edición en este documento.'}, status=status.HTTP_403_FORBIDDEN)

        document = serializer.save()
        last_version = document.versions.first()
        next_version_num = (last_version.version_number + 1) if last_version else 1

        Version.objects.create(
            document=document,
            version_number=next_version_num,
            content=document.content,
            author=user
        )

        AuditLog.objects.create(
            user=user,
            workspace=document.workspace,
            action='UPDATE',
            resource_type='Document',
            resource_id=document.id,
            details=f'Documento actualizado a versión {next_version_num}: {document.title}'
        )

    @action(detail=True, methods=['post'], url_path='restore-version')
    def restore_version(self, request, pk=None):
        document = self.get_object()
        user = request.user
        
        is_owner = document.workspace.owner == user
        has_admin_perm = Permission.objects.filter(document=document, user=user, level='admin').exists()

        if not (user.is_staff or getattr(user, 'role', '') == 'manager' or is_owner or has_admin_perm):
            return Response({'error': 'Se requieren permisos de administración para restaurar versiones.'}, status=status.HTTP_403_FORBIDDEN)

        version_id = request.data.get('version_id')
        
        try:
            target_version = Version.objects.get(id=version_id, document=document)
        except Version.DoesNotExist:
            return Response({'error': 'Versión no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        document.content = target_version.content
        document.save()

        last_version = document.versions.first()
        next_version_num = (last_version.version_number + 1) if last_version else 1

        Version.objects.create(
            document=document,
            version_number=next_version_num,
            content=target_version.content,
            author=user
        )

        AuditLog.objects.create(
            user=user,
            workspace=document.workspace,
            action='RESTORE',
            resource_type='Document',
            resource_id=document.id,
            details=f'Restaurado desde versión {target_version.version_number}, generando nueva versión {next_version_num}'
        )

        return Response(DocumentSerializer(document).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='assign-permission')
    def assign_permission(self, request, pk=None):
        document = self.get_object()
        user = request.user

        is_owner = document.workspace.owner == user
        has_admin_perm = Permission.objects.filter(document=document, user=user, level='admin').exists()

        if not (user.is_staff or getattr(user, 'role', '') == 'manager' or is_owner or has_admin_perm):
            return Response({'error': 'No tienes permisos de administración en este documento.'}, status=status.HTTP_403_FORBIDDEN)

        target_username = request.data.get('username')
        level = request.data.get('level')

        if level not in ['read', 'edit', 'admin']:
            return Response({'error': 'Nivel de permiso inválido (read, edit, admin).'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(username=target_username)
        except User.DoesNotExist:
            return Response({'error': 'El usuario colaborador no existe.'}, status=status.HTTP_404_NOT_FOUND)

        Permission.objects.update_or_create(
            document=document,
            user=target_user,
            defaults={'level': level}
        )

        AuditLog.objects.create(
            user=user,
            workspace=document.workspace,
            action='ASSIGN_PERMISSION',
            resource_type='Document',
            resource_id=document.id,
            details=f'Se asignó nivel {level} al usuario {target_username}'
        )

        return Response({'status': f'Permiso {level} asignado correctamente a {target_username}.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='compare-versions')
    def compare_versions(self, request, pk=None):
        document = self.get_object()
        v1_id = request.query_params.get('v1')
        v2_id = request.query_params.get('v2')

        try:
            v1 = Version.objects.get(id=v1_id, document=document)
            v2 = Version.objects.get(id=v2_id, document=document)
        except Version.DoesNotExist:
            return Response({'error': 'Una o ambas versiones no existen.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'version_1': {'number': v1.version_number, 'content': v1.content, 'date': v1.created_at},
            'version_2': {'number': v2.version_number, 'content': v2.content, 'date': v2.created_at}
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='my-permission')
    def my_permission(self, request, pk=None):
        document = self.get_object()
        user = request.user
        
        if user.is_staff or getattr(user, 'role', '') == 'manager' or document.workspace.owner == user:
            return Response({'level': 'admin'}, status=status.HTTP_200_OK)
            
        perm = Permission.objects.filter(document=document, user=user).first()
        if perm:
            return Response({'level': perm.level}, status=status.HTTP_200_OK)
            
        return Response({'level': 'read'}, status=status.HTTP_200_OK)

class PermissionViewSet(viewsets.ModelViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated]

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]