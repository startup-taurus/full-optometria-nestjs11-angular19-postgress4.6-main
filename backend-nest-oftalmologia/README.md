# Backend NestJS - Sistema de Oftalmología con Roles y Permisos

Este es un backend completo desarrollado en NestJS 10 con TypeScript, TypeORM 0.3.x y PostgreSQL 16, que implementa un sistema de roles y permisos (Role-Based Access Control) para una aplicación de oftalmología.

## 🚀 Tecnologías Utilizadas

- **Node.js**: 20.x
- **NestJS**: 10.x
- **TypeScript**: 5.x
- **TypeORM**: 0.3.x
- **PostgreSQL**: 16.x
- **JWT**: Para autenticación y autorización
- **bcrypt**: Para hash de contraseñas
- **class-validator**: Para validación de DTOs

## 🛠️ Configuración del Proyecto

### Pre-requisitos

- Node.js 20.x o superior
- PostgreSQL 16.x
- pgAdmin (opcional, para gestión de base de datos)

### Variables de Entorno

El proyecto utiliza las siguientes variables de entorno (archivo `.env`):

```env
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=123456
DATABASE_NAME=oftalmologia

# JWT Configuration
JWT_SECRET=ZgamesSecretKey
JWT_EXPIRES_IN=60m
JWT_REFRESH_SECRET=ZgamesSecretKeyRefresh
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:4200

# API Configuration
API_PREFIX=v1/api

# Password Configuration
BCRYPT_SALT_ROUNDS=10
```

### Instalación y Configuración

1. **Clonar el repositorio e instalar dependencias**:

```bash
npm install
```

2. **Crear la base de datos PostgreSQL**:

```sql
CREATE DATABASE oftalmologia;
```

3. **Ejecutar migraciones**:

```bash
npm run migration:run
```

4. **Compilar el proyecto**:

```bash
npm run build
```

5. **Iniciar el servidor**:

```bash
# Desarrollo
npm run start:dev

# Producción
npm run start:prod
```

## 📁 Estructura del Proyecto

```
src/
├── main.ts                          # Punto de entrada de la aplicación
├── app.module.ts                    # Módulo principal
├── config/
│   ├── env.validation.ts            # Validación de variables de entorno
│   └── typeorm.config.ts           # Configuración de TypeORM para migraciones
├── responses/
│   └── messages.json               # Mensajes de respuesta en español e inglés
├── common/
│   ├── interceptors/
│   │   └── transform.interceptor.ts # Interceptor para formato de respuesta global
│   ├── filters/
│   │   └── http-exception.filter.ts # Filtro global de excepciones
│   ├── guards/
│   │   └── jwt-auth.guard.ts       # Guard de autenticación JWT
│   ├── decorators/
│   │   └── current-user.decorator.ts # Decorador para obtener usuario actual
│   └── utils/
│       └── pagination.util.ts      # Utilidades de paginación
├── database/
│   └── migrations/                  # Migraciones de TypeORM
├── modules/
│   ├── auth/                       # Módulo de autenticación
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── refresh.strategy.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── refresh.dto.ts
│   ├── users/                      # Módulo de usuarios
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dtos/
│   │       ├── create-user.dto.ts
│   │       ├── update-user.dto.ts
│   │       └── query-user.dto.ts
│   └── roles-permissions/          # Módulo de Roles y Permisos
│       ├── roles-permissions.module.ts
│       ├── entities/
│       │   ├── role.entity.ts
│       │   ├── module.entity.ts
│       │   ├── permission.entity.ts
│       │   ├── role-permission.entity.ts
│       │   └── role-module.entity.ts
│       ├── roles/
│       │   ├── roles.controller.ts
│       │   ├── roles.service.ts
│       │   └── dtos/
│       ├── modules/
│       │   ├── modules.controller.ts
│       │   ├── modules.service.ts
│       │   └── dtos/
│       └── permissions/
│           ├── permissions.controller.ts
│           ├── permissions.service.ts
│           └── dtos/
```

## 🎯 Características Principales

### 1. **Sistema de Autenticación JWT**

- Login con username/email y contraseña
- Tokens de acceso (60 minutos) y refresh (7 días)
- Estrategias JWT separadas para access y refresh tokens
- Bloqueo automático después de 5 intentos fallidos de login

### 2. **Formato de Respuesta Global**

Todas las respuestas siguen el formato estándar:

