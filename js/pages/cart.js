/**
 * Diagon Alley E-commerce — Cart Page
 *
 * Muestra el carrito del usuario, permite modificar cantidades,
 * eliminar items, vaciar carrito, y proceder al checkout.
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
import { formatCurrency, getImageUrl, sanitizeHtml } from '../utils/helpers.js';
import { showToast } from '../components/toast.js';
import { renderNavbar } from '../components/navbar.js';

renderNavbar();

// Estado
let currentCart = null;

// Elementos DOM
const container = document.getElementById('cart-items-container');
const loadingEl = document.getElementById('loading-cart');
const summaryEl = document.getElementById('cart-summary');
const clearBtn = document.getElementById('btn-clear-cart');
const continueBtn = document.getElementById('btn-continue-shopping');

/**
 * Renderiza los items del carrito.
 */
function renderCartItems() {
  if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="empty-state-icon" style="font-size: 3rem; margin-bottom: var(--space-4);">${Icons.cart}</div>
        <h3 class="empty-state-title">Tu carrito está vacío</h3>
        <p class="empty-state-text">Agregá productos desde el catálogo para empezar a comprar.</p>
        <a href="/products.html" class="btn btn-primary">Ver productos</a>
      </div>
    `;
    summaryEl.innerHTML = '';
    clearBtn.disabled = true;
    return;
  }

  clearBtn.disabled = false;

  container.innerHTML = `
    <div class="cart-items">
      ${currentCart.items
        .map(
          (item, index) => `
        <div class="cart-item" data-product-id="${item.product.id}" data-index="${index}">
          <div class="cart-item-image">
            <img src="${sanitizeHtml(getImageUrl(item.product.imageUrl || item.product.image))}" alt="${sanitizeHtml(item.product.name)}" loading="lazy" />
          </div>
          <div class="cart-item-details">
            <h3 class="cart-item-name">${sanitizeHtml(item.product.name)}</h3>
            <span class="cart-item-unit-price">${formatCurrency(item.product.price)} c/u</span>
            <div class="cart-item-actions">
              <div class="cart-item-quantity">
                <button class="quantity-btn btn-qty-minus" data-product-id="${item.product.id}">−</button>
                <input type="number" class="quantity-value" value="${item.quantity}" min="0" max="1000000" data-product-id="${item.product.id}" />
                <button class="quantity-btn btn-qty-plus" data-product-id="${item.product.id}">+</button>
              </div>
              <button class="btn-remove-item" data-product-id="${item.product.id}">Eliminar</button>
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

  // Render summary
  renderSummary();

  // Event listeners: quantity controls
  container.querySelectorAll('.btn-qty-minus').forEach((btn) => {
    btn.addEventListener('click', () => handleQuantityChange(parseInt(btn.dataset.productId, 10), 'minus'));
  });

  container.querySelectorAll('.btn-qty-plus').forEach((btn) => {
    btn.addEventListener('click', () => handleQuantityChange(parseInt(btn.dataset.productId, 10), 'plus'));
  });

  container.querySelectorAll('.quantity-value').forEach((input) => {
    input.addEventListener('change', () => {
      handleQuantityChange(parseInt(input.dataset.productId, 10), 'set', parseInt(input.value, 10));
    });
  });

  container.querySelectorAll('.btn-remove-item').forEach((btn) => {
    btn.addEventListener('click', () => handleRemoveItem(parseInt(btn.dataset.productId, 10)));
  });
}

/**
 * Renderiza el resumen del carrito.
 */
function renderSummary() {
  if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
    summaryEl.innerHTML = '';
    return;
  }

  const subtotal = currentCart.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const total = currentCart.total || subtotal;

  summaryEl.innerHTML = `
    <h3 class="cart-summary-title">Resumen</h3>
    <div class="cart-summary-row">
      <span>Productos (${currentCart.items.length})</span>
      <span>${formatCurrency(subtotal)}</span>
    </div>
    <div class="cart-summary-total">
      <span>Total</span>
      <span>${formatCurrency(total)}</span>
    </div>
    <div class="cart-summary-actions">
      <a href="/checkout.html" class="btn btn-primary btn-lg">Finalizar compra</a>
      <a href="/products.html" class="btn btn-secondary">Seguir comprando</a>
    </div>
  `;
}

/**
 * Maneja cambios de cantidad.
 * @param {number} productId
 * @param {'minus'|'plus'|'set'} action
 * @param {number} [value]
 */
async function handleQuantityChange(productId, action, value) {
  const item = currentCart.items.find((i) => i.product.id === productId);
  if (!item) return;

  let newQuantity = item.quantity;

  if (action === 'minus') newQuantity = Math.max(0, item.quantity - 1);
  else if (action === 'plus') newQuantity = Math.min(1000000, item.quantity + 1);
  else if (action === 'set') newQuantity = Math.max(0, Math.min(1000000, value || 0));

  if (newQuantity === item.quantity) return;

  try {
    currentCart = await cartService.updateQuantity(productId, newQuantity);
    renderCartItems();
    renderNavbar(); // Actualizar badge
  } catch (error) {
    showToast(error.message || 'Error al actualizar cantidad', 'error');
    // Recargar carrito para restaurar estado
    await loadCart();
  }
}

/**
 * Maneja eliminación de items.
 * @param {number} productId
 */
async function handleRemoveItem(productId) {
  if (!confirm('¿Eliminar este producto del carrito?')) return;

  try {
    currentCart = await cartService.removeItem(productId);
    renderCartItems();
    renderNavbar();
    showToast('Producto eliminado del carrito', 'info');
  } catch (error) {
    showToast(error.message || 'Error al eliminar producto', 'error');
    await loadCart();
  }
}

/**
 * Carga el carrito desde la API.
 */
async function loadCart() {
  loadingEl.classList.remove('hidden');
  container.innerHTML = '';

  try {
    currentCart = await cartService.getOrCreateCart();
    renderCartItems();
  } catch (error) {
    if (error.status === 401) {
      window.location.replace('/login.html?expired=true');
    } else {
      container.innerHTML = `
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

// Event listeners
clearBtn.addEventListener('click', async () => {
  if (!currentCart || !currentCart.items || currentCart.items.length === 0) return;
  if (!confirm('¿Vaciar el carrito por completo?')) return;

  try {
    currentCart = await cartService.clearCart();
    renderCartItems();
    renderNavbar();
    showToast('Carrito vaciado', 'info');
  } catch (error) {
    showToast(error.message || 'Error al vaciar el carrito', 'error');
    await loadCart();
  }
});

continueBtn.addEventListener('click', () => {
  window.location.href = '/products.html';
});

// Inicialización
loadCart();
