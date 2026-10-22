// AES-GCM 256-bit encryption for data-at-rest protection
// Runs seamlessly in modern browsers and Node.js via globalThis.crypto.subtle

const MASTER_SALT = 'AsesoresVisa-SecureSalt-2026-ConsularProtection';
const MASTER_SECRET =
  (typeof globalThis !== 'undefined' &&
    (globalThis as unknown as { process?: { env?: Record<string, string> } }).process?.env?.ENCRYPTION_KEY) ||
  'AsesoresVisa-MasterSecurityKey-994827163829-LawRonny';

let cachedKey: CryptoKey | null = null;

async function getDerivedKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const enc = new TextEncoder();
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(MASTER_SECRET),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  cachedKey = await globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(MASTER_SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return cachedKey;
}

function bufToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Encrypts a sensitive string (e.g. passport number, client answers).
 * Result format: enc:v1:<iv_hex>:<cipher_hex>
 */
export async function encryptSensitiveText(plainText: string): Promise<string> {
  if (!plainText || typeof plainText !== 'string') return plainText;

  try {
    const key = await getDerivedKey();
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encoded = enc.encode(plainText);

    const encrypted = await globalThis.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encoded
    );

    const ivHex = bufToHex(iv.buffer);
    const cipherHex = bufToHex(encrypted);
    return `enc:v1:${ivHex}:${cipherHex}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    return plainText;
  }
}

/**
 * Decrypts an encrypted string. If not encrypted, returns original text safely.
 */
export async function decryptSensitiveText(cipherText: string): Promise<string> {
  if (!cipherText || typeof cipherText !== 'string' || !cipherText.startsWith('enc:v1:')) {
    return cipherText;
  }

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 4) return cipherText;

    const ivHex = parts[2];
    const cipherHex = parts[3];

    const iv = hexToBuf(ivHex);
    const cipherData = hexToBuf(cipherHex);
    const key = await getDerivedKey();

    const decrypted = await globalThis.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      key,
      cipherData as unknown as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    console.error('Decryption failed:', err);
    return '[Dato Cifrado Protegido]';
  }
}

/**
 * Encrypts a whole answers map { [fieldId]: string }
 */
export async function encryptAnswersMap(answers: Record<string, string>): Promise<Record<string, string>> {
  const encryptedMap: Record<string, string> = {};
  for (const [key, val] of Object.entries(answers)) {
    encryptedMap[key] = await encryptSensitiveText(val);
  }
  return encryptedMap;
}

/**
 * Decrypts a whole answers map { [fieldId]: string }
 */
export async function decryptAnswersMap(answers: Record<string, string>): Promise<Record<string, string>> {
  const decryptedMap: Record<string, string> = {};
  for (const [key, val] of Object.entries(answers)) {
    decryptedMap[key] = await decryptSensitiveText(val);
  }
  return decryptedMap;
}
