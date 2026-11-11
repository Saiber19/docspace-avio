# Proceso de Desarrollo Asistido por IA - Fase 2 (DocSpace)

## 1. Agentes Utilizados
- Se empleó **Google Gemini** como asistente de desarrollo para estructurar la comunicación en tiempo real con WebSockets utilizando Django Channels en el backend y la API nativa de WebSocket en React.

## 2. Tareas Concretas y Prompts Clave
- **Configuración ASGI y Consumidores:** 
  *Prompt sugerido:* "Genera un consumidor de Django Channels en Python para sincronizar texto en tiempo real entre múltiples clientes conectados a un documento específico y muestra quién está escribiendo."
- **Integración en React:**
  *Prompt sugerido:* "Cómo conecto un textarea en React a un WebSocket asegurando que si el usuario tiene nivel 'read' solo escuche los cambios sin poder emitirlos."

## 3. Decisiones y Modificaciones
- **Aceptado tal cual:** La lógica de agrupación de `channel_layer` (`group_add` y `group_send`) en `consumers.py` propuesta por el agente. Es el estándar óptimo para salas de chat/edición en Django.
- **Modificado a mano:** Se ajustó el frontend para incluir un temporizador (`setTimeout`) que limpia el indicador de "usuario editando..." después de 2 segundos, evitando que el mensaje se quede congelado permanentemente en la pantalla. También se vinculó explícitamente el atributo `disabled` del textarea a la validación estricta del `userPermissionLevel` obtenida de la Fase 1.

## 4. Verificación de Integración
Se validó la funcionalidad abriendo dos navegadores en paralelo:
1. Una sesión con un **Gestor (Admin)** escribiendo en el documento.
2. Una sesión secundaria con un **Colaborador (Read)**.
Se confirmó que el colaborador recibe el texto y el indicador de presencia en menos de un segundo, pero no puede interactuar con el textarea. Las pruebas automatizadas de la Fase 1 siguen pasando correctamente, lo que garantiza que la inclusión de WebSockets no rompió el aislamiento de Workspaces ni las validaciones de API.