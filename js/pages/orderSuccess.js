/**
 * Diagon Alley E-commerce — Order Success Page
 *
 * Página de confirmación de compra exitosa.
 * Muestra el resumen de la orden creada.
 */

import { requireAuth } from '../guards/authGuard.js';
requireAuth();

import { formatCurrency, formatDate, sanitizeHtml, getOrderIdFromUrl } from '../utils/helpers.js';
import { renderNavbar } from '../components/navbar.js';

renderNavbar();

const summaryEl = document.getElementById('order-summary');
const loadingEl = document.getElementById('loading-success');
const successContent = document.getElementById('success-content');

/**
 * Carga y muestra el detalle de la orden.
 */
function loadOrderSummary() {
  // Intentar obtener orden desde sessionStorage (recién creada)
  const lastOrderRaw = sessionStorage.getItem('last_order');

  if (lastOrderRaw) {
    try {
      const order = JSON.parse(lastOrderRaw);
      renderOrder(order);
      sessionStorage.removeItem('last_order');
      return;
    } catch {
      // Ignorar
    }
  }

  // Si no hay orden en sessionStorage, mostrar mensaje genérico
  const orderId = getOrderIdFromUrl();
  summaryEl.innerHTML = `
    <div class="card-body" style="text-align: center;">
      <p style="margin-bottom: var(--space-2);"><strong>Orden #${sanitizeHtml(String(orderId))}</strong></p>
      <p class="text-sm text-muted">Podés ver el detalle completo en "Mis órdenes".</p>
    </div>
  `;
}

/**
 * Renderiza la orden en el DOM.
 * @param {Object} order
 */
function renderOrder(order) {
  const items = order.items || order.orderLines || [];
  const total = order.totalPrice || order.total || 0;

  summaryEl.innerHTML = `
    <div class="card-header">
      <h3 style="font-size: var(--text-lg);">Orden #${order.id}</h3>
      <span class="text-sm text-muted">${order.createdAt ? formatDate(order.createdAt) : ''}</span>
    </div>
    <div class="card-body">
      ${items.length > 0 ? `
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
            ${items.map(item => {
              const productName = item.product?.name || item.productName || 'Producto';
              const qty = item.quantity || 0;
              const unitPrice = item.unitPrice || item.product?.price || 0;
              const subtotal = item.subtotalPrice || item.subtotal || (unitPrice * qty);
              return `
                <tr>
                  <td style="padding: var(--space-2);">${sanitizeHtml(productName)}</td>
                  <td style="text-align: center; padding: var(--space-2);">${qty}</td>
                  <td style="text-align: right; padding: var(--space-2);">${formatCurrency(unitPrice)}</td>
                  <td style="text-align: right; padding: var(--space-2);">${formatCurrency(subtotal)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align: right; padding: var(--space-3); font-weight: 600;">Total</td>
              <td style="text-align: right; padding: var(--space-3); font-weight: 700; color: var(--color-primary);">${formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      ` : `
        <p class="text-center text-muted">No hay items en esta orden.</p>
      `}
      <div style="margin-top: var(--space-4); padding-top: var(--space-3); border-top: 1px solid var(--color-border);">
        <span class="badge badge-info">${sanitizeHtml(order.paymentStatus || 'PENDING')}</span>
      </div>
    </div>
  `;
}

// Inicialización
loadOrderSummary();
loadingEl.classList.add('hidden');
