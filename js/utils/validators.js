/**
 * Diagon Alley E-commerce — Validadores del lado cliente
 *
 * Espeja EXACTAMENTE las reglas de validación del backend (Jakarta Validation)
 * para evitar 400s innecesarios y dar feedback instantáneo al usuario.
 *
 * Reglas backend (API_REFERENCE.md):
 * - name:      5-25 chars, letras + espacios, patrón /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/
 * - email:     máximo 60 chars, formato email estándar
 * - password:  10-25 chars, debe tener mayúscula, minúscula, dígito, especial
 * - category:  3-25 chars, letras + espacios
 * - product:   5-80 chars (name), 10-600 chars (description), price >= 0, stock >= 0
 */

import {
  PASSWORD_RULES,
  NAME_RULES,
  CATEGORY_NAME_RULES,
  PRODUCT_NAME_RULES,
} from '../config/constants.js';

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string|null} message
 */

/**
 * Valida un nombre de usuario.
 * @param {string} value
 * @returns {ValidationResult}
 */
export function isValidName(value) {
  if (!value || value.trim().length < NAME_RULES.MIN_LENGTH) {
    return { valid: false, message: `El nombre debe tener al menos ${NAME_RULES.MIN_LENGTH} caracteres.` };
  }
  if (value.trim().length > NAME_RULES.MAX_LENGTH) {
    return { valid: false, message: `El nombre debe tener máximo ${NAME_RULES.MAX_LENGTH} caracteres.` };
  }
  if (!NAME_RULES.PATTERN.test(value.trim())) {
    return { valid: false, message: 'El nombre solo puede contener letras y espacios.' };
  }
  return { valid: true, message: null };
}

/**
 * Valida un email.
 * @param {string} value
 * @returns {ValidationResult}
 */
export function isValidEmail(value) {
  if (!value || value.trim() === '') {
    return { valid: false, message: 'El email es obligatorio.' };
  }
  if (value.length > 60) {
    return { valid: false, message: 'El email debe tener máximo 60 caracteres.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value.trim())) {
    return { valid: false, message: 'Ingresá un email válido.' };
  }
  return { valid: true, message: null };
}

/**
 * Valida una contraseña según las reglas del backend.
 * @param {string} value
 * @returns {ValidationResult}
 */
export function isValidPassword(value) {
  if (!value || value.length < PASSWORD_RULES.MIN_LENGTH) {
    return { valid: false, message: `La contraseña debe tener al menos ${PASSWORD_RULES.MIN_LENGTH} caracteres.` };
  }
  if (value.length > PASSWORD_RULES.MAX_LENGTH) {
    return { valid: false, message: `La contraseña debe tener máximo ${PASSWORD_RULES.MAX_LENGTH} caracteres.` };
  }
  if (!PASSWORD_RULES.PATTERN.test(value)) {
    return {
      valid: false,
      message: 'La contraseña debe contener al menos una mayúscula, una minúscula, un dígito y un carácter especial.',
    };
  }
  return { valid: true, message: null };
}

/**
 * Valida que dos contraseñas coincidan.
 * @param {string} password
 * @param {string} confirm
 * @returns {ValidationResult}
 */
export function doPasswordsMatch(password, confirm) {
  if (password !== confirm) {
    return { valid: false, message: 'Las contraseñas no coinciden.' };
  }
  return { valid: true, message: null };
}

/**
 * Valida el nombre de una categoría.
 * @param {string} value
 * @returns {ValidationResult}
 */
export function isValidCategoryName(value) {
  if (!value || value.trim().length < CATEGORY_NAME_RULES.MIN_LENGTH) {
    return { valid: false, message: `El nombre debe tener al menos ${CATEGORY_NAME_RULES.MIN_LENGTH} caracteres.` };
  }
  if (value.trim().length > CATEGORY_NAME_RULES.MAX_LENGTH) {
    return { valid: false, message: `El nombre debe tener máximo ${CATEGORY_NAME_RULES.MAX_LENGTH} caracteres.` };
  }
  if (!CATEGORY_NAME_RULES.PATTERN.test(value.trim())) {
    return { valid: false, message: 'El nombre solo puede contener letras y espacios.' };
  }
  return { valid: true, message: null };
}

/**
 * Valida el nombre de un producto.
 * @param {string} value
 * @returns {ValidationResult}
 */
export function isValidProductName(value) {
  if (!value || value.trim().length < PRODUCT_NAME_RULES.MIN_LENGTH) {
    return { valid: false, message: `El nombre debe tener al menos ${PRODUCT_NAME_RULES.MIN_LENGTH} caracteres.` };
  }
  if (value.trim().length > PRODUCT_NAME_RULES.MAX_LENGTH) {
    return { valid: false, message: `El nombre debe tener máximo ${PRODUCT_NAME_RULES.MAX_LENGTH} caracteres.` };
  }
  return { valid: true, message: null };
}

/**
 * Valida la descripción de un producto.
 * @param {string} value
 * @returns {ValidationResult}
 */
export function isValidDescription(value) {
  if (!value || value.trim().length < 10) {
    return { valid: false, message: 'La descripción debe tener al menos 10 caracteres.' };
  }
  if (value.trim().length > 600) {
    return { valid: false, message: 'La descripción debe tener máximo 600 caracteres.' };
  }
  return { valid: true, message: null };
}

/**
 * Valida un precio.
 * @param {number|string} value
 * @returns {ValidationResult}
 */
export function isValidPrice(value) {
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) {
    return { valid: false, message: 'El precio debe ser un número mayor o igual a 0.' };
  }
  return { valid: true, message: null };
}

/**
 * Valida el stock.
 * @param {number|string} value
 * @returns {ValidationResult}
 */
export function isValidStock(value) {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 0) {
    return { valid: false, message: 'El stock debe ser un número entero mayor o igual a 0.' };
  }
  return { valid: true, message: null };
}

/**
 * Valida una cantidad de producto en el carrito (0 - 1.000.000).
 * @param {number|string} value
 * @returns {ValidationResult}
 */
export function isValidQuantity(value) {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 0) {
    return { valid: false, message: 'La cantidad debe ser un número entero mayor o igual a 0.' };
  }
  if (num > 1000000) {
    return { valid: false, message: 'La cantidad no puede superar 1.000.000.' };
  }
  return { valid: true, message: null };
}

/**
 * Valida una URL básica.
 * @param {string} value
 * @returns {ValidationResult}
 */
export function isValidUrl(value) {
  if (!value || value.trim() === '') {
    return { valid: true, message: null }; // Opcional
  }
  try {
    new URL(value.trim());
    return { valid: true, message: null };
  } catch {
    return { valid: false, message: 'Ingresá una URL válida (ej: https://ejemplo.com/imagen.jpg).' };
  }
}
