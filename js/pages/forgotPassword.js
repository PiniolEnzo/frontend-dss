/**
 * Diagon Alley E-commerce — Forgot Password Page
 *
 * Solicita un email de recuperación de contraseña.
 * Siempre muestra el mismo mensaje de éxito (previene email enumeration).
 */

import { redirectIfAuthenticated } from '../guards/authGuard.js';
import * as authApi from '../api/auth.js';
import { isValidEmail } from '../utils/validators.js';
import { showFormErrors } from '../services/errorHandler.js';
import { renderNavbar } from '../components/navbar.js';

redirectIfAuthenticated();
renderNavbar();

const form = document.getElementById('forgot-form');
const submitBtn = document.getElementById('btn-submit');
const errorContainer = document.getElementById('auth-error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  errorContainer.classList.add('hidden');
  form.querySelectorAll('.field-error').forEach((el) => el.remove());
  form.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));

  const email = form.email.value.trim();
  const emailResult = isValidEmail(email);

  if (!emailResult.valid) {
    showFormErrors({ email: emailResult.message }, form);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando…';

  try {
    await authApi.forgotPassword(email);

    // Mostrar success — mismo mensaje siempre (previene enumeración)
    form.innerHTML = `
      <div class="auth-success">
        <div class="auth-success-icon">✓</div>
        <h2>Solicitud enviada</h2>
        <p>Si existe una cuenta con ese email, recibirás un enlace de recuperación en los próximos minutos.</p>
        <a href="/login.html" class="btn btn-primary">Volver a iniciar sesión</a>
      </div>
    `;
  } catch (error) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar enlace';

    if (error.status === 500) {
      errorContainer.textContent = 'Error al enviar el email. Intentá de nuevo más tarde.';
      errorContainer.classList.remove('hidden');
    } else {
      // Para cualquier otro error, mostrar mismo mensaje genérico
      form.innerHTML = `
        <div class="auth-success">
          <div class="auth-success-icon">✓</div>
          <h2>Solicitud enviada</h2>
          <p>Si existe una cuenta con ese email, recibirás un enlace de recuperación en los próximos minutos.</p>
          <a href="/login.html" class="btn btn-primary">Volver a iniciar sesión</a>
        </div>
      `;
    }
  }
});
