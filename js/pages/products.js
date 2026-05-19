/**
 * Diagon Alley E-commerce — Products Page (Authenticated)
 *
 * Catálogo completo para usuarios autenticados.
 * Muestra: imagen, nombre, precio, descripción, stock, categoría.
 * Permite: clickear para ver detalle, agregar al carrito, filtrar por categoría.
 */

import { requireUser } from '../guards/authGuard.js';
requireUser();


import * as productsApi from '../api/products.js';
import * as categoriesApi from '../api/categories.js';
import * as cartService from '../services/cartService.js';
import { formatCurrency, getImageUrl, sanitizeHtml, truncate } from '../utils/helpers.js';
import { showToast } from '../components/toast.js';
import { renderNavbar } from '../components/navbar.js';
import { Icons } from '../utils/icons.js';

renderNavbar();

// Estado
let currentCategoryId = '';
let allProducts = [];

// Elementos DOM
const productsGrid = document.getElementById('products-grid');
const loadingEl = document.getElementById('loading-products');
const categoryFilter = document.getElementById('category-filter');

/**
 * Renderiza los productos con vista completa (autenticado).
 * @param {Array} products
 */
function renderProducts(products) {
  if (!products || products.length === 0) {
    productsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">${Icons.products}</div>
        <h3 class="empty-state-title">No hay productos</h3>
        <p class="empty-state-text">No encontramos productos en esta categoría.</p>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = products
    .map(
      (product) => `
      <div class="product-card product-card--clickable" data-product-id="${product.id}">
        <div class="product-card-image">
          <img src="${sanitizeHtml(getImageUrl(product.imageUrl))}" alt="${sanitizeHtml(product.name)}" loading="lazy" />
        </div>
        <div class="product-card-body">
          <h3 class="product-card-title">${sanitizeHtml(truncate(product.name, 50))}</h3>
          <p class="product-card-description">${sanitizeHtml(truncate(product.description || '', 80))}</p>
          <p class="product-card-price">${formatCurrency(product.price)}</p>
          <div class="product-card-meta">
            ${product.categoryName ? `<span class="product-card-category">${sanitizeHtml(product.categoryName)}</span>` : ''}
            <span class="product-card-stock ${getStockClass(product.stock)}">
              ${product.stock > 0 ? `${product.stock} en stock` : 'Sin stock'}
            </span>
          </div>
        </div>
        <div class="product-card-footer">
          <button class="btn btn-primary btn-sm btn-block btn-add-cart" data-product-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>
            ${product.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
          </button>
        </div>
      </div>
    `
    )
    .join('');

  // Event listeners para click en card → detalle
  document.querySelectorAll('.product-card--clickable').forEach((card) => {
    card.addEventListener('click', (e) => {
      // No navegar si clickeó el botón
      if (e.target.closest('.btn-add-cart')) return;
      const productId = card.dataset.productId;
      window.location.href = `/product-detail.html?id=${productId}`;
    });
  });

  // Event listeners para botones "Agregar al carrito"
  document.querySelectorAll('.btn-add-cart').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const productId = parseInt(btn.dataset.productId, 10);
      const productName = btn.closest('.product-card').querySelector('.product-card-title').textContent;

      btn.disabled = true;
      btn.textContent = 'Agregando…';

      try {
        await cartService.addItem(productId);
        showToast(`${productName} agregado al carrito`, 'success');
        // Actualizar badge del navbar
        renderNavbar();
      } catch (error) {
        if (error.status === 401) {
          window.location.replace('/login.html?expired=true');
        } else {
          showToast(error.message || 'Error al agregar al carrito', 'error');
        }
      } finally {
        btn.disabled = false;
        btn.textContent = 'Agregar al carrito';
      }
    });
  });
}

/**
 * Determina la clase CSS del stock.
 * @param {number} stock
 * @returns {string}
 */
function getStockClass(stock) {
  if (stock <= 0) return 'product-card-stock--out';
  if (stock < 5) return 'product-card-stock--low';
  return 'product-card-stock--available';
}

/**
 * Carga productos desde la API.
 */
async function loadProducts() {
  loadingEl.classList.remove('hidden');
  productsGrid.innerHTML = '';

  try {
    allProducts = await productsApi.getProducts(currentCategoryId || null);
    renderProducts(allProducts);
  } catch (error) {
    productsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">${Icons.warning}</div>
        <h3 class="empty-state-title">Error al cargar productos</h3>
        <p class="empty-state-text">${error.message || 'Intentá de nuevo más tarde.'}</p>
      </div>
    `;
  } finally {
    loadingEl.classList.add('hidden');
  }
}

/**
 * Carga categorías para el filtro.
 */
async function loadCategories() {
  try {
    const categories = await categoriesApi.getCategories();
    if (categories && categories.length > 0) {
      categoryFilter.innerHTML = `
        <option value="">Todas las categorías</option>
        ${categories
          .map(
            (cat) =>
              `<option value="${cat.id}">${sanitizeHtml(cat.name)}</option>`
          )
          .join('')}
      `;
    }
  } catch {
    // Filtro mínimo si fallan categorías
  }
}

// Category filter change
categoryFilter.addEventListener('change', (e) => {
  currentCategoryId = e.target.value;
  loadProducts();
});

// Inicialización
loadCategories();
loadProducts();
