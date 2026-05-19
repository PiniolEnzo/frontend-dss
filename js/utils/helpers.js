/**
 * Diagon Alley E-commerce — Utilidades compartidas
 *
 * Funciones de formateo y sanitización usadas en todas las páginas.
 */

/**
 * Formatea un número como moneda argentina (pesos).
 * @param {number} amount
 * @returns {string} Ej: "$ 1.250,00"
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '$ 0,00';
  return '$ ' + Number(amount).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formatea una fecha ISO a formato legible argentino.
 * @param {string} isoString — Ej: "2025-03-15T10:30:00"
 * @returns {string} Ej: "15/03/2025 10:30"
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Capitaliza la primera letra de un string.
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Trunca un texto a una longitud máxima, agregando "…" si fue truncado.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength = 100) {
  if (!str || str.length <= maxLength) return str || '';
  return str.slice(0, maxLength) + '…';
}

/**
 * Sanitiza un string para evitar HTML injection en innerHTML.
 * @param {string} str
 * @returns {string}
 */
export function sanitizeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Devuelve una URL de imagen válida, con fallback a placeholder.
 * @param {string} url
 * @returns {string}
 */
export function getImageUrl(url) {
  if (!url || url.trim() === '') {
    return 'https://placehold.co/300x300/e2e8f0/64748b?text=Sin+imagen';
  }
  return url;
}

/**
 * Pluraliza una palabra según el count.
 * @param {number} count
 * @param {string} singular
 * @param {string} [plural]
 * @returns {string}
 */
export function pluralize(count, singular, plural) {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || singular + 's'}`;
}

/**
 * Extrae el ID de un producto desde la URL (query param "id").
 * @returns {number|null}
 */
export function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  return id ? parseInt(id, 10) : null;
}

/**
 * Extrae el token de reset desde la URL (query param "token").
 * @returns {string|null}
 */
export function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

/**
 * Extrae el orderId desde la URL (query param "orderId").
 * @returns {number|null}
 */
export function getOrderIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('orderId');
  return id ? parseInt(id, 10) : null;
}
