/**
 * Diagon Alley E-commerce — Product Detail Page
 *
 * Muestra el detalle completo de un producto.
 * Usuario autenticado puede agregar al carrito.
 */

import { requireUser } from '../guards/authGuard.js';
requireUser();


import * as productsApi from '../api/products.js';
import * as cartService from '../services/cartService.js';
import { formatCurrency, getImageUrl, sanitizeHtml, getProductIdFromUrl } from '../utils/helpers.js';
import { showToast } from '../components/toast.js';
import { renderNavbar } from '../components/navbar.js';
import { Icons } from '../utils/icons.js';

renderNavbar();

const container = document.getElementById('product-detail-container');
const loadingEl = document.getElementById('loading-detail');

/**
 * Renderiza el detalle del producto.
 * @param {Object} product
 */
function renderProduct(product) {
  container.innerHTML = `
    <div class="product-detail-image">
      <img src="${sanitizeHtml(getImageUrl(product.imageUrl))}" alt="${sanitizeHtml(product.name)}" />
    </div>
    <div class="product-detail-info">
      <h1 class="product-detail-name">${sanitizeHtml(product.name)}</h1>
      <p class="product-detail-price">${formatCurrency(product.price)}</p>
      <p class="product-detail-description">${sanitizeHtml(product.description || 'Sin descripción disponible.')}</p>
      <div class="product-detail-meta">
        ${product.categoryName ? `
          <span class="product-detail-meta-item">
            <strong>Categoría:</strong> ${sanitizeHtml(product.categoryName)}
          </span>
        ` : ''}
        <span class="product-detail-meta-item">
          <strong>Stock:</strong>
          <span class="${product.stock > 0 ? 'product-card-stock--available' : 'product-card-stock--out'}">
            ${product.stock > 0 ? `${product.stock} unidades disponibles` : 'Sin stock'}
          </span>
        </span>
      </div>
      <div style="margin-top: var(--space-6);">
        <button class="btn btn-primary btn-lg" id="btn-add-cart-detail" data-product-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>
          ${product.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
        </button>
        <a href="/products.html" class="btn btn-secondary btn-lg" style="margin-left: var(--space-3);">Volver</a>
      </div>
    </div>
  `;

  // Event listener: agregar al carrito
  const addBtn = document.getElementById('btn-add-cart-detail');
  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      const productId = parseInt(addBtn.dataset.productId, 10);

      addBtn.disabled = true;
      addBtn.textContent = 'Agregando…';

      try {
        await cartService.addItem(productId);
        showToast(`${product.name} agregado al carrito`, 'success');
        renderNavbar();
      } catch (error) {
        if (error.status === 401) {
          window.location.replace('/login.html?expired=true');
        } else {
          showToast(error.message || 'Error al agregar al carrito', 'error');
        }
      } finally {
        addBtn.disabled = false;
        addBtn.textContent = 'Agregar al carrito';
      }
    });
  }
}

/**
 * Carga el producto.
 */
async function loadProduct() {
  const productId = getProductIdFromUrl();

  if (!productId) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">${Icons.warning}</div>
        <h3 class="empty-state-title">Producto no encontrado</h3>
        <p class="empty-state-text">No se especificó un ID de producto válido.</p>
        <a href="/products.html" class="btn btn-primary">Ver productos</a>
      </div>
    `;
    loadingEl.classList.add('hidden');
    return;
  }

  loadingEl.classList.remove('hidden');
  container.innerHTML = '';

  try {
    const product = await productsApi.getProduct(productId);
    renderProduct(product);
  } catch (error) {
    if (error.status === 404) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">${Icons.search}</div>
          <h3 class="empty-state-title">Producto no encontrado</h3>
          <p class="empty-state-text">El producto que buscás no existe o fue eliminado.</p>
          <a href="/products.html" class="btn btn-primary">Ver productos</a>
        </div>
      `;
    } else if (error.status === 401) {
      window.location.replace('/login.html?expired=true');
    } else {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">${Icons.warning}</div>
          <h3 class="empty-state-title">Error al cargar producto</h3>
          <p class="empty-state-text">${error.message || 'Intentá de nuevo más tarde.'}</p>
          <a href="/products.html" class="btn btn-primary">Ver productos</a>
        </div>
      `;
    }
  } finally {
    loadingEl.classList.add('hidden');
  }
}

// Inicialización
loadProduct();