```json
{
  "statusCode": 200,
  "status": "success",
  "message": {
    "es": "Mensaje en español",
    "en": "Message in English"
  },
  "data": {
    "result": [],
    "totalCount": 0
  }
}
```

### 3. **Sistema de Roles y Permisos Completo**

- **Roles**: Gestión de roles de usuario
- **Módulos**: Organización de funcionalidades por módulos
- **Permisos**: Permisos específicos asociados a módulos
- **Relaciones**: Asignación de permisos y módulos a roles

### 4. **Validación y Seguridad**

- Validación completa con class-validator
- Hash de contraseñas con bcrypt (salt 10)
- Guards JWT para protección de endpoints
- Filtros de excepción personalizados

### 5. **Paginación**

- Paginación en todos los endpoints de listado
- Parámetros: `page`, `limit`
- Filtros de búsqueda específicos por entidad

## 📋 Endpoints API

### Base URL

```
http://localhost:3000/v1/api
```

### 🔐 Autenticación (`/auth`)

#### POST `/auth/login`

**Descripción**: Iniciar sesión

```json
{
  "identifier": "admin@example.com",
  "password": "password123"
}
```

**Respuesta**:

```json
{
  "statusCode": 200,
  "status": "success",
  "message": {
    "es": "Inicio de sesión correcto",
    "en": "Login successful"
  },
  "data": {
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": {
        "id": "uuid",
        "roleName": "Administrator"
      }
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresIn": "60m"
  }
}
```

#### POST `/auth/refresh`

**Descripción**: Refrescar token de acceso

```json
{
  "refreshToken": "refresh_token_here"
}
```

#### GET `/auth/get-me-user`

**Descripción**: Obtener información del usuario autenticado
**Headers**: `Authorization: Bearer <access_token>`

### 👥 Usuarios (`/user`)

#### GET `/user/get-all`

**Descripción**: Obtener listado de usuarios con paginación
**Headers**: `Authorization: Bearer <access_token>`
**Query Parameters**:

- `page` (optional): Número de página (default: 1)
- `limit` (optional): Elementos por página (default: 10)
- `search` (optional): Buscar por username, email, firstName, lastName
- `roleId` (optional): Filtrar por ID de rol
- `isActive` (optional): Filtrar por usuarios activos/inactivos
- `isLocked` (optional): Filtrar por usuarios bloqueados

**Ejemplo**: `GET /user/get-all?page=1&limit=5&search=admin&isActive=true`

#### GET `/user/:id`

**Descripción**: Obtener usuario por ID
**Headers**: `Authorization: Bearer <access_token>`

#### POST `/user/create`

