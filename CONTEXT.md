# Prompt para generar el frontend completo de TechLab

Quiero que actúes como un arquitecto frontend senior y desarrolles un ecommerce completo consumiendo el backend REST API descrito en el archivo API_REFERENCE.md.

# Stack obligatorio

- HTML5
- CSS3
- JavaScript Vanilla (ES6+)
- NO usar frameworks ni librerías externas
- NO usar React, Vue, Angular, Bootstrap, Tailwind, jQuery, etc.
- Todo debe funcionar únicamente con HTML + CSS + JS puro

---

# Objetivo principal

La prioridad absoluta es:

1. Que toda la lógica funcione correctamente con el backend
2. Que la arquitectura frontend esté bien planteada
3. Que el código esté ordenado y mantenible
4. Recién después enfocarse en estilos visuales

NO quiero un frontend improvisado visualmente lindo pero mal estructurado.

Primero resolver correctamente:

- autenticación
- manejo de JWT
- consumo de endpoints
- control de roles
- manejo de sesión
- protección de vistas
- flujo de carrito
- flujo de órdenes
- manejo de errores
- persistencia local
- estructura de carpetas

---

# Arquitectura y estructura

Usar una estructura de carpetas clara, escalable y profesional.

---

# Reglas importantes

- NO escribir JavaScript dentro de los HTML
- Separar toda la lógica en archivos JS independientes
- NO centralizar toda la lógica en un solo archivo
- Crear una capa específica para consumir la API
- Centralizar:
  - baseURL
  - headers
  - manejo del JWT
  - manejo global de errores
  - funciones fetch reutilizables

---

# Integración con backend

Usar EXACTAMENTE los endpoints del backend.

NO inventar endpoints.

NO asumir funcionalidades inexistentes.

Respetar:
- DTOs
- validaciones
- roles
- permisos
- reglas de negocio
- requestMatchers
- responses
- status codes

---

# Configuración API

Crear un archivo central tipo:

```js
const BASE_URL = "https://talento-tech-production.up.railway.app";
```

Crear helpers reutilizables para:
- GET
- POST
- PUT
- DELETE

Agregar automáticamente:

Authorization: Bearer {token}

cuando el endpoint requiera autenticación.

---

# Navbar pública

Cuando NO existe sesión:

Mostrar:
- Logo
- Inicio
- Productos
- Iniciar sesión
- Registrarse

---

# Vista pública de productos (sin login)

Los usuarios NO autenticados:

PUEDEN:
- ver productos
- ver imagen
- ver nombre
- ver precio

NO PUEDEN:
- clickear productos
- ver descripción
- ver stock
- agregar al carrito
- acceder a funcionalidades protegidas

Esta vista debe funcionar como catálogo visual público.

---

# Registro

Implementar:

POST /auth/register

Validar:
- frontend
- backend

Al registrarse exitosamente:
- redirigir automáticamente al login

---

# Login

Implementar:

POST /auth/login

Debe incluir:
- email
- contraseña
- botón iniciar sesión
- link "Olvidé mi contraseña"

Guardar correctamente:
- JWT
- rol
- datos del usuario

Detectar:
- ROLE_USER
- ROLE_ADMIN

---

# Forgot Password

Implementar flujo completo:

POST /auth/forgot-password
GET /auth/validate
POST /auth/reset-password

Crear:
- pantalla solicitar email
- pantalla reset password
- validación de token
- manejo de token expirado

---

# Usuario autenticado (ROLE_USER)

Luego del login:
- redirigir al index del usuario

---

# Vista de productos autenticado

Mostrar:
- imagen
- nombre
- precio
- descripción
- stock
- categoría

El usuario:
- puede clickear productos
- puede entrar al detalle
- puede agregar al carrito

Agregar:
- filtro por categorías
- búsqueda opcional

NO mostrar IDs al usuario.

---

# Carrito

Implementar completamente:

GET /carts/mine
POST /carts/{cartId}/items
PUT /carts/{cartId}/items/{productId}
DELETE /carts/{cartId}/items/{productId}
DELETE /carts/{cartId}/items

Ó

Se podría manejar el carrito solo en el frontend y usar los endpoints necesarios al momento en el que el usuario realice el checkout

