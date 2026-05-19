/**
 * Diagon Alley E-commerce — Admin Orders
 *
 * Tabla de órdenes con posibilidad de cambiar el paymentStatus.
 * Solo se puede modificar paymentStatus — ningún otro campo.
 */

import { requireAdmin } from '../../guards/authGuard.js';
requireAdmin();

import * as ordersApi from '../../api/orders.js';
import { formatCurrency, formatDate, sanitizeHtml } from '../../utils/helpers.js';
import { showToast } from '../../services/errorHandler.js';
import { renderAdminSidebar } from '../../components/adminSidebar.js';
import { Icons } from '../../utils/icons.js';
import { PAYMENT_STATUSES } from '../../config/constants.js';

renderAdminSidebar();

const tableContainer = document.getElementById('orders-table-container');
const loadingEl = document.getElementById('loading-orders');

/**
 * Obtiene la clase badge para un status.
 * @param {string} status
 * @returns {string}
 */
function getStatusBadgeClass(status) {
  switch (status) {
    case 'PENDING': return 'badge-warning';
    case 'PAID': return 'badge-success';
    case 'PROCESSING': return 'badge-info';
    case 'CANCELED':
    case 'FAILED': return 'badge-error';
    case 'REFUNDED': return 'badge-info';
    default: return 'badge-info';
  }
}

/**
 * Renderiza la tabla de órdenes.
 * @param {Array} orders
 */
function renderTable(orders) {
  if (!orders || orders.length === 0) {
    tableContainer.innerHTML = `
       <div class="empty-state">
         <div class="empty-state-icon">${Icons.orders}</div>
         <h3 class="empty-state-title">No hay órdenes registradas</h3>
         <p class="empty-state-text">Cuando los usuarios realicen compras, aparecerán aquí.</p>
       </div>

    `;
    return;
  }

  tableContainer.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Fecha</th>
          <th>Items</th>
          <th>Total</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${orders
          .map(
            (order) => `
          <tr>
            <td>#${order.id}</td>
            <td>${order.createdAt ? formatDate(order.createdAt) : '—'}</td>
            <td>${(order.items || order.orderLines || []).length}</td>
            <td><strong>${formatCurrency(order.totalPrice || 0)}</strong></td>
            <td>
              <span class="badge ${getStatusBadgeClass(order.paymentStatus)}">
                ${order.paymentStatus || 'PENDING'}
              </span>
            </td>
            <td>
              <select class="form-select status-select" data-order-id="${order.id}" style="width: auto; display: inline-block;">
                ${PAYMENT_STATUSES.map(
                  (s) => `<option value="${s}" ${s === order.paymentStatus ? 'selected' : ''}>${s}</option>`
                ).join('')}
              </select>
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  // Event listeners para cambio de status
  tableContainer.querySelectorAll('.status-select').forEach((select) => {
    select.addEventListener('change', async () => {
      const orderId = parseInt(select.dataset.orderId, 10);
      const newStatus = select.value;

      if (!confirm(`¿Cambiar el estado de la orden #${orderId} a "${newStatus}"?`)) {
        // Restaurar valor anterior
        select.value = select.getAttribute('data-previous') || select.value;
        return;
      }

      try {
        await ordersApi.updateOrderStatus(orderId, newStatus);
        showToast(`Orden #${orderId} actualizada a "${newStatus}".`, 'success');
        // Refrescar
        await loadOrders();
      } catch (error) {
        showToast(error.message || 'Error al actualizar estado.', 'error');
        await loadOrders();
      }
    });

    // Guardar valor anterior para poder restaurar si cancelan confirm
    select.addEventListener('focus', function () {
      this.setAttribute('data-previous', this.value);
    });
  });
}

/**
 * Carga órdenes.
 */
async function loadOrders() {
  loadingEl.classList.remove('hidden');
  tableContainer.innerHTML = '';

  try {
    const orders = await ordersApi.getAllOrders();
    renderTable(orders);
  } catch (error) {
    tableContainer.innerHTML = `
      <div class="empty-state">
        <p style="color: var(--color-error);">${error.message || 'Error al cargar órdenes.'}</p>
      </div>
    `;
  } finally {
    loadingEl.classList.add('hidden');
  }
}

// Inicialización
loadOrders();