**Descripción**: Crear nuevo usuario
**Headers**: `Authorization: Bearer <access_token>`

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123",
  "roleId": "role_uuid",
  "profilePhoto": "https://example.com/photo.jpg"
}
```

#### PATCH `/user/update/:id`

**Descripción**: Actualizar usuario
**Headers**: `Authorization: Bearer <access_token>`

```json
{
  "firstName": "Updated Name",
  "isActive": false
}
```

#### PATCH `/user/update/current`

**Descripción**: Actualizar perfil del usuario actual (incluyendo foto de perfil y cambio de contraseña)
**Headers**: `Authorization: Bearer <access_token>`
**Content-Type**: `multipart/form-data`

**Campos del formulario**:

- `firstName` (optional): Nuevo nombre
- `lastName` (optional): Nuevo apellido
- `email` (optional): Nuevo email
- `address` (optional): Nueva dirección
- `homePhone` (optional): Nuevo teléfono fijo
- `mobilePhone` (optional): Nuevo teléfono móvil
- `currentPassword` (optional): Contraseña actual (requerida para cambio de contraseña)
- `newPassword` (optional): Nueva contraseña (requerida junto con currentPassword)
- `profilePhoto` (optional): Archivo de imagen para foto de perfil (máx. 8MB, tipos: jpg, png, webp, gif)

#### DELETE `/user/delete/:id`

**Descripción**: Eliminar usuario
**Headers**: `Authorization: Bearer <access_token>`

### 🎭 Roles (`/roles`)

#### GET `/roles/get-all`

**Descripción**: Obtener listado de roles
**Headers**: `Authorization: Bearer <access_token>`
**Query Parameters**:

- `page` (optional): Número de página
- `limit` (optional): Elementos por página
- `search` (optional): Buscar por nombre o descripción
- `isActive` (optional): Filtrar por activos/inactivos

#### GET `/roles/:id`

**Descripción**: Obtener rol por ID
**Headers**: `Authorization: Bearer <access_token>`

#### POST `/roles/create`

**Descripción**: Crear nuevo rol
**Headers**: `Authorization: Bearer <access_token>`

```json
{
  "roleName": "Doctor",
  "description": "Médico especialista en oftalmología"
}
```

#### PATCH `/roles/update/:id`

**Descripción**: Actualizar rol
**Headers**: `Authorization: Bearer <access_token>`

```json
{
  "roleName": "Doctor Especialista",
  "description": "Médico especialista actualizado",
  "isActive": true
}
```

#### DELETE `/roles/delete/:id`

**Descripción**: Eliminar rol
**Headers**: `Authorization: Bearer <access_token>`

### 📦 Módulos (`/module`)

#### GET `/module/get-all`

**Descripción**: Obtener listado de módulos
**Headers**: `Authorization: Bearer <access_token>`

#### GET `/module/:id`

**Descripción**: Obtener módulo por ID (incluye permisos)
**Headers**: `Authorization: Bearer <access_token>`

#### POST `/module/create`

**Descripción**: Crear nuevo módulo
**Headers**: `Authorization: Bearer <access_token>`

```json
{
  "moduleName": "Pacientes",
  "description": "Gestión de pacientes"
}
```

#### PATCH `/module/update/:id`

**Descripción**: Actualizar módulo
**Headers**: `Authorization: Bearer <access_token>`

#### DELETE `/module/delete/:id`

**Descripción**: Eliminar módulo
**Headers**: `Authorization: Bearer <access_token>`

### � Archivos (`/files`)

#### POST `/files/upload`

**Descripción**: Subir archivo al sistema
**Headers**: `Authorization: Bearer <access_token>`
**Content-Type**: `multipart/form-data`

**Campos del formulario**:

- `file`: Archivo a subir (máx. 8MB)
- `entityType`: Tipo de entidad ('user', 'patient', etc.)
- `entityId`: ID de la entidad
- `fileCategory` (optional): Categoría del archivo ('profile_photo', 'document', etc.)

#### GET `/files`

**Descripción**: Obtener listado de archivos
**Headers**: `Authorization: Bearer <access_token>`
**Query Parameters**:

- `entityType` (optional): Filtrar por tipo de entidad
- `entityId` (optional): Filtrar por ID de entidad
- `fileCategory` (optional): Filtrar por categoría
- `isActive` (optional): Filtrar por archivos activos
- `page` (optional): Número de página
- `limit` (optional): Elementos por página

#### GET `/files/:id`

**Descripción**: Obtener archivo por ID
**Headers**: `Authorization: Bearer <access_token>`

#### GET `/files/entity/:entityType/:entityId`

**Descripción**: Obtener archivos de una entidad específica
**Headers**: `Authorization: Bearer <access_token>`
**Query Parameters**:

- `fileCategory` (optional): Filtrar por categoría específica

#### DELETE `/files/:id`

**Descripción**: Eliminar archivo (físico y de base de datos)
**Headers**: `Authorization: Bearer <access_token>`

#### POST `/files/:id/deactivate`

**Descripción**: Desactivar archivo (soft delete)
**Headers**: `Authorization: Bearer <access_token>`

### �🔐 Permisos (`/permission`)

#### GET `/permission/get-all`

**Descripción**: Obtener listado de permisos
**Headers**: `Authorization: Bearer <access_token>`
**Query Parameters**:

- `page` (optional): Número de página
- `limit` (optional): Elementos por página
- `search` (optional): Buscar por nombre o descripción
- `moduleId` (optional): Filtrar por módulo
- `isActive` (optional): Filtrar por activos/inactivos

#### GET `/permission/:id`

**Descripción**: Obtener permiso por ID
**Headers**: `Authorization: Bearer <access_token>`

#### POST `/permission/create`

**Descripción**: Crear nuevo permiso
**Headers**: `Authorization: Bearer <access_token>`

```json
{
  "permissionName": "crear_paciente",
  "description": "Crear nuevos pacientes",
  "moduleId": "module_uuid"
}
```

#### PATCH `/permission/update/:id`

**Descripción**: Actualizar permiso
**Headers**: `Authorization: Bearer <access_token>`

#### DELETE `/permission/delete/:id`

**Descripción**: Eliminar permiso
**Headers**: `Authorization: Bearer <access_token>`

## 🗄️ Base de Datos

### Estructura de Tablas

#### `users`

- `id` (UUID, PK)
- `username` (VARCHAR, UNIQUE)
- `email` (VARCHAR, UNIQUE)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `password_hash` (VARCHAR)
- `role_id` (UUID, FK -> roles.id)
- `profile_photo` (VARCHAR, NULLABLE)
- `is_active` (BOOLEAN, DEFAULT true)
- `is_locked` (BOOLEAN, DEFAULT false)
- `failed_login_attempts` (INTEGER, DEFAULT 0)
- `last_login_at` (TIMESTAMP, NULLABLE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `roles`

- `id` (UUID, PK)
- `role_name` (VARCHAR, UNIQUE)
- `description` (VARCHAR, NULLABLE)
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `modules`

- `id` (UUID, PK)
- `module_name` (VARCHAR, UNIQUE)
- `description` (VARCHAR, NULLABLE)
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `permissions`

- `id` (UUID, PK)
- `permission_name` (VARCHAR)
- `description` (VARCHAR, NULLABLE)
- `is_active` (BOOLEAN, DEFAULT true)
- `module_id` (UUID, FK -> modules.id)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `role_permissions`

- `role_id` (UUID, PK, FK -> roles.id)
- `permission_id` (UUID, PK, FK -> permissions.id)
- `is_enabled` (BOOLEAN, DEFAULT true)

#### `role_modules`

- `role_id` (UUID, PK, FK -> roles.id)
- `module_id` (UUID, PK, FK -> modules.id)
- `is_enabled` (BOOLEAN, DEFAULT true)

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Iniciar en modo desarrollo
npm run start:debug        # Iniciar en modo debug

# Producción
npm run build              # Compilar proyecto
npm run start:prod         # Iniciar en producción

# Base de datos
npm run migration:generate # Generar nueva migración
npm run migration:run      # Ejecutar migraciones
npm run migration:revert   # Revertir última migración

# Utilidades
npm run lint               # Ejecutar linter
npm run format             # Formatear código
```

