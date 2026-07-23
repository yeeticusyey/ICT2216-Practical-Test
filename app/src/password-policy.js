export const MINIMUM_LENGTH = 10;

export function validatePasswordSyntax(password) {
  const errors = [];

  if (typeof password !== 'string' || password.length < MINIMUM_LENGTH) {
    errors.push(`Password must contain at least ${MINIMUM_LENGTH} characters.`);
  }
  if (typeof password !== 'string' || !/^[\x20-\x7E]+$/.test(password)) {
    errors.push('Password may contain only printable ASCII characters, including spaces.');
  }

  return errors;
}

