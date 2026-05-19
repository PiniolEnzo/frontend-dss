/**
 * Diagon Alley E-commerce — Toast Component
 *
 * Componente reutilizable de notificaciones toast.
 * Renderiza un toast en la esquina superior derecha y lo auto-destruye.
 *
 * Uso:
 *   import { showToast } from '../components/toast.js';
 *   showToast('Producto agregado', 'success');
 */

const TOAST_DURATION = 4000;

/**
 * Muestra un toast notification.
 *
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} [type='info']
 */
export function showToast(message, type = 'info') {
  const container = getOrCreateContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Auto-dismiss con animación
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, TOAST_DURATION);
}

/**
 * Obtiene o crea el contenedor de toasts.
 * @returns {HTMLElement}
 */
function getOrCreateContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}
