/**
 * Tests for AES-256-GCM encryption and token generation
 */

import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, generateToken } from './crypto';

describe('crypto utilities', () => {
  const masterKey = 'test-master-secret-key-min-32-chars-long';

  it('encrypts and decrypts plaintext correctly', () => {
    const sensitiveData = JSON.stringify({ username: 'genshin_user', password: 'secretpassword' });
    const encrypted = encrypt(sensitiveData, masterKey);

    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.tag).toBeDefined();

    const decrypted = decrypt(encrypted, masterKey);
    expect(decrypted).toBe(sensitiveData);
  });

  it('generates secure random tokens', () => {
    const token1 = generateToken();
    const token2 = generateToken();

    expect(token1).toHaveLength(64); // 32 bytes in hex = 64 chars
    expect(token1).not.toBe(token2);
  });
});
