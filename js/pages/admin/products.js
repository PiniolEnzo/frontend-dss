/**
 * Diagon Alley E-commerce — Admin Products
 *
 * CRUD de productos con tabla y modal.
 */

import { requireAdmin } from '../../guards/authGuard.js';
requireAdmin();

import * as productsApi from '../../api/products.js';
import * as categoriesApi from '../../api/categories.js';
import { formatCurrency, getImageUrl, sanitizeHtml } from '../../utils/helpers.js';
import { isValidProductName, isValidDescription, isValidPrice, isValidStock, isValidUrl } from '../../utils/validators.js';
import { showFormErrors, showToast, clearToasts } from '../../services/errorHandler.js';
import { renderAdminSidebar } from '../../components/adminSidebar.js';
import { Icons } from '../../utils/icons.js';

renderAdminSidebar();

// Estado
let allProducts = [];
let categories = [];
let editingProductId = null;

// Elementos DOM
const tableContainer = document.getElementById('products-table-container');
const loadingEl = document.getElementById('loading-products');
const modal = document.getElementById('product-modal');
const modalTitle = document.getElementById('modal-title');
const productForm = document.getElementById('product-form');
const saveBtn = document.getElementById('modal-save');
const cancelBtn = document.getElementById('modal-cancel');
const closeBtn = document.getElementById('modal-close');
const newBtn = document.getElementById('btn-new-product');
const categorySelect = document.getElementById('p-category');

/**
 * Renderiza la tabla de productos.
 */
function renderTable() {
  if (!allProducts || allProducts.length === 0) {
    tableContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${Icons.products}</div>
        <h3 class="empty-state-title">No hay productos</h3>
        <p class="empty-state-text">Creá tu primer producto para empezar.</p>
      </div>
    `;
    return;
  }

  tableContainer.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Imagen</th>
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Stock</th>
          <th>Precio</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${allProducts
          .map(
            (p) => `
          <tr>
            <td><img src="${sanitizeHtml(getImageUrl(p.imageUrl))}" alt="${sanitizeHtml(p.name)}" loading="lazy" /></td>
            <td><strong>${sanitizeHtml(p.name)}</strong></td>
            <td>${sanitizeHtml(p.categoryName || '—')}</td>
            <td>
              <span class="${p.stock <= 0 ? 'badge badge-error' : p.stock < 5 ? 'badge badge-warning' : 'badge badge-success'}">
                ${p.stock}
              </span>
            </td>
            <td><strong>${formatCurrency(p.price)}</strong></td>
            <td>
              <div class="admin-table-actions">
                <button class="btn btn-secondary btn-sm btn-edit" data-id="${p.id}">Editar</button>
                <button class="btn btn-danger btn-sm btn-delete" data-id="${p.id}">Eliminar</button>
              </div>
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  // Event listeners
  tableContainer.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id, 10)));
  });
  tableContainer.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', () => handleDelete(parseInt(btn.dataset.id, 10)));
  });
}

/**
 * Abre el modal para crear un producto.
 */
function openCreateModal() {
  editingProductId = null;
  modalTitle.textContent = 'Nuevo producto';
  productForm.reset();
  saveBtn.textContent = 'Crear producto';
  modal.classList.remove('hidden');
}

/**
 * Abre el modal para editar un producto.
 * @param {number} id
 */
function openEditModal(id) {
  const product = allProducts.find((p) => p.id === id);
  if (!product) return;

  editingProductId = id;
  modalTitle.textContent = 'Editar producto';
  document.getElementById('p-name').value = product.name || '';
  document.getElementById('p-description').value = product.description || '';
  document.getElementById('p-price').value = product.price || '';
  document.getElementById('p-stock').value = product.stock || '';
  document.getElementById('p-category').value = product.categoryId || '';
  document.getElementById('p-imageUrl').value = product.imageUrl || '';
  saveBtn.textContent = 'Guardar cambios';
  modal.classList.remove('hidden');
}

/**
 * Cierra el modal.
 */
