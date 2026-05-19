/**
 * Diagon Alley E-commerce — Guards de autenticación
 *
 * Funciones para proteger rutas según estado de autenticación y rol.
 * Se ejecutan al inicio de cada página, antes de cualquier renderizado.
 *
 * Uso en cada página protegida:
 *   import { requireAuth } from '../guards/authGuard.js';
 *   requireAuth(); // ← primera línea ejecutable después de imports
 */

import * as authService from '../services/authService.js';
import { ROLES } from '../config/constants.js';

/**
 * Redirige a login si el usuario no está autenticado.
 * Guard base para cualquier página protegida.
 */
export function requireAuth() {
  if (!authService.isLoggedIn()) {
    const currentPath = window.location.pathname;
    window.location.replace(`/login.html?redirect=${encodeURIComponent(currentPath)}`);
  }
}

/**
 * Redirige si el usuario no es un usuario común (ROLE_USER).
 * Bloquea el acceso a Admins en vistas de usuario.
 */
export function requireUser() {
  if (!authService.isLoggedIn()) {
    window.location.replace('/login.html');
    return;
  }

  if (authService.isAdmin()) {
    // El admin no puede estar en vistas de usuario común
    window.location.replace('/admin/dashboard.html');
  }
}

/**
 * Redirige al home si el usuario no es admin.
 * Guard para páginas de administración.
 */
export function requireAdmin() {
  if (!authService.isLoggedIn()) {
    window.location.replace('/login.html');
    return;
  }

  if (!authService.isAdmin()) {
    // Mostrar mensaje y redirigir
    const currentPath = window.location.pathname;
    window.location.replace(`/products.html?error=no-permission&redirect=${encodeURIComponent(currentPath)}`);
  }
}

/**
 * Si el usuario ya está autenticado, lo redirige según su rol.
 * Guard para páginas públicas (login, register, forgot-password, reset-password).
 * Previene que usuarios logueados vean formularios de auth.
 */
export function redirectIfAuthenticated() {
  if (!authService.isLoggedIn()) return;

  if (authService.isAdmin()) {
    window.location.replace('/admin/dashboard.html');
  } else {
    window.location.replace('/products.html');
  }
}

/**
 * Redirige al usuario a su landing correspondiente según rol.
 * Útil después de login exitoso.
 */
export function redirectBasedOnRole() {
  const role = authService.getRole();

  if (role === ROLES.ADMIN) {
    window.location.replace('/admin/dashboard.html');
  } else {
    window.location.replace('/products.html');
  }
}
