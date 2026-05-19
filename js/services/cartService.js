/**
 * Diagon Alley E-commerce — Cart Service
 *
 * Capa de lógica del carrito. Abstracta los detalles de API y caching.
 *
 * ADR-2: Cart ID Caching
 *   - sessionStorage para cartId (se pierde al cerrar pestaña)
 *   - GET /carts/mine como entry point (auto-crea el carrito si no existe)
 */

import * as cartApi from '../api/cart.js';
import { STORAGE_KEYS } from '../config/constants.js';

/**
 * Obtiene o crea el carrito del usuario.
 * Cachea cartId en sessionStorage.
 *
 * @returns {Promise<Object>} — CartResponse { id, items, total }
 */
export async function getOrCreateCart() {
  const cart = await cartApi.getMyCart();

  // Cachear cartId
  if (cart && cart.id) {
    sessionStorage.setItem(STORAGE_KEYS.CART_ID, String(cart.id));
  }

  return cart;
}

/**
 * Obtiene el cartId cacheado o lo busca desde el backend.
 * @returns {Promise<number>}
 */
export async function getCartId() {
  const cached = sessionStorage.getItem(STORAGE_KEYS.CART_ID);
  if (cached) {
    return parseInt(cached, 10);
  }

  // No cacheado → obtener del backend
  const cart = await getOrCreateCart();
  return cart.id;
}

/**
 * Agrega un producto al carrito (1 unidad).
 *
 * @param {number} productId
 * @returns {Promise<Object>} — Cart actualizado
 */
export async function addItem(productId) {
  const cartId = await getCartId();
  await cartApi.addItem(cartId, productId);
  // Devolver el carrito actualizado
  return getOrCreateCart();
}

/**
 * Actualiza la cantidad de un producto en el carrito.
 *
 * @param {number} productId
 * @param {number} quantity
 * @returns {Promise<Object>} — Cart actualizado
 */
export async function updateQuantity(productId, quantity) {
  const cartId = await getCartId();
  await cartApi.updateItem(cartId, productId, quantity);
  return getOrCreateCart();
}

/**
 * Elimina un producto del carrito.
 *
 * @param {number} productId
 * @returns {Promise<Object>} — Cart actualizado
 */
export async function removeItem(productId) {
  const cartId = await getCartId();
  await cartApi.removeItem(cartId, productId);
  return getOrCreateCart();
}

/**
 * Vacía el carrito.
 *
 * @returns {Promise<Object>} — Cart vacío
 */
export async function clearCart() {
  const cartId = await getCartId();
  await cartApi.clearCart(cartId);
  return getOrCreateCart();
}

/**
 * Obtiene el total de items en el carrito (suma de cantidades).
 *
 * @param {Object} cart — CartResponse
 * @returns {number}
 */
export function getItemCount(cart) {
  if (!cart || !cart.items) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Obtiene el precio total del carrito.
 *
 * @param {Object} cart — CartResponse
 * @returns {number}
 */
export function getCartTotal(cart) {
  if (!cart) return 0;
  return cart.total || 0;
}

/**
 * Limpia el cartId cacheado.
 */
export function clearCartId() {
  sessionStorage.removeItem(STORAGE_KEYS.CART_ID);
}
