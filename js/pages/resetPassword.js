/**
 * Diagon Alley E-commerce — Reset Password Page
 *
 * Flujo:
 *   1. Al cargar la página, validar token vía GET /auth/validate?token=...
 *   2. Si token inválido/expirado → mostrar error, ocultar formulario
 *   3. Si token válido → mostrar formulario
 *   4. On submit: validar contraseña, POST /auth/reset-password
 *   5. En éxito → redirect a login
 */

import { redirectIfAuthenticated } from '../guards/authGuard.js';
import * as authApi from '../api/auth.js';
import { isValidPassword, doPasswordsMatch } from '../utils/validators.js';
import { showFormErrors } from '../services/errorHandler.js';
import { renderNavbar } from '../components/navbar.js';
import { getTokenFromUrl } from '../utils/helpers.js';

redirectIfAuthenticated();
renderNavbar();

const token = getTokenFromUrl();
const errorContainer = document.getElementById('auth-error');
const contentContainer = document.getElementById('reset-content');
const form = document.getElementById('reset-form');
const submitBtn = document.getElementById('btn-submit');

/**
 * Validar token al cargar la página.
 */
async function validateToken() {
  if (!token) {
    contentContainer.innerHTML = `
      <div class="auth-success">
        <div class="auth-success-icon" style="color: var(--color-error);">✕</div>
        <h2>Enlace inválido</h2>
        <p>El enlace de recuperación no es válido o está incompleto.</p>
        <a href="/forgot-password.html" class="btn btn-primary">Solicitar nuevo enlace</a>
      </div>
    `;
    return;
  }

  try {
    await authApi.validateToken(token);
    // Token válido — el formulario ya está visible
  } catch (error) {
    if (error.status === 400) {
      contentContainer.innerHTML = `
        <div class="auth-success">
          <div class="auth-success-icon" style="color: var(--color-warning);">!</div>
          <h2>Enlace expirado o inválido</h2>
          <p>El enlace ha expirado o ya fue utilizado. Solicitá uno nuevo.</p>
          <a href="/forgot-password.html" class="btn btn-primary">Solicitar nuevo enlace</a>
        </div>
      `;
    } else {
      contentContainer.innerHTML = `
        <div class="auth-success">
          <div class="auth-success-icon" style="color: var(--color-error);">✕</div>
          <h2>Error de validación</h2>
          <p>Ocurrió un error al validar el enlace. Intentá de nuevo.</p>
          <a href="/forgot-password.html" class="btn btn-primary">Solicitar nuevo enlace</a>
        </div>
      `;
    }
  }
}

// Validar token al inicio
validateToken();

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  errorContainer.classList.add('hidden');
  form.querySelectorAll('.field-error').forEach((el) => el.remove());
  form.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));

  const newPassword = form.newPassword.value;
  const confirmPassword = form.confirmPassword.value;

  const errors = {};
  const passwordResult = isValidPassword(newPassword);
  if (!passwordResult.valid) errors.newPassword = passwordResult.message;

  const matchResult = doPasswordsMatch(newPassword, confirmPassword);
  if (!matchResult.valid) errors.confirmPassword = matchResult.message;

  if (Object.keys(errors).length > 0) {
    showFormErrors(errors, form);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Restableciendo…';

  try {
    await authApi.resetPassword(token, newPassword);

    contentContainer.innerHTML = `
      <div class="auth-success">
        <div class="auth-success-icon">✓</div>
        <h2>Contraseña restablecida</h2>
        <p>Tu contraseña se actualizó correctamente. Ya podés iniciar sesión con tu nueva contraseña.</p>
        <a href="/login.html" class="btn btn-primary">Iniciar sesión</a>
      </div>
    `;
  } catch (error) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Restablecer contraseña';

    if (error.status === 400) {
      if (error.fieldErrors) {
        showFormErrors(error.fieldErrors, form);
      } else {
        errorContainer.textContent = error.message || 'Error al restablecer la contraseña.';
        errorContainer.classList.remove('hidden');
      }
    } else {
      errorContainer.textContent = error.message || 'Error del servidor. Intentá de nuevo.';
      errorContainer.classList.remove('hidden');
    }
  }
});
