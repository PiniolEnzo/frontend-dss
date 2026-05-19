/**
 * Diagon Alley E-commerce — Orders Page (User History)
 *
 * Muestra el historial de órdenes del usuario autenticado.
 * Cada orden es expandible para ver sus line items.
 */

import { requireUser } from '../guards/authGuard.js';
requireUser();


import * as ordersApi from '../api/orders.js';
import { formatCurrency, formatDate, sanitizeHtml } from '../utils/helpers.js';
import { showToast } from '../components/toast.js';
import { renderNavbar } from '../components/navbar.js';
import { Icons } from '../utils/icons.js';

renderNavbar();

const container = document.getElementById('orders-container');
const loadingEl = document.getElementById('loading-orders');

/**
 * Obtiene la clase CSS para un badge de estado.
 * @param {string} status
 * @returns {string}
 */
function getStatusBadgeClass(status) {
  switch (status) {
    case 'PENDING':
      return 'badge-warning';
    case 'PAID':
      return 'badge-success';
    case 'PROCESSING':
      return 'badge-info';
    case 'CANCELED':
    case 'FAILED':
      return 'badge-error';
    case 'REFUNDED':
      return 'badge-info';
    default:
      return 'badge-info';
  }
}

/**
 * Renderiza las órdenes.
 * @param {Array} orders
 */
function renderOrders(orders) {
  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${Icons.orders}</div>
        <h3 class="empty-state-title">No realizaste ninguna compra todavía</h3>
        <p class="empty-state-text">Explorá nuestros productos y hacé tu primera compra.</p>
        <a href="/products.html" class="btn btn-primary">Ver productos</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: var(--space-4);">
      ${orders
        .map(
          (order) => `
        <div class="card order-card" data-order-id="${order.id}">
          <div class="card-body" style="cursor: pointer;" onclick="toggleOrderDetails(${order.id})">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3);">
              <div>
                <strong>Orden #${order.id}</strong>
                <span class="text-sm text-muted" style="display: block;">
                  ${order.createdAt ? formatDate(order.createdAt) : ''}
                </span>
              </div>
              <div style="display: flex; align-items: center; gap: var(--space-3);">
                <span class="badge ${getStatusBadgeClass(order.paymentStatus)}">${order.paymentStatus || 'PENDING'}</span>
                <strong style="font-size: var(--text-lg); color: var(--color-primary);">${formatCurrency(order.totalPrice || 0)}</strong>
              </div>
            </div>
          </div>
          <div class="order-details" id="order-details-${order.id}" style="display: none; border-top: 1px solid var(--color-border);">
            <div class="card-body">
              <table style="width: 100%; font-size: var(--text-sm);">
                <thead>
                  <tr>
                    <th style="text-align: left; padding: var(--space-2);">Producto</th>
                    <th style="text-align: center; padding: var(--space-2);">Cant.</th>
                    <th style="text-align: right; padding: var(--space-2);">Precio</th>
                    <th style="text-align: right; padding: var(--space-2);">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${(order.items || order.orderLines || []).map(item => `
                    <tr>
                      <td style="padding: var(--space-2);">${sanitizeHtml(item.product?.name || item.productName || '')}</td>
                      <td style="text-align: center; padding: var(--space-2);">${item.quantity || 0}</td>
                      <td style="text-align: right; padding: var(--space-2);">${formatCurrency(item.unitPrice || item.product?.price || 0)}</td>
                      <td style="text-align: right; padding: var(--space-2);">${formatCurrency(item.subtotalPrice || item.subtotal || 0)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

/**
 * Toggle de detalles de orden (función global para onclick).
 * @param {number} orderId
 */
window.toggleOrderDetails = function (orderId) {
  const details = document.getElementById(`order-details-${orderId}`);
  if (details) {
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
  }
};

/**
 * Carga las órdenes desde la API.
 */
async function loadOrders() {
  loadingEl.classList.remove('hidden');
  container.innerHTML = '';

  try {
    const orders = await ordersApi.getMyOrders();
    renderOrders(orders);
  } catch (error) {
    if (error.status === 401) {
      window.location.replace('/login.html?expired=true');
     } else {
       container.innerHTML = `
         <div class="empty-state">
           <div class="empty-state-icon">${Icons.warning}</div>
           <h3 class="empty-state-title">Error al cargar órdenes</h3>
           <p class="empty-state-text">${error.message || 'Intentá de nuevo más tarde.'}</p>
         </div>
       `;
     }

  } finally {
    loadingEl.classList.add('hidden');
  }
}

// Inicialización
loadOrders();
