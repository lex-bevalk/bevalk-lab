import './login.css';

const params = new URLSearchParams(window.location.search);
const nextInput = document.querySelector<HTMLInputElement>('#login-next');
const alert = document.querySelector<HTMLParagraphElement>('#login-error');
const form = document.querySelector<HTMLFormElement>('form');
const submitButton = document.querySelector<HTMLButtonElement>('button[type="submit"]');

const next = params.get('next');
if (nextInput && next) nextInput.value = next;

const error = params.get('error');
if (alert && error === '1') {
  alert.textContent = 'Contraseña incorrecta. Inténtalo de nuevo.';
  alert.hidden = false;
} else if (alert && error === 'rate') {
  alert.textContent = 'Demasiados intentos. Espera unos minutos y vuelve a probar.';
  alert.hidden = false;
}

form?.addEventListener('submit', () => {
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
  }
});
