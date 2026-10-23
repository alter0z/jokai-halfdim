/**
 * Encryption utilities for storing game credentials
 *
 * Uses AES-256-GCM for authenticated encryption.
 * Key lives in process.env.ENCRYPTION_KEY
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 16;

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
  salt: string;
  keyVersion: string;
}

/**
 * Encrypt sensitive data (login, password)
 */
export function encrypt(plaintext: string, masterKey: string, keyVersion = 'v1'): EncryptedData {
  const salt = randomBytes(SALT_LENGTH);
  const key = scryptSync(masterKey, salt, KEY_LENGTH);

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    salt: salt.toString('hex'),
    keyVersion,
  };
}

/**
 * Decrypt encrypted data
 */
export function decrypt(encrypted: EncryptedData, masterKey: string): string {
  const salt = Buffer.from(encrypted.salt, 'hex');
  const key = scryptSync(masterKey, salt, KEY_LENGTH);

  const iv = Buffer.from(encrypted.iv, 'hex');
  const tag = Buffer.from(encrypted.tag, 'hex');
  const ciphertext = Buffer.from(encrypted.ciphertext, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let plaintext = decipher.update(ciphertext, undefined, 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}

/**
 * Generate a secure random token (for one-time login links)
 */
export function generateToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Hash a token for storage
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
