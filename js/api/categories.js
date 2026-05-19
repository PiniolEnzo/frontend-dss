/**
 * Diagon Alley E-commerce — Categories API
 *
 * Endpoints:
 *   GET /categories     (público)    — Lista liviana para usuarios
 *   GET /categories/all  (admin)      — Lista completa con entidad
 *   GET /categories/{id}  (autenticado) — Categoría individual
 *   POST /categories     (admin)      — Crear
 *   PUT /categories/{id} (admin)      — Actualizar
 *   DELETE /categories/{id} (admin)   — Eliminar
 */

import { api } from './client.js';
import { API_PATHS } from '../config/constants.js';

/**
 * Obtiene todas las categorías (vista pública).
 * Endpoint público.
 *
 * @returns {Promise<Array>} — Array de CategoryResponse { id, name }
 */
export function getCategories() {
  return api.get(API_PATHS.CATEGORIES.BASE, { auth: false });
}

/**
 * Obtiene todas las categorías con datos completos de entidad.
 * Endpoint admin.
 *
 * @returns {Promise<Array>} — Array de Category entity (con timestamps)
 */
export function getCategoriesAll() {
  return api.get(API_PATHS.CATEGORIES.ALL, { auth: true });
}

/**
 * Obtiene una categoría por ID.
 * Endpoint autenticado.
 *
 * @param {number} id
 * @returns {Promise<Object>} — CategoryResponse
 */
export function getCategory(id) {
  return api.get(`${API_PATHS.CATEGORIES.BASE}/${id}`, { auth: true });
}

/**
 * Crea una nueva categoría.
 * Endpoint admin.
 *
 * @param {string} name
 * @returns {Promise<Object>} — CategoryResponse
 */
export function createCategory(name) {
  return api.post(API_PATHS.CATEGORIES.BASE, { name }, { auth: true });
}

/**
 * Actualiza una categoría existente.
 * Endpoint admin.
 *
 * @param {number} id
 * @param {string} name
 * @returns {Promise<Object>} — CategoryResponse
 */
export function updateCategory(id, name) {
  return api.put(`${API_PATHS.CATEGORIES.BASE}/${id}`, { name }, { auth: true });
}

/**
 * Elimina una categoría. Los productos asociados pierden su categoría (set null).
 * Endpoint admin.
 *
 * @param {number} id
 * @returns {Promise<null>} — 204 No Content
 */
export function deleteCategory(id) {
  return api.del(`${API_PATHS.CATEGORIES.BASE}/${id}`, { auth: true });
}
