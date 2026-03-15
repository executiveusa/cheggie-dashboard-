import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHmac,
  timingSafeEqual,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function deriveKey(encryptionKey: string): Buffer {
  const key = Buffer.from(encryptionKey, 'hex');
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH * 2} hex characters (${KEY_LENGTH} bytes)`);
  }
  return key;
}

export function encrypt(plaintext: string, encryptionKey: string): string {
  const key = deriveKey(encryptionKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const result = Buffer.concat([iv, authTag, encrypted]);
  return result.toString('base64');
}

export function decrypt(ciphertext: string, encryptionKey: string): string {
  const key = deriveKey(encryptionKey);
  const data = Buffer.from(ciphertext, 'base64');
  if (data.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid ciphertext: too short');
  }
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

export function generateHmacSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyHmacSignature(payload: string, signature: string, secret: string): boolean {
  const expected = generateHmacSignature(payload, secret);
  try {
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}
