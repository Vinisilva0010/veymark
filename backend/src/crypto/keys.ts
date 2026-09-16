/**
 * Encryption for SDM keys at rest.
 *
 * Each tag's AES key is the only secret that lets the backend validate that
 * tag's taps. Storing them in plaintext would mean a database dump is enough
 * to forge valid taps for every part ever provisioned — so they are encrypted
 * with a master key that lives outside the database.
 *
 * AES-256-GCM is used because it authenticates as well as encrypts: a tampered
 * ciphertext fails to decrypt instead of silently producing garbage.
 */
import "dotenv/config";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getMasterKey(): Buffer {
  const raw = process.env.SDM_MASTER_KEY;
  if (!raw) {
    throw new Error("SDM_MASTER_KEY is not set");
  }
  const key = Buffer.from(raw, "hex");
  if (key.length !== 32) {
    throw new Error("SDM_MASTER_KEY must be 32 bytes (64 hex characters)");
  }
  return key;
}

/** Encrypts a tag key. Output layout: [iv][authTag][ciphertext]. */
export function encryptKey(plaintext: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getMasterKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
}

export function decryptKey(stored: Buffer): Buffer {
  const iv = stored.subarray(0, IV_LENGTH);
  const authTag = stored.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = stored.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, getMasterKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
