# 2401416 Secure Software Development Practical Exam

## Run

```sh
sudo docker-compose up -d --build
```

On Windows Docker Desktop, omit `sudo`.

For a fresh clone, copy `secrets/db_password.example.txt` to
`secrets/db_password.txt` and replace its contents with a random database password.
The actual secret file is deliberately excluded from Git.

Open `https://127.0.0.1`. The self-signed certificate causes an expected browser warning.

## Application

- Login page: `/`
- Account creation page: `/create`
- HTTPS Basic Authentication user: `admin`
- Git repository: `http://127.0.0.1:3000/repository.git`
- PostgreSQL account audit table: `"2401416"`

The application enforces OWASP Top 10 Proactive Controls 2024 C7 password guidance:

- at least 10 characters because MFA is not used;
- only printable ASCII characters, including spaces;
- no arbitrary composition rule; and
- rejection of passwords in the NCSC common-password database.

Frontend validation gives immediate feedback. Backend validation independently enforces the complete policy and is authoritative.

Only the username and creation timestamp are stored in `"2401416"`; passwords are not stored.

## Tests

```sh
node --test app/test/password-policy.test.js

# Set BASIC_USER and BASIC_PASSWORD first:
python app/test/integration_test.py
```

## Password-list source

`db/100k-most-used-passwords-NCSC.txt` was obtained from the SecLists repository:

`https://github.com/danielmiessler/SecLists/tree/master/Passwords/Common-Credentials`

- Downloaded entries: 99,840
- SHA-256: `C2E5696882C603B76BB67A47EE970897E5A76FC4C3F5547ABE3D0CA340C576E0`

OWASP C7 reference:

`https://top10proactive.owasp.org/archive/2024/the-top-10/c7-secure-digital-identities/`
