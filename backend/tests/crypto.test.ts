import { encryptKey, decryptKey } from "../src/crypto/keys";

const original = Buffer.from("00112233445566778899aabbccddeeff", "hex");

const encrypted = encryptKey(original);
console.log("plaintext length:", original.length);
console.log("stored length:  ", encrypted.length, "(12 iv + 16 tag + 16 data)");
console.log("looks encrypted:", !encrypted.includes(original));

const decrypted = decryptKey(encrypted);
console.log("roundtrip ok:   ", decrypted.equals(original));

const tampered = Buffer.from(encrypted);
tampered[tampered.length - 1] ^= 0xff;
try {
  decryptKey(tampered);
  console.log("TAMPER TEST FAILED: corrupted data decrypted anyway");
  process.exit(1);
} catch {
  console.log("tamper rejected: true");
}
