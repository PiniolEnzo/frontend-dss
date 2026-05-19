/**
 * Diagon Alley E-commerce — Checkout Page
 *
 * Resumen de la orden antes de confirmar la compra.
 * Muestra los items del carrito y permite confirmar.
 *
 * Flujo:
 *   1. Cargar carrito y mostrar resumen (read-only)
 *   2. Click "Confirmar compra" → POST /orders/checkout/{cartId}
 *   3. 200 → redirect a order-success.html?orderId={id}
 *   4. 409 → show "Stock insuficiente para: {productName}"
 *   5. 422 → show "El carrito está vacío"
 */

import { requireUser } from '../guards/authGuard.js';
requireUser();


import * as authService from '../services/authService.js';
import { ROLES } from '../config/constants.js';
import { Icons } from '../utils/icons.js';

// Admin no tiene carrito — redirigir al dashboard
if (authService.getRole() === ROLES.ADMIN) {
  window.location.replace('/admin/dashboard.html');
}

import * as cartService from '../services/cartService.js';
import { checkout } from '../api/orders.js';
import { formatCurrency, getImageUrl, sanitizeHtml } from '../utils/helpers.js';
import { showToast } from '../components/toast.js';
import { renderNavbar } from '../components/navbar.js';

renderNavbar();

// Estado
let currentCart = null;
let isProcessing = false;

// Elementos DOM
const itemsContainer = document.getElementById('checkout-items');
const loadingEl = document.getElementById('loading-checkout');
const summaryEl = document.getElementById('checkout-summary');

/**
 * Renderiza los items del checkout (read-only).
 */
function renderCheckoutItems() {
  if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty">
        <div class="empty-state-icon" style="font-size: 3rem; margin-bottom: var(--space-4);">${Icons.cart}</div>
        <h3 class="empty-state-title">Tu carrito está vacío</h3>
        <p class="empty-state-text">Agregá productos antes de finalizar la compra.</p>
        <a href="/products.html" class="btn btn-primary">Ver productos</a>
      </div>
    `;
    summaryEl.innerHTML = '';
    return;
  }

  itemsContainer.innerHTML = `
    <div class="cart-items" style="pointer-events: none;">
      ${currentCart.items
        .filter((item) => item.quantity > 0)
        .map(
          (item) => `
        <div class="cart-item">
           <div class="cart-item-image">
             <img src="${sanitizeHtml(getImageUrl(item.product.imageUrl))}" alt="${sanitizeHtml(item.product.name)}" />
          </div>
          <div class="cart-item-details">
            <h3 class="cart-item-name">${sanitizeHtml(item.product.name)}</h3>
            <span class="cart-item-unit-price">${formatCurrency(item.product.price)} c/u</span>
            <div class="cart-item-actions">
              <span style="font-size: var(--text-sm); color: var(--color-text-secondary);">Cantidad: ${item.quantity}</span>
            </div>
          </div>
          <div class="cart-item-subtotal">
            <span class="cart-item-subtotal-label">Subtotal</span>
            <span class="cart-item-subtotal-value">${formatCurrency(item.subtotal)}</span>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;

  // Render summary con botón de confirmar
  const subtotal = currentCart.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const total = currentCart.total || subtotal;
  const hasItems = currentCart.items.some((item) => item.quantity > 0);

  summaryEl.innerHTML = `
    <h3 class="cart-summary-title">Resumen de compra</h3>
    <div class="cart-summary-row">
      <span>Productos</span>
      <span>${formatCurrency(subtotal)}</span>
    </div>
    <div class="cart-summary-total">
      <span>Total a pagar</span>
      <span>${formatCurrency(total)}</span>
    </div>
    <div class="cart-summary-actions">
      <button class="btn btn-primary btn-lg btn-block" id="btn-confirm-checkout" ${!hasItems ? 'disabled' : ''}>
        Confirmar compra
      </button>
      <a href="/cart.html" class="btn btn-secondary btn-block">Volver al carrito</a>
    </div>
  `;

  // Event listener para confirmar
  const confirmBtn = document.getElementById('btn-confirm-checkout');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', handleCheckout);
  }
}

/**
 * Maneja el checkout.
 */
async function handleCheckout() {
  if (isProcessing) return;
  isProcessing = true;

  const confirmBtn = document.getElementById('btn-confirm-checkout');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Procesando…';
  }

  try {
    const order = await checkout(currentCart.id);
    // Éxito: limpiar cartId cacheado y redirigir
    cartService.clearCartId();

    // Guardar datos de orden para la página de éxito
    if (order && order.id) {
      sessionStorage.setItem('last_order', JSON.stringify(order));
      window.location.href = `/order-success.html?orderId=${order.id}`;
    } else {
      window.location.href = '/orders.html';
    }
  } catch (error) {
    isProcessing = false;
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirmar compra';
    }

    switch (error.status) {
      case 409:
        showToast(error.message || 'Stock insuficiente para uno o más productos. Reducí la cantidad.', 'error');
        break;
      case 422:
        showToast('El carrito está vacío. Agregá productos antes de finalizar la compra.', 'warning');
        break;
      case 401:
        window.location.replace('/login.html?expired=true');
        break;
      case 403:
        showToast('No tenés permisos para realizar esta acción.', 'error');
        break;
      default:
        showToast(error.message || 'Error al procesar la compra. Intentá de nuevo.', 'error');
        break;
    }
  }
}

/**
 * Carga el carrito.
 */
async function loadCart() {
  loadingEl.classList.remove('hidden');
  itemsContainer.innerHTML = '';

  try {
    currentCart = await cartService.getOrCreateCart();
    renderCheckoutItems();
  } catch (error) {
    if (error.status === 401) {
      window.location.replace('/login.html?expired=true');
    } else {
      itemsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${Icons.warning}</div>
          <h3 class="empty-state-title">Error al cargar el carrito</h3>
          <p class="empty-state-text">${error.message || 'Intentá de nuevo más tarde.'}</p>
        </div>
      `;
    }
  } finally {
    loadingEl.classList.add('hidden');
  }
}

// Inicialización
loadCart();
