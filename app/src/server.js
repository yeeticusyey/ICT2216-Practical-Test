import fs from 'node:fs';
import express from 'express';
import pg from 'pg';
import { validatePasswordSyntax } from './password-policy.js';

const app = express();
const port = 3000;
const passwordFile = process.env.DB_PASSWORD_FILE;
const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: fs.readFileSync(passwordFile, 'utf8').trim()
});

app.disable('x-powered-by');
app.use((request, response, next) => {
  response.set({
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff'
  });
  next();
});
app.use(express.urlencoded({ extended: false, limit: '2kb' }));
app.use(express.json({ limit: '2kb' }));
app.use(express.static('public'));

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function page(title, content) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <main>${content}</main>
</body>
</html>`;
}

function accountForm(mode, errors = []) {
  const creating = mode === 'create';
  const heading = creating ? 'Create account' : 'Login';
  const action = creating ? '/create' : '/login';
  const errorHtml = errors.length
    ? `<div id="errors" role="alert"><ul>${errors.map(error => `<li>${escapeHtml(error)}</li>`).join('')}</ul></div>`
    : '<div id="errors" role="alert"></div>';

  return page(heading, `
    <h1>${heading}</h1>
    ${errorHtml}
    <form id="account-form" method="post" action="${action}">
      <label>Username <input name="username" required maxlength="100" autocomplete="username"></label><br>
      <label>Password <input id="password" name="password" type="password" required autocomplete="${creating ? 'new-password' : 'current-password'}"></label><br>
      <button type="submit">${heading}</button>
    </form>
    <p>Password policy: at least 10 printable ASCII characters, spaces permitted, and not present in the NCSC common-password list.</p>
    <p>${creating ? '<a href="/">Return to login</a>' : '<a href="/create">Create an account</a>'}</p>
    <script src="/app.js" defer></script>`);
}

function welcome(username, password) {
  return page('Welcome', `
    <h1>Welcome, ${escapeHtml(username)}</h1>
    <p>Password: <span id="submitted-password">${escapeHtml(password)}</span></p>
    <form method="post" action="/logout"><button type="submit">Logout</button></form>`);
}

async function validatePasswordBackend(password) {
  const errors = validatePasswordSyntax(password);
  if (errors.length) return errors;

  const result = await pool.query(
    'SELECT 1 FROM common_passwords WHERE password = $1 LIMIT 1',
    [password]
  );
  if (result.rowCount) errors.push('Password is present in the NCSC common-password list.');
  return errors;
}

function validUsername(username) {
  return typeof username === 'string' && username.trim().length > 0 && username.length <= 100;
}

app.get('/healthz', async (_request, response) => {
  try {
    await pool.query('SELECT 1');
    response.type('text').send('healthy');
  } catch {
    response.status(503).type('text').send('database unavailable');
  }
});

app.get('/', (_request, response) => response.send(accountForm('login')));
app.get('/create', (_request, response) => response.send(accountForm('create')));

app.post('/api/password-check', async (request, response, next) => {
  try {
    const errors = await validatePasswordBackend(request.body.password);
    response.json({ valid: errors.length === 0, errors });
  } catch (error) {
    next(error);
  }
});

app.post('/create', async (request, response, next) => {
  try {
    const username = request.body.username?.trim();
    const errors = validUsername(username) ? [] : ['Username is required and must not exceed 100 characters.'];
    errors.push(...await validatePasswordBackend(request.body.password));
    if (errors.length) return response.status(400).send(accountForm('create', errors));

    await pool.query(
      'INSERT INTO "2401416" (username) VALUES ($1)',
      [username]
    );
    response.send(welcome(username, request.body.password));
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).send(accountForm('create', ['Username already exists.']));
    }
    next(error);
  }
});

app.post('/login', async (request, response, next) => {
  try {
    const username = request.body.username?.trim();
    const errors = validUsername(username) ? [] : ['Username is required and must not exceed 100 characters.'];
    errors.push(...await validatePasswordBackend(request.body.password));

    if (!errors.length) {
      const user = await pool.query(
        'SELECT 1 FROM "2401416" WHERE username = $1 LIMIT 1',
        [username]
      );
      if (!user.rowCount) errors.push('Account does not exist.');
    }

    if (errors.length) return response.status(400).send(accountForm('login', errors));
    response.send(welcome(username, request.body.password));
  } catch (error) {
    next(error);
  }
});

app.post('/logout', (_request, response) => response.redirect(303, '/'));

app.use((error, _request, response, _next) => {
  console.error(error.message);
  response.status(500).send(page('Error', '<h1>Unexpected error</h1><a href="/">Return home</a>'));
});

app.listen(port, '0.0.0.0', () => console.log(`Application listening on port ${port}`));

