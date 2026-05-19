/**
 * Diagon Alley E-commerce — Profile Page
 *
 * Muestra y permite editar el perfil del usuario autenticado.
 * También permite cambiar la contraseña.
 *
 * Secciones:
 *   1. Información personal: nombre (editable), email (read-only)
 *   2. Cambiar contraseña
 */

import { requireUser } from '../guards/authGuard.js';
requireUser();

import * as authService from '../services/authService.js';
if (authService.isAdmin()) {
  window.location.replace('/admin/profile.html');
}

import * as authApi from '../api/auth.js';
import { isValidName, isValidPassword, doPasswordsMatch } from '../utils/validators.js';
import { showFormErrors, showToast } from '../services/errorHandler.js';
import { renderNavbar } from '../components/navbar.js';

renderNavbar();

// Elementos DOM
const profileInfo = document.getElementById('profile-info');
const profileForm = document.getElementById('profile-form');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const saveBtn = document.getElementById('btn-save-profile');

const passwordForm = document.getElementById('password-form');
const changePwdBtn = document.getElementById('btn-change-password');

let currentUserId = null;

/**
 * Carga los datos del perfil.
 */
async function loadProfile() {
  profileInfo.classList.remove('hidden');
  profileForm.classList.add('hidden');

  try {
    const me = await authApi.getMe();
    currentUserId = me.id;

    if (currentUserId == null || currentUserId === undefined) {
      profileInfo.innerHTML = `
        <p class="text-sm" style="color: var(--color-error);">Error: no se pudo obtener el ID del usuario. Intentá cerrar sesión y volver a iniciar.</p>
      `;
      return;
    }

    profileName.value = me.name || '';
    profileEmail.textContent = me.email || '—';

    profileInfo.classList.add('hidden');
    profileForm.classList.remove('hidden');
  } catch (error) {
    if (error.status === 401) {
      window.location.replace('/login.html?expired=true');
    } else {
      profileInfo.innerHTML = `
        <p class="text-sm" style="color: var(--color-error);">Error al cargar perfil: ${error.message || 'Intentá de nuevo.'}</p>
      `;
    }
  }
}

// Profile form submit
profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Limpiar errores
  profileForm.querySelectorAll('.field-error').forEach((el) => el.remove());
  profileForm.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));

  const name = profileName.value.trim();
  const nameResult = isValidName(name);
  if (!nameResult.valid) {
    showFormErrors({ name: nameResult.message }, profileForm);
    return;
  }

  if (currentUserId == null || currentUserId === undefined) {
    showToast('Error: no se pudo identificar el usuario. Recargá la página.', 'error');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Guardando…';

  try {
    await authService.updateProfile(currentUserId, name);
    showToast('Perfil actualizado correctamente.', 'success');
  } catch (error) {
    if (error.status === 400 && error.fieldErrors) {
      showFormErrors(error.fieldErrors, profileForm);
    } else {
      showToast(error.message || 'Error al actualizar perfil.', 'error');
    }
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar cambios';
  }
});

// Password form submit
passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  passwordForm.querySelectorAll('.field-error').forEach((el) => el.remove());
  passwordForm.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));

  const oldPassword = passwordForm.oldPassword.value;
  const newPassword = passwordForm.newPassword.value;
  const confirmPassword = passwordForm.confirmPassword.value;

  const errors = {};

  if (!oldPassword || oldPassword.length < 1) {
    errors.oldPassword = 'La contraseña actual es obligatoria.';
  } else {
    // Validar formato de la contraseña actual también (evita errores del backend)
    const oldPwdResult = isValidPassword(oldPassword);
    if (!oldPwdResult.valid) errors.oldPassword = oldPwdResult.message;
  }

  const pwdResult = isValidPassword(newPassword);
  if (!pwdResult.valid) errors.newPassword = pwdResult.message;

  const matchResult = doPasswordsMatch(newPassword, confirmPassword);
  if (!matchResult.valid) errors.confirmPassword = matchResult.message;

  if (Object.keys(errors).length > 0) {
    showFormErrors(errors, passwordForm);
    return;
  }

  changePwdBtn.disabled = true;
  changePwdBtn.textContent = 'Cambiando…';

  try {
    await authService.changePassword(oldPassword, newPassword);
    showToast('Contraseña cambiada correctamente.', 'success');
    passwordForm.reset();
  } catch (error) {
    if (error.status === 400) {
      if (error.fieldErrors) {
        showFormErrors(error.fieldErrors, passwordForm);
      } else {
        showFormErrors({ oldPassword: error.message || 'La contraseña actual es incorrecta.' }, passwordForm);
      }
    } else {
      showToast(error.message || 'Error al cambiar la contraseña.', 'error');
    }
  } finally {
    changePwdBtn.disabled = false;
    changePwdBtn.textContent = 'Cambiar contraseña';
  }
});

// Inicialización
loadProfile();
