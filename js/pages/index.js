/**
 * Diagon Alley E-commerce — Index Page (Public Landing)
 *
 * Catálogo público de productos para usuarios NO autenticados.
 * Muestra solo: imagen, nombre, precio.
 * NO muestra: descripción, stock, botón de agregar al carrito.
 * NO permite clickear productos.
 *
 * Si el usuario está autenticado, muestra un botón "Ver catálogo completo"
 * que redirige a products.html.
 */

import { redirectIfAuthenticated } from '../guards/authGuard.js';
redirectIfAuthenticated();

import * as productsApi from '../api/products.js';
import * as categoriesApi from '../api/categories.js';
import * as authService from '../services/authService.js';
import { formatCurrency, getImageUrl, sanitizeHtml, truncate } from '../utils/helpers.js';
import { renderNavbar } from '../components/navbar.js';
import { Icons } from '../utils/icons.js';

renderNavbar();

// Estado
let currentCategoryId = '';
let allProducts = [];

// Elementos DOM
const productsGrid = document.getElementById('public-products-grid');
const loadingEl = document.getElementById('loading-products');
const categoryFilter = document.getElementById('category-filter');

/**
 * Renderiza los productos en grilla pública (solo imagen, nombre, precio).
 * @param {Array} products
 */
function renderPublicProducts(products) {
  if (!products || products.length === 0) {
    productsGrid.innerHTML = `
      <div class="empty-state">
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
      <div class="product-card product-card--public">
        <div class="product-card-image">
          <img src="${sanitizeHtml(getImageUrl(product.imageUrl))}" alt="${sanitizeHtml(product.name)}" loading="lazy" />
        </div>
        <div class="product-card-body">
          <h3 class="product-card-title">${sanitizeHtml(truncate(product.name, 50))}</h3>
          <p class="product-card-price">${formatCurrency(product.price)}</p>
        </div>
        <div class="product-card-footer">
          <span class="product-card-login-hint">Iniciá sesión para ver más detalles</span>
        </div>
      </div>
    `
    )
    .join('');
}

/**
 * Carga productos desde la API y renderiza.
 */
async function loadProducts() {
  loadingEl.classList.remove('hidden');
  productsGrid.innerHTML = '';

  try {
    const params = {};
    if (currentCategoryId) {
      params.categoryId = currentCategoryId;
    }
    allProducts = await productsApi.getProducts(currentCategoryId || null);
    renderPublicProducts(allProducts);
  } catch (error) {
    productsGrid.innerHTML = `
      <div class="empty-state">
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
    // Si fallan las categorías, el filtro muestra solo "Todas"
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
