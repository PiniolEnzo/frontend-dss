/**
 * Diagon Alley E-commerce — Orders API
 *
 * Endpoints:
 *   POST /orders/checkout/{cartId}     — Checkout (USER)
 *   GET /orders/my-orders              — Historial del usuario (USER)
 *   GET /orders                        — Todas las órdenes (ADMIN)
 *   GET /orders/{orderId}              — Detalle de orden (ADMIN)
 *   PUT /orders/{orderId}/status       — Actualizar paymentStatus (ADMIN)
 */

import { api } from './client.js';
import { API_PATHS } from '../config/constants.js';

/**
 * Realiza el checkout del carrito, creando la orden.
 *
 * @param {number} cartId
 * @returns {Promise<Object>} — OrderResponse
 */
export function checkout(cartId) {
  return api.post(`${API_PATHS.ORDERS.CHECKOUT}/${cartId}`, null, { auth: true });
}

/**
 * Obtiene las órdenes del usuario autenticado.
 *
 * @returns {Promise<Array>} — Array de OrderResponse
 */
export function getMyOrders() {
  return api.get(API_PATHS.ORDERS.MY_ORDERS, { auth: true });
}

/**
 * Obtiene todas las órdenes (admin).
 *
 * @returns {Promise<Array>} — Array de OrderResponse
 */
export function getAllOrders() {
  return api.get(API_PATHS.ORDERS.BASE, { auth: true });
}

/**
 * Obtiene una orden por ID (admin).
 *
 * @param {number} orderId
 * @returns {Promise<Object>} — OrderResponse
 */
export function getOrder(orderId) {
  return api.get(`${API_PATHS.ORDERS.BASE}/${orderId}`, { auth: true });
}

/**
 * Actualiza el paymentStatus de una orden (admin).
 *
 * @param {number} orderId
 * @param {string} status — Uno de: PENDING, PAID, PROCESSING, CANCELED, FAILED, REFUNDED
 * @returns {Promise<Object>} — OrderResponse actualizado
 */
export function updateOrderStatus(orderId, status) {
  return api.put(`${API_PATHS.ORDERS.BASE}/${orderId}/status`, null, {
    params: { status },
    auth: true,
  });
}