## 📝 Ejemplos de Uso con Postman

### 1. Crear datos de prueba

**Crear un rol:**

```
POST http://localhost:3000/v1/api/roles/create
Headers: Authorization: Bearer <token>
Body:
{
  "roleName": "Administrator",
  "description": "Full system access"
}
```

**Crear un módulo:**

```
POST http://localhost:3000/v1/api/module/create
Headers: Authorization: Bearer <token>
Body:
{
  "moduleName": "Usuarios",
  "description": "Gestión de usuarios del sistema"
}
```

**Crear un permiso:**

```
POST http://localhost:3000/v1/api/permission/create
Headers: Authorization: Bearer <token>
Body:
{
  "permissionName": "crear_usuario",
  "description": "Crear nuevos usuarios",
  "moduleId": "module_uuid_here"
}
```

**Crear un usuario:**

```
POST http://localhost:3000/v1/api/user/create
Headers: Authorization: Bearer <token>
Body:
{
  "username": "admin",
  "email": "admin@oftalmologia.com",
  "firstName": "Administrator",
  "lastName": "System",
  "password": "admin123",
  "roleId": "role_uuid_here"
}
```

### 2. Autenticación

**Login:**

```
POST http://localhost:3000/v1/api/auth/login
Body:
{
  "identifier": "admin@oftalmologia.com",
  "password": "admin123"
}
```

**Obtener usuario actual:**

```
GET http://localhost:3000/v1/api/auth/get-me-user
Headers: Authorization: Bearer <access_token>
```

## 🛡️ Seguridad

- Contraseñas hasheadas con bcrypt (salt 10)
- Tokens JWT con expiración configurable
- Validación de entrada con class-validator
- Guards de autenticación en endpoints protegidos
- Bloqueo automático por intentos fallidos de login
- CORS configurado para orígenes específicos

## 🔄 Migración de Base de Datos

El proyecto utiliza TypeORM para manejar migraciones. La migración inicial `InitRolesPermissions1692123456789` crea todas las tablas necesarias con sus respectivas relaciones, índices y constraints.

Para ejecutar migraciones:

```bash
npm run migration:run
```

Para revertir la última migración:

```bash
npm run migration:revert
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## 👨‍💻 Autor

**ZGames Development Team**

---

¡El backend está listo para ser utilizado! Todos los endpoints están implementados y funcionando correctamente con el formato de respuesta solicitado y el sistema de roles y permisos completo.
