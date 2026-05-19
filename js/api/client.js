/**
 * Diagon Alley E-commerce — API Client
 *
 * Fetch wrapper centralizado. Toda llamada HTTP debe pasar por acá.
 * Responsabilidades:
 *   1. Prepend BASE_URL a todos los paths
 *   2. Setear headers (Content-Type, Authorization)
 *   3. Manejo global de 401 (sesión expirada → logout + redirect)
 *   4. Parseo de errores a formato ApiError estandarizado
 *
 * NO importar directamente desde los pages — los pages solo importan
 * los módulos de api/{auth,products,categories,cart,orders,users}.js
 */

import { BASE_URL, STORAGE_KEYS } from '../config/constants.js';

/**
 * @typedef {Object} ApiError
 * @property {number} status — Código HTTP
 * @property {string} message — Mensaje para el usuario
 * @property {Object<string,string>|null} fieldErrors — Errores por campo (400)
 * @property {any} raw — Respuesta original del servidor
 */

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
 * Verifica si el token JWT guardado en localStorage está expirado.
 * @returns {boolean} — true si el token expiró o no existe
 */
function isTokenExpired() {
  try {
    const authData = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!authData) return true;
    const { token } = JSON.parse(authData);
    if (!token) return true;
    const payload = decodeJwt(token);
    if (!payload || !payload.exp) return false; // Sin exp, no podemos saber → asumir válido
    return Date.now() >= payload.exp * 1000;
  } catch {
    return false;
  }
}

/**
 * Limpia la sesión y redirige al login si el token expiró.
 * Lanza un error para cortar la ejecución de JS post-redirect.
 * @param {string} [redirectPath]
 */
function killSession(redirectPath) {
  localStorage.removeItem(STORAGE_KEYS.AUTH);
  sessionStorage.removeItem(STORAGE_KEYS.CART_ID);
  const target = redirectPath || '/login.html?expired=true';
  const currentPath = window.location.pathname;
  if (!currentPath.includes('/login.html') && !currentPath.includes('/register.html')) {
    window.location.replace(target);
  }
  // Lanzar error para frenar la ejecución — el redirect es asincrónico,
  // sin esto el fetch se dispararía igual antes de navegar.
  throw { status: 401, message: 'Sesión expirada.', fieldErrors: null, raw: null };
}

/**
 * Construye los headers para una request.
 * @param {boolean} isAuth — Si es true, adjunta el token JWT
 * @returns {Object}
 */
function buildHeaders(isAuth) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (isAuth) {
    const authData = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (authData) {
      try {
        const { token } = JSON.parse(authData);
        if (token) {
          // Defensivo: evitar "Bearer Bearer" si el token guardado ya incluye
          // el prefijo (ej: backend que devuelve "Bearer <jwt>").
          // El prefijo Bearer es del header HTTP, no parte del token JWT.
          const cleanToken = token.replace(/^Bearer\s+/i, '');
          headers['Authorization'] = `Bearer ${cleanToken}`;
        }
      } catch {
        // Ignorar parse errors
      }
    }
  }
  return headers;
}

/**
 * Determina si un endpoint requiere autenticación.
 * Considera el método HTTP para diferenciar endpoints que son
 * públicos en GET pero requieren auth en POST/PUT/DELETE
 * (ej: /products y /categories).
 *
 * @param {string} path — Ruta relativa (ej: "/auth/login")
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method — Método HTTP
 * @returns {boolean}
 */
function requiresAuth(path, method) {
  // Endpoints completamente públicos (cualquier método)
  const publicPaths = [
    '/auth/register',
    '/auth/login',
    '/auth/forgot-password',
    '/auth/validate',
    '/auth/reset-password',
  ];

  // Endpoints públicos SOLO en GET (POST/PUT/DELETE requieren auth)
  const publicReadPaths = [
    '/products',
    '/categories',
  ];

  const basePath = path.split('?')[0];

  // Endpoints que SIEMPRE requieren auth
  const authRequiredPrefixes = ['/carts', '/orders', '/users', '/auth/me', '/auth/logout', '/auth/change-password'];
  if (authRequiredPrefixes.some((prefix) => basePath.startsWith(prefix))) {
    return true;
  }

  // ¿Está en la lista de paths completamente públicos?
  if (publicPaths.some((p) => basePath === p || basePath.startsWith(p + '?'))) {
    return false;
  }

  // ¿Es GET a un path de solo-lectura pública?
  if (method === 'GET' && publicReadPaths.some((p) => basePath === p || basePath.startsWith(p + '?'))) {
    return false;
  }

  // Todo lo demás requiere autenticación
  return true;
}

