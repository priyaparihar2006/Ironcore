import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

export type FieldErrors = Record<string, string | undefined>;
const empty = (value: unknown) =>
  value === undefined || value === null || (typeof value === 'string' && !value.trim());
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export function emailError(value: unknown): string | undefined {
  if (empty(value)) return 'Email is required.';
  if (typeof value !== 'string') return 'Please enter a valid email address.';
  const email = value.trim();
  const parts = email.split('@');
  if (email.length > 254 || parts.length !== 2 || /\s/.test(email))
    return 'Please enter a valid email address.';
  const [local, domain] = parts;
  if (
    !local ||
    local.length > 64 ||
    !/^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/.test(local)
  )
    return 'Please enter a valid email address.';
  const labels = domain.split('.');
  if (
    labels.length < 2 ||
    labels.some((l) => !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(l)) ||
    !/^(?:[A-Za-z]{2,63}|xn--[A-Za-z0-9-]{2,59})$/.test(labels.at(-1)!)
  )
    return 'Please enter a valid email address.';
}
export function nameError(value: unknown): string | undefined {
  if (empty(value)) return 'Name is required.';
  if (
    typeof value !== 'string' ||
    [...value.trim()].length < 2 ||
    [...value.trim()].length > 100 ||
    !/^[\p{L}\p{M} .’'·-]+$/u.test(value.trim()) ||
    !/\p{L}/u.test(value)
  )
    return 'Please enter a valid name.';
}
export function phoneError(value: unknown, required = false): string | undefined {
  if (empty(value)) return required ? 'Phone number is required.' : undefined;
  const invalid = 'Please enter a valid 10-digit mobile number.';
  if (typeof value !== 'string' || value.length > 32 || !/^\+?[0-9 ()-]+$/.test(value.trim()))
    return invalid;
  const raw = value.trim();
  const opens = (raw.match(/\(/g) || []).length;
  if (opens !== (raw.match(/\)/g) || []).length || opens > 1 || (opens && !/\(\d+\)/.test(raw)))
    return invalid;
  const compact = raw.replace(/[ ()-]/g, '');
  if (!raw.startsWith('+')) return /^[6-9]\d{9}$/.test(compact) ? undefined : invalid;
  if (compact.startsWith('+91')) return /^\+91[6-9]\d{9}$/.test(compact) ? undefined : invalid;
  const number = parsePhoneNumberFromString(compact);
  return number?.isPossible()
    ? undefined
    : 'Please enter a valid international phone number with country code.';
}
export function normalizePhone(value: string): string {
  const compact = value.trim().replace(/[ ()-]/g, '');
  return compact && !compact.startsWith('+') ? '+91' + compact : compact;
}
export function passwordError(value: unknown, creation = true): string | undefined {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    (creation && typeof value === 'string' && !value.trim())
  )
    return 'Password is required.';
  if (typeof value !== 'string') return 'Please enter a valid password.';
  // Login preserves legacy passwords, including edge whitespace and old complexity.
  if (!creation) return value.length > 4096 ? 'Password is too long.' : undefined;
  const length = [...value].length;
  if (length < 8) return 'Password must be at least 8 characters.';
  if (length > 128) return 'Password must not exceed 128 characters.';
  if (value !== value.trim()) return 'Password must not start or end with whitespace.';
  if (
    !/\p{Lu}/u.test(value) ||
    !/\p{Ll}/u.test(value) ||
    !/[0-9]/.test(value) ||
    !/[^\p{L}\p{N}\s]/u.test(value)
  )
    return 'Password must contain uppercase, lowercase, a number, and a special character.';
}
export function confirmPasswordError(password: unknown, confirmation: unknown): string | undefined {
  if (typeof confirmation !== 'string' || !confirmation || confirmation !== password)
    return 'Passwords do not match.';
}
export function weightError(value: unknown): string | undefined {
  if (empty(value)) return 'Weight is required.';
  if (
    (typeof value !== 'string' && typeof value !== 'number') ||
    !/^-?\d+(?:\.\d)?$/.test(String(value).trim()) ||
    !Number.isFinite(Number(value))
  )
    return 'Please enter a valid weight.';
  if (Number(value) < 20) return 'Weight must be at least 20 kg.';
  if (Number(value) > 300) return 'Weight must not exceed 300 kg.';
}
export function numberError(
  value: unknown,
  label: string,
  min: number,
  max: number,
  decimals = 0,
  required = false,
): string | undefined {
  if (empty(value)) return required ? `${label} is required.` : undefined;
  const pattern = decimals ? /^\d+(?:\.\d)?$/ : /^\d+$/;
  if (
    (typeof value !== 'string' && typeof value !== 'number') ||
    !pattern.test(String(value).trim()) ||
    !Number.isFinite(Number(value)) ||
    Number(value) < min ||
    Number(value) > max
  )
    return `${label} must be ${decimals ? 'a number' : 'a whole number'} between ${min} and ${max}${decimals ? ' with at most one decimal place' : ''}.`;
}
export function dateOfBirthError(value: unknown): string | undefined {
  if (empty(value)) return;
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value ||
    value < '1900-01-01' ||
    value > new Date().toISOString().slice(0, 10)
  )
    return 'Please enter a valid date of birth.';
}
export function textError(value: unknown, label: string, max: number): string | undefined {
  if (value === undefined) return;
  if (
    typeof value !== 'string' ||
    value.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
  )
    return `${label} must be text of at most ${max} characters.`;
}
export const FITNESS_GOALS = [
  'Weight Loss',
  'Muscle Gain',
  'Strength',
  'Endurance',
  'General Fitness',
  'Flexibility',
  'Sports Performance',
  'Other',
];
export const GENDERS = ['Prefer not to say', 'Male', 'Female', 'Non-binary', 'Not specified'];
export function choiceError(
  value: unknown,
  choices: readonly string[],
  label: string,
): string | undefined {
  return typeof value === 'string' && choices.includes(value)
    ? undefined
    : `Please select a valid ${label}.`;
}
