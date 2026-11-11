# DocSpace - Document Management System

DocSpace es una plataforma integral de gestión documental desarrollada como prueba técnica Full Stack para **Avio Trade Group**. El sistema permite el control estricto de roles, aislamiento de espacios de trabajo (Workspaces), versionamiento inmutable de documentos y una bitácora de auditoría completa, envuelto en una interfaz corporativa moderna (Glassmorphism).

## Tecnologías Utilizadas

**Backend:**
* Python 3 & Django
* Django REST Framework (DRF)
* PostgreSQL
* SimpleJWT (Autenticación basada en Tokens JSON)
* Django-CORS-Headers

**Frontend:**
* React.js (con Vite)
* React Router DOM (Manejo de rutas protegidas)
* Axios (Consumo de API e Interceptores)
* CSS-in-JS (Diseño UI Glassmorphism)

## ✨ Características Principales (Core Features)

1. **Role-Based Access Control (RBAC):**
   * **Gestor (Manager / is_staff):** Control total. Puede crear Workspaces, documentos, asignar permisos granulares y restaurar versiones.
   * **Colaborador:** Acceso restringido. Solo visualiza los Workspaces a los que pertenece y edita documentos donde se le otorgó permiso explícito. Las cuentas nuevas creadas públicamente nacen por defecto con este rol.
2. **Aislamiento de Workspaces:** Los documentos viven estrictamente dentro de espacios de trabajo aislados.
3. **Versionamiento Inmutable:** Cada modificación a un documento genera una nueva versión inalterable en la base de datos, permitiendo visualizar el historial y comparar cambios.
4. **Permisos Granulares:** Asignación de niveles `read`, `edit` y `admin` por usuario y por documento.
5. **Bitácora de Auditoría (Audit Trail):** Registro automático, sellado con fecha y hora, de cada acción crítica (creación, edición, restauración y asignación de accesos).

---

## Requisitos Previos

* Python 3.10+
* Node.js v18+
* PostgreSQL 14+
* - Docker y Docker Compose instalados.
- Puertos `8000` (Backend) y `3000` (Frontend) libres en tu máquina.

## Instalación y Configuración Local

### 1. Configuración de Base de Datos (PostgreSQL)
Abre tu consola de `psql` y ejecuta:
```sql
CREATE DATABASE docspace;