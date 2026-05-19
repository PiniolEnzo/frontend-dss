/**
 * Diagon Alley E-commerce — Admin Sidebar Component
 *
 * Inyecta la barra de navegación lateral para las páginas de administración.
 * Resalta la página activa según la URL actual.
 *
 * Uso:
 *   import { renderAdminSidebar } from '../../components/adminSidebar.js';
 *   renderAdminSidebar();
 */

import * as authService from '../services/authService.js';
import { Icons } from '../utils/icons.js';

/**
 * Renderiza la sidebar de administración en el contenedor #admin-sidebar.
 */
export function renderAdminSidebar() {
  const container = document.getElementById('admin-sidebar');
  if (!container) return;

  const currentPath = window.location.pathname;

   const links = [
     { href: '/admin/dashboard.html', label: 'Dashboard', icon: Icons.dashboard },
     { href: '/admin/products.html', label: 'Productos', icon: Icons.products },
     { href: '/admin/categories.html', label: 'Categorías', icon: Icons.categories },
     { href: '/admin/orders.html', label: 'Órdenes', icon: Icons.orders },
     { href: '/admin/users.html', label: 'Usuarios', icon: Icons.users },
   ];


  container.innerHTML = `
    <aside class="admin-sidebar">
      <div class="admin-sidebar-header">
        <a href="/admin/dashboard.html" class="admin-sidebar-logo">
          <span class="admin-sidebar-logo-icon">${Icons.magicWand}</span>
          Diagon Alley Admin
        </a>
      </div>
      <nav class="admin-sidebar-nav">
        ${links
          .map(
            (link) => `
          <a href="${link.href}" class="admin-sidebar-link ${currentPath === link.href ? 'admin-sidebar-link--active' : ''}">
            <span class="admin-sidebar-link-icon">${link.icon}</span>
            ${link.label}
          </a>
        `
          )
          .join('')}
      </nav>
       <div class="admin-sidebar-footer">
           <a href="/admin/profile.html" class="admin-sidebar-link">
           <span class="admin-sidebar-link-icon">${Icons.profile}</span>
           Perfil
         </a>
         <button class="admin-sidebar-link admin-sidebar-link--logout" id="admin-btn-logout">
           <span class="admin-sidebar-link-icon">${Icons.logout}</span>
           Cerrar sesión
         </button>
       </div>

    </aside>
  `;

  // Botón hamburguesa para mobile
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'admin-sidebar-toggle';
  toggleBtn.setAttribute('aria-label', 'Toggle sidebar');
   toggleBtn.innerHTML = Icons.menu;

  toggleBtn.addEventListener('click', () => {
    document.querySelector('.admin-sidebar').classList.toggle('admin-sidebar--open');
  });
  document.querySelector('.admin-layout').prepend(toggleBtn);

  // Logout
  const logoutBtn = document.getElementById('admin-btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await authService.logout();
      window.location.replace('/index.html');
    });
  }
}
