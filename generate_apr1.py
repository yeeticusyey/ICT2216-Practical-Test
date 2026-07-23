import hashlib
import secrets
import string
import sys


ITOA64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"


def to64(value: int, length: int) -> str:
    output = []
    for _ in range(length):
        output.append(ITOA64[value & 0x3F])
        value >>= 6
    return "".join(output)


def apr1(password: str, salt: str) -> str:
    password_bytes = password.encode("utf-8")
    salt = salt.split("$")[0][:8]
    salt_bytes = salt.encode("ascii")
    magic = b"$apr1$"

    digest = hashlib.md5(password_bytes + magic + salt_bytes)
    alternate = hashlib.md5(password_bytes + salt_bytes + password_bytes).digest()

    remaining = len(password_bytes)
    while remaining > 0:
        digest.update(alternate[: min(16, remaining)])
        remaining -= 16

    remaining = len(password_bytes)
    while remaining:
        digest.update(b"\x00" if remaining & 1 else password_bytes[:1])
        remaining >>= 1

    final = digest.digest()
    for round_number in range(1000):
        current = hashlib.md5()
        current.update(password_bytes if round_number & 1 else final)
        if round_number % 3:
            current.update(salt_bytes)
        if round_number % 7:
            current.update(password_bytes)
        current.update(final if round_number & 1 else password_bytes)
        final = current.digest()

    encoded = (
        to64((final[0] << 16) | (final[6] << 8) | final[12], 4)
        + to64((final[1] << 16) | (final[7] << 8) | final[13], 4)
        + to64((final[2] << 16) | (final[8] << 8) | final[14], 4)
        + to64((final[3] << 16) | (final[9] << 8) | final[15], 4)
        + to64((final[4] << 16) | (final[10] << 8) | final[5], 4)
        + to64(final[11], 2)
    )
    return f"$apr1${salt}${encoded}"


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: generate_apr1.py PASSWORD")
    alphabet = string.ascii_letters + string.digits
    random_salt = "".join(secrets.choice(alphabet) for _ in range(8))
    print(apr1(sys.argv[1], random_salt))
