/**
 * Diagon Alley E-commerce — Auth API
 *
 * Endpoints: POST /auth/* y GET /auth/*
 * Endpoints públicos: register, login, forgot-password, validate, reset-password
 * Endpoints autenticados: logout, me, change-password
 */

import { api } from './client.js';
import { API_PATHS } from '../config/constants.js';

/**
 * Inicia sesión.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{token: string}>}
 */
export function login(email, password) {
  return api.post(API_PATHS.AUTH.LOGIN, { email, password });
}

/**
 * Registra un nuevo usuario.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} — UserDto
 */
export function register(name, email, password) {
  return api.post(API_PATHS.AUTH.REGISTER, { name, email, password });
}

/**
 * Cierra sesión (invalida el token en backend).
 * @returns {Promise<null>} — 204 No Content
 */
export function logout() {
  return api.post(API_PATHS.AUTH.LOGOUT, null, { auth: true });
}

/**
 * Obtiene el perfil del usuario autenticado.
 * @returns {Promise<{id: number, name: string, email: string}>}
 */
export function getMe() {
  return api.get(API_PATHS.AUTH.ME, { auth: true });
}

/**
 * Solicita un email de recuperación de contraseña.
 * @param {string} email
 * @returns {Promise<{message: string}>}
 */
export function forgotPassword(email) {
  return api.post(API_PATHS.AUTH.FORGOT_PASSWORD, { email });
}

/**
 * Valida un token de reset de contraseña.
 * @param {string} token — UUID string
 * @returns {Promise<{message: string}>}
 */
export function validateToken(token) {
  return api.get(API_PATHS.AUTH.VALIDATE, { params: { token } });
}

/**
 * Resetea la contraseña con un token válido.
 * @param {string} token
 * @param {string} newPassword
 * @returns {Promise<{message: string}>}
 */
export function resetPassword(token, newPassword) {
  return api.post(API_PATHS.AUTH.RESET_PASSWORD, { token, newPassword });
}

/**
 * Cambia la contraseña del usuario autenticado.
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {Promise<{message: string}>}
 */
export function changePassword(oldPassword, newPassword) {
  return api.post(API_PATHS.AUTH.CHANGE_PASSWORD, { oldPassword, newPassword }, { auth: true });
}
