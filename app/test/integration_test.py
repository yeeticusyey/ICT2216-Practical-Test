import base64
import os
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request


BASE_URL = os.getenv("BASE_URL", "https://127.0.0.1")
BASIC_USER = os.getenv("BASIC_USER")
BASIC_PASSWORD = os.getenv("BASIC_PASSWORD")
AUTH = (
    base64.b64encode(f"{BASIC_USER}:{BASIC_PASSWORD}".encode()).decode()
    if BASIC_USER and BASIC_PASSWORD
    else None
)
TLS = ssl._create_unverified_context() if BASE_URL.startswith("https://") else None


def request(path, method="GET", form=None):
    data = urllib.parse.urlencode(form).encode() if form else None
    headers = {"Authorization": f"Basic {AUTH}"} if AUTH else {}
    request_object = urllib.request.Request(
        BASE_URL + path, data=data, headers=headers, method=method
    )
    try:
        response = urllib.request.urlopen(request_object, context=TLS)
        return response.status, response.read().decode()
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode()


status, body = request("/")
assert status == 200
assert 'name="username"' in body and 'name="password"' in body

status, body = request(
    "/create",
    "POST",
    {"username": "rejected-user", "password": "password123"},
)
assert status == 400
assert "NCSC common-password list" in body

status, body = request(
    "/create",
    "POST",
    {"username": "short-password-user", "password": "short"},
)
assert status == 400
assert "at least 10 characters" in body

status, body = request(
    "/create",
    "POST",
    {"username": "non-ascii-user", "password": "longpassword🔒"},
)
assert status == 400
assert "printable ASCII" in body

username = f"q4-user-{int(time.time())}"
valid_password = "SIT secure passphrase 2026!"
status, body = request(
    "/create",
    "POST",
    {"username": username, "password": valid_password},
)
assert status == 200
assert username in body and valid_password in body

status, body = request(
    "/login",
    "POST",
    {"username": username, "password": valid_password},
)
assert status == 200 and "Welcome" in body

status, body = request("/logout", "POST")
assert status == 200 and "<h1>Login</h1>" in body

print(f"integration-tests=passed username={username}")
