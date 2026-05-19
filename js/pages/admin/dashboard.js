/**
 * Diagon Alley E-commerce — Admin Dashboard
 *
 * Muestra estadísticas del sistema: usuarios, productos, órdenes, categorías.
 */

import { requireAdmin } from '../../guards/authGuard.js';
requireAdmin();

import * as productsApi from '../../api/products.js';
import * as categoriesApi from '../../api/categories.js';
import * as ordersApi from '../../api/orders.js';
import * as usersApi from '../../api/users.js';
import { renderAdminSidebar } from '../../components/adminSidebar.js';
import { Icons } from '../../utils/icons.js';

renderAdminSidebar();

const statsGrid = document.getElementById('stats-grid');
const loadingEl = document.getElementById('loading-dashboard');
const quickActionsEl = document.getElementById('quick-actions');

/**
 * Renderiza las cards de estadísticas.
 * @param {Object} stats
 */
function renderStats(stats) {
  const cards = [
    { label: 'Usuarios activos', value: stats.users, icon: Icons.users, color: 'primary' },
    { label: 'Productos', value: stats.products, icon: Icons.products, color: 'success' },
    { label: 'Órdenes totales', value: stats.orders, icon: Icons.orders, color: 'info' },
    { label: 'Órdenes pendientes', value: stats.pendingOrders, icon: Icons.hourglass, color: 'warning' },
    { label: 'Categorías', value: stats.categories, icon: Icons.categories, color: 'primary' },
  ];

  statsGrid.innerHTML = cards
    .map(
      (card) => `
      <div class="stat-card stat-card--${card.color}">
        <div class="stat-card-icon">${card.icon}</div>
        <div class="stat-card-label">${card.label}</div>
        <div class="stat-card-value">${card.value}</div>
      </div>
    `
    )
    .join('');
}

/**
 * Renderiza los accesos rápidos del dashboard.
 */
function renderQuickActions() {
  const actions = [
    { label: 'Gestionar productos', icon: Icons.products, href: '/admin/products.html' },
    { label: 'Gestionar categorías', icon: Icons.categories, href: '/admin/categories.html' },
    { label: 'Ver órdenes', icon: Icons.orders, href: '/admin/orders.html' },
    { label: 'Ver usuarios', icon: Icons.users, href: '/admin/users.html' },
  ];

  quickActionsEl.innerHTML = actions
    .map(
      (action) => `
      <a href="${action.href}" class="quick-action-card">
        <div class="quick-action-icon">${action.icon}</div>
        <div class="quick-action-label">${action.label}</div>
      </a>
    `
    )
    .join('');
}

/**
 * Carga todas las estadísticas.
 */
async function loadStats() {
  loadingEl.classList.remove('hidden');

  try {
    const [users, products, orders, categories] = await Promise.all([
      usersApi.getUsers().catch(() => []),
      productsApi.getProducts().catch(() => []),
      ordersApi.getAllOrders().catch(() => []),
      categoriesApi.getCategoriesAll().catch(() => []),
    ]);

    const stats = {
      users: Array.isArray(users) ? users.length : 0,
      products: Array.isArray(products) ? products.length : 0,
      orders: Array.isArray(orders) ? orders.length : 0,
      pendingOrders: Array.isArray(orders)
        ? orders.filter((o) => o.paymentStatus === 'PENDING').length
        : 0,
      categories: Array.isArray(categories) ? categories.length : 0,
    };

    renderStats(stats);
  } catch (error) {
    statsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <p style="color: var(--color-error);">Error al cargar estadísticas: ${error.message || 'Intentá de nuevo.'}</p>
      </div>
    `;
  } finally {
    loadingEl.classList.add('hidden');
  }
}

// Inicialización
renderQuickActions();
loadStats();