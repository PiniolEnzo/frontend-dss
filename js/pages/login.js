/**
 * Diagon Alley E-commerce — Login Page
 *
 * Maneja el formulario de inicio de sesión.
 * Flujo:
 *   1. Si ya hay sesión activa, redirige según rol
 *   2. Valida campos client-side
 *   3. Llama authService.login()
 *   4. En éxito: redirige según rol (USER → products, ADMIN → admin/dashboard)
 *   5. En error: muestra mensaje claro
 */

import { redirectIfAuthenticated } from '../guards/authGuard.js';
import * as authService from '../services/authService.js';
import { isValidEmail, isValidPassword } from '../utils/validators.js';
import { showToast, showFormErrors } from '../services/errorHandler.js';
import { renderNavbar } from '../components/navbar.js';

// Si ya está logueado, redirigir
redirectIfAuthenticated();

// Renderizar navbar
renderNavbar();

const form = document.getElementById('login-form');
const submitBtn = document.getElementById('btn-submit');
const errorContainer = document.getElementById('auth-error');

// Check for expired session param
const params = new URLSearchParams(window.location.search);
if (params.get('expired') === 'true') {
  errorContainer.textContent = 'Tu sesión expiró. Iniciá sesión de nuevo.';
  errorContainer.classList.remove('hidden');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Limpiar errores previos
  errorContainer.classList.add('hidden');
  form.querySelectorAll('.field-error').forEach((el) => el.remove());
  form.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));

  const email = form.email.value.trim();
  const password = form.password.value;

  // Validación frontend
  const emailValidation = isValidEmail(email);
  if (!emailValidation.valid) {
    showFormErrors({ email: emailValidation.message }, form);
    return;
  }

  if (!password || password.length < 1) {
    showFormErrors({ password: 'La contraseña es obligatoria.' }, form);
    return;
  }

  // Estado loading
  submitBtn.disabled = true;
  submitBtn.textContent = 'Ingresando…';

  try {
    await authService.login(email, password);
    // Redirigir según rol
    const { redirectBasedOnRole } = await import('../guards/authGuard.js');
    redirectBasedOnRole();
  } catch (error) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Iniciar sesión';

    if (error.status === 401) {
      errorContainer.textContent = 'Email o contraseña incorrectos.';
      errorContainer.classList.remove('hidden');
    } else if (error.status === 400 && error.fieldErrors) {
      showFormErrors(error.fieldErrors, form);
    } else {
      errorContainer.textContent = error.message || 'Error al iniciar sesión. Intentá de nuevo.';
      errorContainer.classList.remove('hidden');
    }
  }
});
