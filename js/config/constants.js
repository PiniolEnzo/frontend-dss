/**
 * Diagon Alley E-commerce — Configuración central
 *
 * Single source of truth para todas las constantes de la aplicación.
 * Ningún otro archivo debe hardcodear URLs, storage keys o roles.
 */

export const BASE_URL = "https://talento-tech-production.up.railway.app";

export const STORAGE_KEYS = {
  AUTH: 'techlab_auth',
  CART_ID: 'techlab_cart_id',
};

export const ROLES = {
  USER: 'ROLE_USER',
  ADMIN: 'ROLE_ADMIN',
};

export const API_PATHS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VALIDATE: '/auth/validate',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  PRODUCTS: {
    BASE: '/products',
  },
  CATEGORIES: {
    BASE: '/categories',
    ALL: '/categories/all',
  },
  CARTS: {
    MINE: '/carts/mine',
    BASE: '/carts',
  },
  ORDERS: {
    CHECKOUT: '/orders/checkout',
    MY_ORDERS: '/orders/my-orders',
    BASE: '/orders',
  },
  USERS: {
    BASE: '/users',
  },
};

export const PAYMENT_STATUSES = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'CANCELED',
  'FAILED',
  'REFUNDED',
];

export const PASSWORD_RULES = {
  MIN_LENGTH: 10,
  MAX_LENGTH: 25,
  // Caracteres especiales: !@#$%^&*()_+-=[]{};':"\|,.<>/?`~
  PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]).{10,25}$/,
};

export const NAME_RULES = {
  MIN_LENGTH: 5,
  MAX_LENGTH: 25,
  PATTERN: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/,
};

export const CATEGORY_NAME_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 25,
  PATTERN: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/,
};

export const PRODUCT_NAME_RULES = {
  MIN_LENGTH: 5,
  MAX_LENGTH: 80,
};

export const TOAST_DURATION_MS = 4000;