function closeModal() {
  modal.classList.add('hidden');
  productForm.querySelectorAll('.field-error').forEach((el) => el.remove());
  productForm.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));
}

/**
 * Maneja el submit del formulario.
 */
async function handleSave() {
  // Limpiar errores
  productForm.querySelectorAll('.field-error').forEach((el) => el.remove());
  productForm.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));

  const data = {
    name: productForm.name.value.trim(),
    description: productForm.description.value.trim(),
    price: parseFloat(productForm.price.value),
    stock: parseInt(productForm.stock.value, 10),
    categoryId: parseInt(productForm.categoryId.value, 10),
    imageUrl: productForm.imageUrl.value.trim(),
  };

  // Validación
  const errors = {};
  const nameResult = isValidProductName(data.name);
  if (!nameResult.valid) errors.name = nameResult.message;

  const descResult = isValidDescription(data.description);
  if (!descResult.valid) errors.description = descResult.message;

  const priceResult = isValidPrice(data.price);
  if (!priceResult.valid) errors.price = priceResult.message;

  const stockResult = isValidStock(data.stock);
  if (!stockResult.valid) errors.stock = stockResult.message;

  if (!data.categoryId || isNaN(data.categoryId)) {
    errors.categoryId = 'Seleccioná una categoría.';
  }

  if (data.imageUrl) {
    const urlResult = isValidUrl(data.imageUrl);
    if (!urlResult.valid) errors.imageUrl = urlResult.message;
  }

  if (Object.keys(errors).length > 0) {
    showFormErrors(errors, productForm);
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Guardando…';

  try {
    if (editingProductId) {
      await productsApi.updateProduct(editingProductId, data);
      showToast('Producto actualizado correctamente.', 'success');
    } else {
      await productsApi.createProduct(data);
      showToast('Producto creado correctamente.', 'success');
    }
    closeModal();
    await loadProducts();
  } catch (error) {
    if (error.status === 400 && error.fieldErrors) {
      showFormErrors(error.fieldErrors, productForm);
    } else {
      showToast(error.message || 'Error al guardar producto.', 'error');
    }
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = editingProductId ? 'Guardar cambios' : 'Crear producto';
  }
}

/**
 * Maneja la eliminación de un producto.
 * @param {number} id
 */
async function handleDelete(id) {
  const product = allProducts.find((p) => p.id === id);
  if (!confirm(`¿Eliminar "${product?.name || id}" permanentemente?`)) return;

  try {
    await productsApi.deleteProduct(id);
    showToast('Producto eliminado.', 'success');
    await loadProducts();
  } catch (error) {
    showToast(error.message || 'Error al eliminar producto.', 'error');
  }
}

/**
 * Carga categorías para el selector del modal.
 */
async function loadCategories() {
  try {
    categories = await categoriesApi.getCategoriesAll();
    categorySelect.innerHTML = `
      <option value="">Seleccionar categoría</option>
      ${categories
        .map((c) => `<option value="${c.id}">${sanitizeHtml(c.name)}</option>`)
        .join('')}
    `;
  } catch {
    categorySelect.innerHTML = `<option value="">Error al cargar categorías</option>`;
    showToast(
      'No se pudieron cargar las categorías. Verificá que tu sesión tenga permisos de administrador.',
      'warning'
    );
  }
}

/**
 * Carga productos desde la API.
 */
async function loadProducts() {
  loadingEl.classList.remove('hidden');
  tableContainer.innerHTML = '';

  try {
    allProducts = await productsApi.getProducts();
    renderTable();
  } catch (error) {
    tableContainer.innerHTML = `
      <div class="empty-state">
        <p style="color: var(--color-error);">${error.message || 'Error al cargar productos.'}</p>
      </div>
    `;
  } finally {
    loadingEl.classList.add('hidden');
  }
}

// Event listeners
newBtn.addEventListener('click', openCreateModal);
saveBtn.addEventListener('click', handleSave);
cancelBtn.addEventListener('click', closeModal);
closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Inicialización
loadCategories();
loadProducts();
