/**
 * Diagon Alley E-commerce — Admin Users
 *
 * Tabla de usuarios con posibilidad de eliminar (hard delete).
 * El admin no puede eliminarse a sí mismo.
 */

import { requireAdmin } from '../../guards/authGuard.js';
requireAdmin();

import * as usersApi from '../../api/users.js';
import * as authService from '../../services/authService.js';
import { formatDate, sanitizeHtml } from '../../utils/helpers.js';
import { showToast } from '../../services/errorHandler.js';
import { renderAdminSidebar } from '../../components/adminSidebar.js';
import { Icons } from '../../utils/icons.js';

renderAdminSidebar();

const tableContainer = document.getElementById('users-table-container');
const loadingEl = document.getElementById('loading-users');

let currentUserId = null;

/**
 * Renderiza la tabla de usuarios.
 * @param {Array} users
 */
function renderTable(users) {
  if (!users || users.length === 0) {
    tableContainer.innerHTML = `
       <div class="empty-state">
         <div class="empty-state-icon">${Icons.users}</div>
         <h3 class="empty-state-title">No hay usuarios registrados</h3>
       </div>

    `;
    return;
  }

  tableContainer.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Email</th>
          <th>Rol</th>
          <th>Estado</th>
          <th>Registro</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${users
          .map(
            (user) => `
          <tr>
            <td>${user.id}</td>
            <td><strong>${sanitizeHtml(user.name)}</strong></td>
            <td>${sanitizeHtml(user.email)}</td>
            <td><span class="badge ${user.userRole === 'ROLE_ADMIN' ? 'badge-warning' : 'badge-info'}">${user.userRole || 'ROLE_USER'}</span></td>
            <td>
              <span class="badge ${user.active !== false ? 'badge-success' : 'badge-error'}">
                ${user.active !== false ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td>${user.createdAt ? formatDate(user.createdAt) : '—'}</td>
            <td>
              <div class="admin-table-actions">
                ${user.id === currentUserId
                  ? '<span class="text-sm text-muted"></span>'
                  : user.userRole === 'ROLE_ADMIN'
                    ? '<span class="text-sm text-muted"></span>'
                    : `<button class="btn btn-danger btn-sm btn-delete" data-id="${user.id}" data-name="${sanitizeHtml(user.name)}">Eliminar</button>`
                }
              </div>
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  tableContainer.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', () => handleDelete(parseInt(btn.dataset.id, 10), btn.dataset.name));
  });
}

/**
 * Maneja la eliminación de un usuario.
 * @param {number} id
 * @param {string} name
 */
async function handleDelete(id, name) {
  if (!confirm(`¿Eliminar PERMANENTEMENTE al usuario "${name}"?\n\nEsta acción es irreversible.`)) return;

  try {
    await usersApi.deleteUser(id);
    showToast(`Usuario "${name}" eliminado.`, 'success');
    await loadUsers();
  } catch (error) {
    showToast(error.message || 'Error al eliminar usuario.', 'error');
  }
}

/**
 * Carga usuarios.
 */
async function loadUsers() {
  loadingEl.classList.remove('hidden');
  tableContainer.innerHTML = '';

  // Obtener el ID del admin actual
  const auth = authService.getAuth();
  currentUserId = auth?.user?.id || null;

  try {
    const users = await usersApi.getUsers();
    renderTable(users);
  } catch (error) {
    tableContainer.innerHTML = `
      <div class="empty-state">
        <p style="color: var(--color-error);">${error.message || 'Error al cargar usuarios.'}</p>
      </div>
    `;
  } finally {
    loadingEl.classList.add('hidden');
  }
}

// Inicialización
loadUsers();
