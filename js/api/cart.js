/**
 * Diagon Alley E-commerce — Cart API
 *
 * Endpoints:
 *   GET /carts/mine                 — Obtener/crear mi carrito
 *   GET /carts/{cartId}             — Obtener carrito por ID
 *   POST /carts/{cartId}/items      — Agregar item
 *   PUT /carts/{cartId}/items/{productId} — Actualizar cantidad
 *   DELETE /carts/{cartId}/items/{productId} — Eliminar item
 *   DELETE /carts/{cartId}/items    — Vaciar carrito
 */

import { api } from './client.js';
import { API_PATHS } from '../config/constants.js';

/**
 * Obtiene o crea el carrito del usuario autenticado.
 *
 * @returns {Promise<Object>} — CartResponse { id, items: CartItem[], total }
 */
export function getMyCart() {
  return api.get(API_PATHS.CARTS.MINE, { auth: true });
}

/**
 * Obtiene un carrito por ID.
 *
 * @param {number} cartId
 * @returns {Promise<Object>} — CartResponse
 */
export function getCart(cartId) {
  return api.get(`${API_PATHS.CARTS.BASE}/${cartId}`, { auth: true });
}

/**
 * Agrega un producto al carrito (o incrementa cantidad si ya existe).
 *
 * @param {number} cartId
 * @param {number} productId
 * @returns {Promise<Object>} — CartItemResponse
 */
export function addItem(cartId, productId) {
  return api.post(`${API_PATHS.CARTS.BASE}/${cartId}/items`, { productId }, { auth: true });
}

/**
 * Actualiza la cantidad de un item en el carrito.
 * quantity=0 mantiene el item (no lo elimina).
 *
 * @param {number} cartId
 * @param {number} productId
 * @param {number} quantity
 * @returns {Promise<Object>} — CartItemResponse
 */
export function updateItem(cartId, productId, quantity) {
  return api.put(`${API_PATHS.CARTS.BASE}/${cartId}/items/${productId}`, { quantity }, { auth: true });
}

/**
 * Elimina un item del carrito.
 *
 * @param {number} cartId
 * @param {number} productId
 * @returns {Promise<null>} — 204 No Content
 */
export function removeItem(cartId, productId) {
  return api.del(`${API_PATHS.CARTS.BASE}/${cartId}/items/${productId}`, { auth: true });
}

/**
 * Vacía el carrito por completo.
 *
 * @param {number} cartId
 * @returns {Promise<null>} — 204 No Content
 */
export function clearCart(cartId) {
  return api.del(`${API_PATHS.CARTS.BASE}/${cartId}/items`, { auth: true });
}