Funcionalidades:
- agregar productos
- modificar cantidad
- eliminar productos
- vaciar carrito
- mostrar subtotal
- mostrar total
- checkout

NO mostrar IDs en la interfaz.

---

# Checkout

Implementar:

POST /orders/checkout/{cartId}

Manejar correctamente:
- 409 → stock insuficiente
- 422 → carrito vacío
- 401 → sesión inválida
- 403 → acceso denegado

Mostrar:
- confirmación de compra
- resumen de orden

---

# Órdenes del usuario

Implementar:

GET /orders/my-orders

Mostrar:
- fecha
- estado
- productos
- cantidades
- subtotal
- total

Diseño tipo historial de compras.

---

# Perfil del usuario

Implementar:

GET /auth/me
PUT /users/{id}
POST /auth/change-password

Funciones:
- editar nombre
- cambiar contraseña
- visualizar email

NO permitir modificar datos no soportados por backend.

---

# Logout

Implementar correctamente:

POST /auth/logout

Al cerrar sesión:
- limpiar token
- limpiar localStorage
- limpiar sessionStorage
- limpiar caches
- limpiar datos temporales
- redirigir al inicio

Esto debe funcionar tanto para USER como ADMIN.

---

# Panel ADMIN

Si el usuario tiene ROLE_ADMIN:

redirigir automáticamente a:

/admin/dashboard.html

---

# Dashboard Admin

Debe ser visual y práctico.

Mostrar:
- cantidad total de usuarios
- cantidad total de productos
- cantidad total de órdenes
- órdenes pendientes
- categorías existentes
- accesos rápidos

---

# Administración de productos

CRUD completo.

Usar:
- GET
- POST
- PUT
- DELETE

Tabla administrativa con:
- imagen
- nombre
- categoría
- stock
- precio
- acciones

---

# Administración de categorías

ABM completo.

---

# Administración de usuarios

Tabla de usuarios.

Permitir:
- eliminación de usuarios

NO inventar funcionalidades inexistentes.

---

# Administración de órdenes

Tabla completa de órdenes.

Permitir únicamente:
- modificar paymentStatus

Usar:

PUT /orders/{id}/status

NO permitir edición de otros datos.

---

# Seguridad frontend

Implementar:
- protección de vistas
- redirects automáticos
- guards por rol
- ocultar vistas admin a usuarios comunes
- ocultar botones según permisos
- manejo global de 401 y 403

---

# Manejo de errores

Mostrar mensajes claros para:
- credenciales inválidas
- validaciones
- stock insuficiente
- token expirado
- permisos insuficientes
- errores del servidor
- recursos inexistentes

---

# Diseño visual

Una vez que TODA la funcionalidad esté correctamente implementada:

Crear un diseño:
- moderno
- responsive
- limpio
- profesional
- ecommerce realista

Pero priorizando:
- funcionalidad
- claridad
- mantenibilidad
- simplicidad

---

# Requisitos técnicos importantes

- Usar fetch API
- Usar async/await
- Modularizar correctamente
- Código reutilizable
- Evitar duplicación
- Separar responsabilidades
- Crear componentes reutilizables en JS vanilla cuando sea útil
- Comentar el código importante
- Mantener consistencia de nombres

---

# Flujo esperado de la app

## Usuario no autenticado

- entra al sitio
- ve catálogo limitado
- puede registrarse
- puede iniciar sesión
- puede recuperar contraseña

## Usuario autenticado

- ve productos completos
- filtra categorías
- agrega productos al carrito
- modifica carrito
- realiza checkout
- ve órdenes
- modifica perfil
- cambia contraseña
- cierra sesión

## Admin

- accede a dashboard
- administra productos
- administra categorías
- administra órdenes
- administra usuarios

---

# Entregable esperado

Quiero que generes:

- estructura completa de carpetas
- todos los HTML
- todos los CSS
- todos los JS
- arquitectura explicada
- consumo completo del backend
- manejo correcto de JWT
- manejo correcto de roles
- frontend completamente funcional
- código modular
- código mantenible
- instrucciones para ejecutar el frontend
- configuración clara del BASE_URL

El resultado debe parecer un proyecto frontend profesional real listo para usar con el backend TechLab.