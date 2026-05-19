/**
 * Diagon Alley E-commerce — Manejador global de errores
 *
 * Centraliza la notificación al usuario: toasts, errores de formulario,
 * alerts de estado. Cada página importa este servicio para mostrar
 * mensajes de manera consistente.
 *
 * Dependencias: utils/helpers.js (sanitizeHtml)
 */

import { sanitizeHtml } from '../utils/helpers.js';
import { TOAST_DURATION_MS } from '../config/constants.js';

/**
 * Muestra errores de validación en un formulario.
 * Busca inputs por su `name` attribute y muestra el error debajo.
 *
 * @param {Object<string, string>} errors — { fieldName: "mensaje de error" }
 * @param {HTMLElement} formElement — El formulario contenedor
 */
export function showFormErrors(errors, formElement) {
  // Limpiar errores anteriores
  formElement.querySelectorAll('.field-error').forEach((el) => el.remove());
  formElement.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));

  if (!errors || Object.keys(errors).length === 0) return;

  let firstErrorInput = null;

  Object.entries(errors).forEach(([fieldName, message]) => {
    const input = formElement.querySelector(`[name="${fieldName}"]`);
    if (input) {
      input.classList.add('input-error');
      const errorEl = document.createElement('span');
      errorEl.className = 'field-error';
      errorEl.textContent = sanitizeHtml(message);
      input.parentNode.insertBefore(errorEl, input.nextSibling);

      if (!firstErrorInput) firstErrorInput = input;
    }
  });

  // Scroll al primer error
  if (firstErrorInput) {
    firstErrorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstErrorInput.focus();
  }
}

/**
 * Muestra un toast notification en la esquina superior derecha.
 *
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) {
    // Crear el contenedor si no existe
    const newContainer = document.createElement('div');
    newContainer.id = 'toast-container';
    newContainer.className = 'toast-container';
    document.body.appendChild(newContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = sanitizeHtml(message);

  const containerEl = document.getElementById('toast-container');
  containerEl.appendChild(toast);

  // Auto-dismiss
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, TOAST_DURATION_MS);
}

/**
 * Muestra un mensaje de error crítico que bloquea la interfaz (modal-type).
 * @param {string} message
 */
export function showAlert(message) {
  showToast(message, 'error');
}

/**
 * Maneja un error tipado de API y muestra el mensaje apropiado.
 * @param {Object} error — Objeto ApiError de client.js
 */
export function handleApiError(error) {
  if (!error) return;

  switch (error.status) {
    case 401:
      showToast('Tu sesión expiró. Iniciá sesión de nuevo.', 'error');
      break;
    case 403:
      showToast('No tenés permisos para realizar esta acción.', 'error');
      break;
    case 404:
      showToast(error.message || 'Recurso no encontrado.', 'error');
      break;
    case 409:
      showToast(error.message || 'Conflicto: el recurso ya existe o hay stock insuficiente.', 'warning');
      break;
    case 422:
      showToast(error.message || 'El carrito está vacío. Agregá productos antes de finalizar la compra.', 'warning');
      break;
    case 500:
      showToast('Error del servidor. Intentá de nuevo más tarde.', 'error');
      break;
    default:
      showToast(error.message || 'Ocurrió un error inesperado.', 'error');
      break;
  }
}

/**
 * Limpia todos los toasts visibles.
 */
export function clearToasts() {
  const container = document.getElementById('toast-container');
  if (container) {
    container.innerHTML = '';
  }
}
