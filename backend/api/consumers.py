import json
from channels.generic.websocket import AsyncWebsocketConsumer

class DocumentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.document_id = self.scope['url_route']['kwargs']['document_id']
        self.room_group_name = f'document_{self.document_id}'

        # Unirse al grupo del documento
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Salir del grupo
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Recibir mensaje del WebSocket del cliente
    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data.get('content', '')
        username = data.get('username', 'Usuario Desconocido') # <-- Añadido para el indicador de presencia

        # Enviar el contenido y el usuario a todos en el grupo del documento
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'document_update',
                'content': content,
                'username': username # <-- Añadido
            }
        )

    # Enviar mensaje al WebSocket del navegador
    async def document_update(self, event):
        content = event['content']
        username = event.get('username', 'Usuario Desconocido')
        
        await self.send(text_data=json.dumps({
            'content': content,
            'username': username # <-- Añadido
        }))