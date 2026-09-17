/**
 * SUN (Secure Unique NFC) message generation and verification.
 *
 * This implements the same scheme an NTAG 424 DNA performs in hardware on
 * every tap, following NXP application note AN12196:
 *
 *   1. PICCData = [tag byte][UID (7 bytes)][read counter (3 bytes, LE)][padding]
 *      encrypted with AES-128-CBC, zero IV, using the tag's meta read key.
 *   2. CMAC computed over the encrypted PICCData with a session key derived
 *      from the tag's MAC key, then truncated to 8 bytes by taking every
 *      second byte (odd indexes).
 *
 * The simulator and the verifier share this file on purpose: if the two used
 * different implementations, a bug in one could mask a bug in the other.
 * When physical tags arrive, only the generation side is replaced.
 */
import { cbc, cmac } from "@noble/ciphers/aes.js";

const ZERO_IV = new Uint8Array(16);

/** Tag byte 0xC7: UID mirroring and read counter both enabled. */
const PICC_TAG_BYTE = 0xc7;

export interface SunPayload {
  /** Hex string of the encrypted PICCData, as it appears in the URL. */
  piccData: string;
  /** Hex string of the truncated CMAC, as it appears in the URL. */
  cmac: string;
}

export interface SunDecoded {
  uid: string;
  counter: number;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase();
  if (clean.length % 2 !== 0 || !/^[0-9a-f]*$/.test(clean)) {
    throw new Error("Invalid hex string");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/**
 * Derives the SDM session MAC key from the tag's MAC key.
 * Per AN12196: CMAC over a fixed SV2 label containing the UID and counter.
 */
function deriveSessionMacKey(
  macKey: Uint8Array,
  uid: Uint8Array,
  counter: number
): Uint8Array {
  const sv2 = new Uint8Array(16);
  sv2[0] = 0x3c;
  sv2[1] = 0xc3;
  sv2[2] = 0x00;
  sv2[3] = 0x01;
  sv2[4] = 0x00;
  sv2[5] = 0x80;
  sv2.set(uid, 6);
  sv2[13] = counter & 0xff;
  sv2[14] = (counter >> 8) & 0xff;
  sv2[15] = (counter >> 16) & 0xff;

  return cmac(sv2, macKey);
}

/** Truncates a 16-byte CMAC to 8 bytes by taking the odd-indexed bytes. */
function truncateCmac(full: Uint8Array): Uint8Array {
  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    out[i] = full[i * 2 + 1];
  }
  return out;
}

/**
 * Produces the SUN payload a real tag would emit for a given tap.
 * Used by the simulator; replaced by physical hardware later.
 */
export function generateSun(
  uidHex: string,
  counter: number,
  metaReadKey: Uint8Array,
  macKey: Uint8Array
): SunPayload {
  const uid = hexToBytes(uidHex);
  if (uid.length !== 7) {
    throw new Error("UID must be 7 bytes");
  }
  if (counter < 0 || counter > 0xffffff) {
    throw new Error("Counter must fit in 3 bytes");
  }

  const plain = new Uint8Array(16);
  plain[0] = PICC_TAG_BYTE;
  plain.set(uid, 1);
  plain[8] = counter & 0xff;
  plain[9] = (counter >> 8) & 0xff;
  plain[10] = (counter >> 16) & 0xff;
  // Bytes 11..15 stay zero: the tag pads the block.

  const encrypted = cbc(metaReadKey, ZERO_IV, {
    disablePadding: true,
  }).encrypt(plain);

  const sessionMacKey = deriveSessionMacKey(macKey, uid, counter);
  const mac = truncateCmac(cmac(new Uint8Array(), sessionMacKey));

  return {
    piccData: bytesToHex(encrypted),
    cmac: bytesToHex(mac),
  };
}

/**
 * Decrypts PICCData and verifies the CMAC.
 * Throws on any mismatch — callers treat a throw as "unverified", never as
 * "counterfeit", because a damaged tag produces the same failure.
 */
export function verifySun(
  piccDataHex: string,
  cmacHex: string,
  metaReadKey: Uint8Array,
  macKey: Uint8Array
): SunDecoded {
  const encrypted = hexToBytes(piccDataHex);
  if (encrypted.length !== 16) {
    throw new Error("PICCData must be 16 bytes");
  }

  const plain = cbc(metaReadKey, ZERO_IV, {
    disablePadding: true,
  }).decrypt(encrypted);

  if (plain[0] !== PICC_TAG_BYTE) {
    throw new Error("Unexpected PICCData tag byte");
  }

  const uid = plain.slice(1, 8);
  const counter = plain[8] | (plain[9] << 8) | (plain[10] << 16);

  const sessionMacKey = deriveSessionMacKey(macKey, uid, counter);
  const expected = truncateCmac(cmac(new Uint8Array(), sessionMacKey));
  const provided = hexToBytes(cmacHex);

  if (provided.length !== 8) {
    throw new Error("CMAC must be 8 bytes");
  }

  // Constant-time comparison: a byte-by-byte early return would leak how much
  // of a forged CMAC was correct.
  let diff = 0;
  for (let i = 0; i < 8; i++) {
    diff |= expected[i] ^ provided[i];
  }
  if (diff !== 0) {
    throw new Error("CMAC verification failed");
  }

  return { uid: bytesToHex(uid), counter };
}
