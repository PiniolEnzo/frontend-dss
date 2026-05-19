/**
 * Diagon Alley E-commerce — Users API
 *
 * Endpoints:
 *   GET /users/{id}    — Obtener usuario (ADMIN)
 *   PUT /users/{id}    — Actualizar usuario (USER propio o ADMIN)
 *   DELETE /users/{id} — Eliminar usuario (ADMIN)
 */

import { api } from './client.js';
import { API_PATHS } from '../config/constants.js';

/**
 * Obtiene la lista de todos los usuarios activos (admin).
 *
 * @returns {Promise<Array>} — Array de UserDto { id, name, email, active, createdAt, updatedAt, userRole }
 */
export function getUsers() {
  return api.get(API_PATHS.USERS.BASE, { auth: true });
}

/**
 * Obtiene un usuario por ID (admin).
 *
 * @param {number} id
 * @returns {Promise<Object>} — UserResponse { id, name, email }
 */
export function getUser(id) {
  return api.get(`${API_PATHS.USERS.BASE}/${id}`, { auth: true });
}

/**
 * Actualiza los datos de un usuario.
 * El usuario autenticado puede actualizar su propio nombre.
 * El admin puede actualizar cualquier usuario.
 *
 * @param {number} id
 * @param {Object} data — { name: string }
 * @returns {Promise<Object>} — UserResponse { id, name, email }
 */
export function updateUser(id, data) {
  return api.put(`${API_PATHS.USERS.BASE}/${id}`, data, { auth: true });
}

/**
 * Elimina un usuario (hard delete). Solo admin.
 *
 * @param {number} id
 * @returns {Promise<null>} — 204 No Content
 */
export function deleteUser(id) {
  return api.del(`${API_PATHS.USERS.BASE}/${id}`, { auth: true });
}
