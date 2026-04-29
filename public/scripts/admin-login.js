const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');

if (getToken()) {
  window.location.href = '/admin/dashboard.html';
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage(loginMessage);

  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const formData = new FormData(loginForm);
    const payload = Object.fromEntries(formData.entries());
    const result = await apiRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setSession(result.token, result.admin);
    window.location.href = '/admin/dashboard.html';
  } catch (error) {
    const details = error.details?.length ? ` ${error.details.join(' ')}` : '';
    showMessage(loginMessage, `${error.message}${details}`, 'error');
  } finally {
    submitButton.disabled = false;
  }
});
