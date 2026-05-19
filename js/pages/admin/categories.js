/**
 * Diagon Alley E-commerce — Admin Categories
 *
 * ABM de categorías con tabla y modal.
 */

import { requireAdmin } from '../../guards/authGuard.js';
requireAdmin();

import * as categoriesApi from '../../api/categories.js';
import { sanitizeHtml } from '../../utils/helpers.js';
import { isValidCategoryName } from '../../utils/validators.js';
import { showFormErrors, showToast } from '../../services/errorHandler.js';
import { renderAdminSidebar } from '../../components/adminSidebar.js';
import { Icons } from '../../utils/icons.js';

renderAdminSidebar();

// Estado
let allCategories = [];
let editingCategoryId = null;

// Elementos DOM
const tableContainer = document.getElementById('categories-table-container');
const loadingEl = document.getElementById('loading-categories');
const modal = document.getElementById('category-modal');
const modalTitle = document.getElementById('modal-title');
const categoryForm = document.getElementById('category-form');
const saveBtn = document.getElementById('modal-save');
const cancelBtn = document.getElementById('modal-cancel');
const closeBtn = document.getElementById('modal-close');
const newBtn = document.getElementById('btn-new-category');

/**
 * Renderiza la tabla de categorías.
 */
function renderTable() {
  if (!allCategories || allCategories.length === 0) {
    tableContainer.innerHTML = `
       <div class="empty-state">
         <div class="empty-state-icon">${Icons.categories}</div>
         <h3 class="empty-state-title">No hay categorías</h3>
         <p class="empty-state-text">Creá tu primera categoría para organizar los productos.</p>
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
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${allCategories
          .map(
            (c) => `
          <tr>
            <td>${c.id}</td>
            <td><strong>${sanitizeHtml(c.name)}</strong></td>
            <td>
              <div class="admin-table-actions">
                <button class="btn btn-secondary btn-sm btn-edit" data-id="${c.id}">Editar</button>
                <button class="btn btn-danger btn-sm btn-delete" data-id="${c.id}">Eliminar</button>
              </div>
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  tableContainer.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id, 10)));
  });
  tableContainer.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', () => handleDelete(parseInt(btn.dataset.id, 10)));
  });
}

/**
 * Abre el modal para crear.
 */
function openCreateModal() {
  editingCategoryId = null;
  modalTitle.textContent = 'Nueva categoría';
  categoryForm.reset();
  saveBtn.textContent = 'Crear categoría';
  modal.classList.remove('hidden');
}

/**
 * Abre el modal para editar.
 * @param {number} id
 */
function openEditModal(id) {
  const cat = allCategories.find((c) => c.id === id);
  if (!cat) return;

  editingCategoryId = id;
  modalTitle.textContent = 'Editar categoría';
  document.getElementById('c-name').value = cat.name || '';
  saveBtn.textContent = 'Guardar cambios';
  modal.classList.remove('hidden');
}

/**
 * Cierra el modal.
 */
function closeModal() {
  modal.classList.add('hidden');
  categoryForm.querySelectorAll('.field-error').forEach((el) => el.remove());
  categoryForm.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));
}

/**
 * Maneja el submit.
 */
async function handleSave() {
  categoryForm.querySelectorAll('.field-error').forEach((el) => el.remove());
  categoryForm.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));

  const name = categoryForm.name.value.trim();

  const nameResult = isValidCategoryName(name);
  if (!nameResult.valid) {
    showFormErrors({ name: nameResult.message }, categoryForm);
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Guardando…';

  try {
    if (editingCategoryId) {
      await categoriesApi.updateCategory(editingCategoryId, name);
      showToast('Categoría actualizada.', 'success');
    } else {
      await categoriesApi.createCategory(name);
      showToast('Categoría creada.', 'success');
    }
    closeModal();
    await loadCategories();
  } catch (error) {
    if (error.status === 400 && error.fieldErrors) {
      showFormErrors(error.fieldErrors, categoryForm);
    } else {
      showToast(error.message || 'Error al guardar categoría.', 'error');
    }
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = editingCategoryId ? 'Guardar cambios' : 'Crear categoría';
  }
}

/**
 * Maneja eliminación.
 * @param {number} id
 */
async function handleDelete(id) {
  const cat = allCategories.find((c) => c.id === id);
  const warning = cat?.name
    ? `¿Eliminar "${cat.name}"?\n\nLos productos asociados perderán su categoría.`
    : '¿Eliminar esta categoría?';

  if (!confirm(warning)) return;

  try {
    await categoriesApi.deleteCategory(id);
    showToast('Categoría eliminada.', 'success');
    await loadCategories();
  } catch (error) {
    showToast(error.message || 'Error al eliminar categoría.', 'error');
  }
}

/**
 * Carga categorías.
 */
async function loadCategories() {
  loadingEl.classList.remove('hidden');
  tableContainer.innerHTML = '';

  try {
    // Primero intentar con el endpoint admin
    allCategories = await categoriesApi.getCategoriesAll();
  } catch (error) {
    console.warn('[Admin Categories] Error con /categories/all, probando /categories público:', error);
    // Fallback: si el admin endpoint da 403, probar el público
    try {
      allCategories = await categoriesApi.getCategories();
      showToast(
        'No se pudo cargar el listado completo de categorías. ' +
        'Verificá que tu sesión tenga permisos de administrador.',
        'warning'
      );
    } catch (fallbackError) {
      console.error('[Admin Categories] Fallback también falló:', fallbackError);
      tableContainer.innerHTML = `
        <div class="empty-state">
          <p style="color: var(--color-error);">Error al cargar categorías: ${fallbackError.message || 'Error desconocido'}</p>
        </div>
      `;
      return;
    }
  } finally {
    loadingEl.classList.add('hidden');
  }

  renderTable();
}

// Inicialización
try {
  newBtn.addEventListener('click', openCreateModal);
  saveBtn.addEventListener('click', handleSave);
  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  await loadCategories();
} catch (err) {
  console.error('[Admin Categories] Init error:', err);
  tableContainer.innerHTML = `
    <div class="empty-state">
      <p style="color: var(--color-error);">Error al inicializar: ${err.message}</p>
    </div>
  `;
}
