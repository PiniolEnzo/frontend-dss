/**
 * Diagon Alley E-commerce — Register Page
 *
 * Formulario de registro con validación client-side completa.
 * Refleja exactamente las reglas del backend Jakarta Validation.
 *
 * Flujo:
 *   1. Si ya hay sesión → redirigir
 *   2. Validar campos en frontend (evitar 400s innecesarios)
 *   3. POST /auth/register
 *   4. En éxito → redirect a login con mensaje
 *   5. En error 400 → mostrar field errors del backend
 */

import { redirectIfAuthenticated } from '../guards/authGuard.js';
import * as authApi from '../api/auth.js';
import { isValidName, isValidEmail, isValidPassword, doPasswordsMatch } from '../utils/validators.js';
import { showFormErrors } from '../services/errorHandler.js';
import { renderNavbar } from '../components/navbar.js';

redirectIfAuthenticated();
renderNavbar();

const form = document.getElementById('register-form');
const submitBtn = document.getElementById('btn-submit');
const errorContainer = document.getElementById('auth-error');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirmPassword');

// Live password requirements check
passwordInput.addEventListener('input', () => {
  const val = passwordInput.value;
  updateRequirement('req-length', val.length >= 10 && val.length <= 25);
  updateRequirement('req-uppercase', /[A-Z]/.test(val));
  updateRequirement('req-lowercase', /[a-z]/.test(val));
  updateRequirement('req-digit', /\d/.test(val));
  updateRequirement('req-special', /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val));
});

function updateRequirement(id, met) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('met', met);
  el.querySelector('.password-requirement-icon').textContent = met ? '✓' : '○';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Limpiar errores previos
  errorContainer.classList.add('hidden');
  form.querySelectorAll('.field-error').forEach((el) => el.remove());
  form.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;

  // Validación frontend
  const errors = {};

  const nameResult = isValidName(name);
  if (!nameResult.valid) errors.name = nameResult.message;

  const emailResult = isValidEmail(email);
  if (!emailResult.valid) errors.email = emailResult.message;

  const passwordResult = isValidPassword(password);
  if (!passwordResult.valid) errors.password = passwordResult.message;

  const matchResult = doPasswordsMatch(password, confirmPassword);
  if (!matchResult.valid) errors.confirmPassword = matchResult.message;

  if (Object.keys(errors).length > 0) {
    showFormErrors(errors, form);
    return;
  }

  // Estado loading
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creando cuenta…';

  try {
    await authApi.register(name, email, password);
    // Registro exitoso → redirect a login
    window.location.replace('/login.html?registered=true');
  } catch (error) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Crear cuenta';

    if (error.status === 400) {
      if (error.fieldErrors) {
        showFormErrors(error.fieldErrors, form);
      } else {
        errorContainer.textContent = error.message || 'Error en los datos ingresados.';
        errorContainer.classList.remove('hidden');
      }
    } else {
      errorContainer.textContent = error.message || 'Error al crear la cuenta. Intentá de nuevo.';
      errorContainer.classList.remove('hidden');
    }
  }
});
