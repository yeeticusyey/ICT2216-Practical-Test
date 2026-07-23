async function validatePasswordFrontend(password) {
  const errors = [];

  if (password.length < 10) {
    errors.push('Password must contain at least 10 characters.');
  }
  if (!/^[\x20-\x7E]+$/.test(password)) {
    errors.push('Password may contain only printable ASCII characters, including spaces.');
  }
  if (errors.length) return errors;

  const response = await fetch('/api/password-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const result = await response.json();
  return result.errors;
}

document.querySelector('#account-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const errorBox = document.querySelector('#errors');
  const errors = await validatePasswordFrontend(form.elements.password.value);

  errorBox.innerHTML = errors.length
    ? `<ul>${errors.map(error => `<li>${error.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</li>`).join('')}</ul>`
    : '';
  if (!errors.length) form.submit();
});

