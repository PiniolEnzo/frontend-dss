/**
 * Diagon Alley E-commerce — Navbar Component
 *
 * Inyecta la barra de navegación según el estado de autenticación.
 * Tres variantes: pública, USER, ADMIN.
 * Se llama desde cada página en DOMContentLoaded.
 *
 * Uso:
 *   import { renderNavbar } from '../components/navbar.js';
 *   renderNavbar();
 */

import * as authService from '../services/authService.js';
import { ROLES } from '../config/constants.js';
import { getMyCart } from '../api/cart.js';
import { Icons } from '../utils/icons.js';

/**
 * Renderiza la navbar en el contenedor #navbar-container.
 * Inyecta el HTML completo y conecta los event listeners.
 */
export async function renderNavbar() {
  const container = document.getElementById('navbar-container');
  if (!container) return;

  const isLoggedIn = authService.isLoggedIn();
  const role = authService.getRole();

  let linksHtml = '';

  if (!isLoggedIn) {
    // === NAVBAR PÚBLICA ===
    linksHtml = `
      <a href="/index.html" class="navbar-link ${isActive('/index.html') || isActive('/') ? 'navbar-link-active' : ''}">Inicio</a>
      <a href="/index.html#productos" class="navbar-link">Productos</a>
      <a href="/login.html" class="navbar-link ${isActive('/login.html') ? 'navbar-link-active' : ''}">Iniciar sesión</a>
      <a href="/register.html" class="btn btn-primary btn-sm">Registrarse</a>
    `;
  } else if (role === ROLES.ADMIN) {
    // === NAVBAR ADMIN (navbar simple + sidebar en admin) ===
    linksHtml = `
      <a href="/index.html" class="navbar-link ${isActive('/index.html') ? 'navbar-link-active' : ''}">Inicio</a>
      <a href="/admin/dashboard.html" class="navbar-link ${isActive('/admin/') ? 'navbar-link-active' : ''}">Admin Panel</a>
      <a href="/products.html" class="navbar-link ${isActive('/products.html') ? 'navbar-link-active' : ''}">Productos</a>
      <a href="/profile.html" class="navbar-link ${isActive('/profile.html') ? 'navbar-link-active' : ''}">Perfil</a>
      <button class="btn btn-secondary btn-sm" id="btn-logout">Cerrar sesión</button>
    `;
  } else {
    // === NAVBAR USER ===
    let cartBadge = '';
    try {
      const cart = await getMyCart();
      const itemCount = cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
      if (itemCount > 0) {
        cartBadge = `<span class="navbar-cart-badge">${itemCount > 99 ? '99+' : itemCount}</span>`;
      }
    } catch {
      // Ignorar errores al cargar el badge
    }

    linksHtml = `
      <a href="/index.html" class="navbar-link ${isActive('/index.html') ? 'navbar-link-active' : ''}">Inicio</a>
      <a href="/products.html" class="navbar-link ${isActive('/products.html') ? 'navbar-link-active' : ''}">Productos</a>
      <a href="/cart.html" class="navbar-link ${isActive('/cart.html') ? 'navbar-link-active' : ''}">
        Carrito${cartBadge}
      </a>
      <a href="/orders.html" class="navbar-link ${isActive('/orders.html') ? 'navbar-link-active' : ''}">Mis órdenes</a>
      <a href="/profile.html" class="navbar-link ${isActive('/profile.html') ? 'navbar-link-active' : ''}">Perfil</a>
      <button class="btn btn-secondary btn-sm" id="btn-logout">Cerrar sesión</button>
    `;
  }

  container.innerHTML = `
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="/index.html" class="navbar-logo">
          <span class="navbar-logo-icon">${Icons.magicWand}</span>
          Diagon Alley
        </a>
        <div class="navbar-links">
          ${linksHtml}
        </div>
        <button class="navbar-toggle" id="navbar-toggle" aria-label="Menú">${Icons.menu}</button>
      </div>
    </nav>
  `;

  // === EVENT LISTENERS ===
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await authService.logout();
      window.location.replace('/index.html');
    });
  }

  // Mobile toggle
  const toggleBtn = document.getElementById('navbar-toggle');
  const linksContainer = container.querySelector('.navbar-links');
  if (toggleBtn && linksContainer) {
    toggleBtn.addEventListener('click', () => {
      linksContainer.classList.toggle('navbar-links-open');
    });
  }
}

/**
 * Determina si la URL actual coincide con un path.
 * @param {string} path
 * @returns {boolean}
 */
function isActive(path) {
  const current = window.location.pathname;
  if (path === '/') return current === '/' || current === '/index.html';
  return current === path;
}
