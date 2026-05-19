/**
 * Diagon Alley E-commerce — Products API
 *
 * Endpoints: GET /products (público), GET /products/{id} (autenticado)
 *            POST /products (admin), PUT /products/{id} (admin), DELETE /products/{id} (admin)
 */

import { api } from './client.js';
import { API_PATHS } from '../config/constants.js';

/**
 * Obtiene todos los productos. Opcionalmente filtra por categoría.
 * Endpoint público — no requiere autenticación.
 *
 * @param {number|null} [categoryId] — Filtro opcional por categoría
 * @returns {Promise<Array>} — Array de ProductResponse
 */
export function getProducts(categoryId = null) {
  const params = {};
  if (categoryId !== null && categoryId !== undefined && categoryId !== '') {
    params.categoryId = categoryId;
  }
  return api.get(API_PATHS.PRODUCTS.BASE, { params, auth: false });
}

/**
 * Obtiene un producto por ID.
 * Endpoint autenticado.
 *
 * @param {number} id
 * @returns {Promise<Object>} — ProductResponse
 */
export function getProduct(id) {
  return api.get(`${API_PATHS.PRODUCTS.BASE}/${id}`, { auth: true });
}

/**
 * Crea un producto nuevo.
 * Endpoint admin.
 *
 * @param {Object} data — ProductRequest { name, description, price, categoryId, stock, imageUrl }
 * @returns {Promise<Object>} — ProductResponse
 */
export function createProduct(data) {
  return api.post(API_PATHS.PRODUCTS.BASE, data, { auth: true });
}

/**
 * Actualiza un producto existente (PUT — reemplazo completo).
 * Endpoint admin.
 *
 * @param {number} id
 * @param {Object} data — ProductRequest completo
 * @returns {Promise<Object>} — ProductResponse
 */
export function updateProduct(id, data) {
  return api.put(`${API_PATHS.PRODUCTS.BASE}/${id}`, data, { auth: true });
}

/**
 * Elimina un producto.
 * Endpoint admin.
 *
 * @param {number} id
 * @returns {Promise<null>} — 204 No Content
 */
export function deleteProduct(id) {
  return api.del(`${API_PATHS.PRODUCTS.BASE}/${id}`, { auth: true });
}