/**
 * Parsea el body de error y lo convierte a ApiError.
 * @param {Response} response
 * @returns {Promise<ApiError>}
 */
async function parseError(response) {
  const status = response.status;
  let raw = null;
  try {
    raw = await response.json();
  } catch {
    try {
      raw = await response.text();
    } catch {
      raw = null;
    }
  }

  const apiError = {
    status,
    message: `Error ${status}`,
    fieldErrors: null,
    raw,
  };

  if (raw && typeof raw === 'object') {
    // Detectar si tiene shape de field errors (claves = nombres de campo)
    const keys = Object.keys(raw);
    const isFieldError =
      keys.length > 0 &&
      keys.every((k) => k !== 'error' && k !== 'message' && k !== 'timestamp' && k !== 'status');

    if (isFieldError) {
      apiError.fieldErrors = raw;
      apiError.message = Object.values(raw).join('. ');
    } else if (raw.error) {
      apiError.message = raw.error;
    } else if (raw.message) {
      apiError.message = raw.message;
    }
  } else if (typeof raw === 'string') {
    apiError.message = raw;
  }

  return apiError;
}

/**
 * Lógica central de fetch con manejo de errores.
 *
 * @param {string} path — Ruta relativa (ej: "/auth/login")
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {Object|null} body — Body para POST/PUT
 * @param {Object} [opts] — Opciones adicionales
 * @param {boolean} [opts.auth=true] — Si enviar token JWT
 * @param {Object} [opts.params] — Query params
 * @returns {Promise<any>} — Respuesta parseada
 * @throws {ApiError}
 */
async function request(path, method, body = null, opts = {}) {
  const { auth = requiresAuth(path, method), params } = opts;

  let url = `${BASE_URL}${path}`;

  // Query params
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  // Validar expiración del token ANTES de hacer la request
  // Previene requests fallidas con 403/401 por token vencido
  // (el JWT del backend expira a los 15 minutos)
  if (auth && isTokenExpired()) {
    killSession();
  }

  const headers = buildHeaders(auth);
  const fetchOptions = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    fetchOptions.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err) {
    // Network error
    const apiError = {
      status: 0,
      message: 'Error de conexión. ¿El servidor está corriendo?',
      fieldErrors: null,
      raw: err.message,
    };
    throw apiError;
  }

  // 204 No Content
  if (response.status === 204) {
    return null;
  }

  // Success (2xx)
  if (response.ok) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  // Error
  const apiError = await parseError(response);

  // 401 global — kill session
  if (response.status === 401) {
    killSession();
    throw apiError; // El throw se ejecuta post-redirect, necesario para cortar el flujo
  }

  // 403 con token expirado — algunos backends devuelven 403 en vez de 401
  // cuando el JWT está vencido (depende de la configuración de Spring Security).
  if (response.status === 403 && isTokenExpired()) {
    killSession();
    throw apiError;
  }

  throw apiError;
}

/**
 * API Client export — singleton con métodos HTTP.
 */
export const api = {
  /**
   * GET request
   * @param {string} path
   * @param {Object} [opts]
   * @returns {Promise<any>}
   */
  get(path, opts = {}) {
    return request(path, 'GET', null, opts);
  },

  /**
   * POST request
   * @param {string} path
   * @param {Object} [body]
   * @param {Object} [opts]
   * @returns {Promise<any>}
   */
  post(path, body = null, opts = {}) {
    return request(path, 'POST', body, opts);
  },

  /**
   * PUT request
   * @param {string} path
   * @param {Object} [body]
   * @param {Object} [opts]
   * @returns {Promise<any>}
   */
  put(path, body = null, opts = {}) {
    return request(path, 'PUT', body, opts);
  },

  /**
   * DELETE request
   * @param {string} path
   * @param {Object} [opts]
   * @returns {Promise<any>}
   */
  del(path, opts = {}) {
    return request(path, 'DELETE', null, opts);
  },
};
