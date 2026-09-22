import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

// Versioned scrypt avoids bcrypt's 72-byte truncation. Legacy hashes stay usable.
const PREFIX = 'scrypt-v1';
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(
      password,
      salt,
      64,
      { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 },
      (error, result) => (error ? reject(error) : resolve(result)),
    ),
  );
}
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  return `${PREFIX}$${salt}$${(await derive(password, salt)).toString('hex')}`;
}
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (/^\$2[aby]\$\d{2}\$/.test(stored)) return bcrypt.compare(password, stored);
  const [version, salt, hash, extra] = stored.split('$');
  if (
    version !== PREFIX ||
    extra !== undefined ||
    !/^[a-f0-9]{32}$/.test(salt || '') ||
    !/^[a-f0-9]{128}$/.test(hash || '')
  )
    return false;
  return timingSafeEqual(await derive(password, salt), Buffer.from(hash, 'hex'));
}
let dummy: Promise<string> | undefined;
export async function verifyUnknownAccount(password: string): Promise<void> {
  dummy ||= hashPassword(randomBytes(32).toString('hex'));
  await verifyPassword(password, await dummy);
}
