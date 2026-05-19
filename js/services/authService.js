/**
 * Diagon Alley E-commerce — Auth Service
 *
 * Capa de lógica de autenticación. Maneja:
 *   - Login con detección de rol (JWT decode + probe fallback)
 *   - Logout con limpieza completa de estado
 *   - Sesión: persistencia en localStorage y decodificación JWT
 *   - Rol: extracción desde JWT o probe API (ADR-1)
 *
 * ADR-1: JWT Role Detection
 *   Primario: decode JWT payload → extraer claim "role"
 *   Fallback: probar /carts/mine (USER) vs /users (ADMIN)
 */

import * as authApi from '../api/auth.js';
import * as usersApi from '../api/users.js';
import { BASE_URL, STORAGE_KEYS, ROLES } from '../config/constants.js';

/**
 * Decodifica el payload de un JWT (solo lectura, NO verifica firma).
 * @param {string} token
 * @returns {Object|null}
 */
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Intenta extraer el rol del JWT. Si no está, usa fallback probe.
 * @param {string} token
 * @returns {Promise<string>} — 'ROLE_USER' | 'ROLE_ADMIN'
 */
async function resolveRole(token) {
  // 1. Intentar desde el JWT
  const payload = decodeJwt(token);
  if (payload) {
    const roleClaim = payload.role || payload.authorities || payload.rol;
    if (roleClaim) {
      // Normalizar: backend puede devolver "ROLE_USER" o "USER"
      const normalized = roleClaim.startsWith('ROLE_') ? roleClaim : `ROLE_${roleClaim}`;
      if (normalized === ROLES.USER || normalized === ROLES.ADMIN) {
        return normalized;
      }
    }
  }

  // 2. Fallback: probe API
  // Primero probar /carts/mine (solo USER puede acceder)
  // Usamos fetch directo (no api client) para evitar el redirect automático en 401/403
  try {
    const cartsResponse = await fetch(`${BASE_URL}/carts/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (cartsResponse.ok) {
      return ROLES.USER; // Puede acceder al carrito → es USER
    }
  } catch {
    // Si falla (403), probar /users
  }

  try {
    const usersResponse = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (usersResponse.ok) {
      return ROLES.ADMIN; // Puede acceder a users → es ADMIN
    }
  } catch {
    // Si todo falla, asumir USER
  }

  return ROLES.USER; // Default seguro
}

// Cache en memoria del auth state para evitar lecturas repetidas de localStorage
let authStateCache = null;

/**
 * Lee el estado de autenticación desde localStorage.
 * @returns {{ token: string, user: {id:number,name:string,email:string}, role: string } | null}
 */
export function getAuth() {
  if (authStateCache) return authStateCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!raw) return null;
    authStateCache = JSON.parse(raw);
    return authStateCache;
  } catch {
    return null;
  }
}

/**
 * Obtiene solo el token JWT.
 * @returns {string|null}
 */
export function getToken() {
  const auth = getAuth();
  return auth ? auth.token : null;
}

/**
 * Obtiene el rol del usuario autenticado.
 * @returns {string|null}
 */
export function getRole() {
  const auth = getAuth();
  return auth ? auth.role : null;
}

/**
 * Verifica si hay una sesión activa con token no expirado.
 * @returns {boolean}
 */
export function isLoggedIn() {
  const auth = getAuth();
  if (!auth || !auth.token) return false;

  // Verificar expiración del JWT
  const payload = decodeJwt(auth.token);
  if (payload && payload.exp) {
    const expired = Date.now() >= payload.exp * 1000;
    if (expired) {
      // Token expirado → limpiar
      clearSession();
      return false;
    }
  }

  return true;
}

/**
 * Verifica si el usuario es admin.
 * @returns {boolean}
 */
export function isAdmin() {
  const auth = getAuth();
  return auth ? auth.role === ROLES.ADMIN : false;
}

/**
 * Inicia sesión: llama al endpoint, detecta rol, guarda estado.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} — Auth state guardado
 */
export async function login(email, password) {
  const response = await authApi.login(email, password);
  // Sanitizar token: si el backend devuelve "Bearer <jwt>", limpiarlo
  // El prefijo "Bearer" es del header HTTP, no parte del token.
  const rawToken = response.token;
  const token = rawToken ? rawToken.replace(/^Bearer\s+/i, '') : rawToken;

  if (!token) {
    throw { status: 400, message: 'No se recibió token de autenticación.', fieldErrors: null, raw: response };
  }

  // Decodificar JWT para datos del usuario
  const payload = decodeJwt(token);
  const user = {
    id: payload?.userId || payload?.sub || 0,
    name: payload?.name || '',
    email: payload?.email || email,
  };

  // Detectar rol
  const role = await resolveRole(token);

  const authState = { token, user, role };

  // Guardar en localStorage
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(authState));
  authStateCache = authState;

  return authState;
}

/**
 * Cierra sesión: llama al endpoint y limpia todo el estado local.
 */
export async function logout() {
  try {
    await authApi.logout();
  } catch {
    // Ignorar errores — siempre limpiar sesión local
  } finally {
    clearSession();
  }
}

/**
 * Limpia toda la sesión del cliente.
 */
export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.AUTH);
  sessionStorage.removeItem(STORAGE_KEYS.CART_ID);
  authStateCache = null;
}

/**
 * Actualiza el nombre del usuario en el estado local.
 * @param {string} name
 */
export function updateLocalUser(name) {
  const auth = getAuth();
  if (auth) {
    auth.user.name = name;
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(auth));
    authStateCache = auth;
  }
}

/**
 * Cambia la contraseña del usuario autenticado.
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {Promise<Object>}
 */
export function changePassword(oldPassword, newPassword) {
  return authApi.changePassword(oldPassword, newPassword);
}

/**
 * Actualiza el perfil (nombre) del usuario.
 * @param {number} userId
 * @param {string} name
 * @returns {Promise<Object>}
 */
export async function updateProfile(userId, name) {
  const result = await usersApi.updateUser(userId, { name });
  updateLocalUser(name);
  return result;
}
