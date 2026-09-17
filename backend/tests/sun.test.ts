import { randomBytes } from "crypto";
import { generateSun, verifySun } from "../src/crypto/sun";

const metaReadKey = randomBytes(16);
const macKey = randomBytes(16);
const uid = "04AABBCCDDEE80";

let failures = 0;
function check(label: string, passed: boolean) {
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}`);
  if (!passed) failures++;
}

// 1. Roundtrip
const tap1 = generateSun(uid, 1, metaReadKey, macKey);
const decoded1 = verifySun(tap1.piccData, tap1.cmac, metaReadKey, macKey);
check("roundtrip recovers uid", decoded1.uid === uid);
check("roundtrip recovers counter", decoded1.counter === 1);

// 2. Every tap produces a different payload
const tap2 = generateSun(uid, 2, metaReadKey, macKey);
check("counter changes piccdata", tap1.piccData !== tap2.piccData);
check("counter changes cmac", tap1.cmac !== tap2.cmac);

// 3. Wrong key rejected
try {
  verifySun(tap1.piccData, tap1.cmac, randomBytes(16), macKey);
  check("wrong read key rejected", false);
} catch {
  check("wrong read key rejected", true);
}

try {
  verifySun(tap1.piccData, tap1.cmac, metaReadKey, randomBytes(16));
  check("wrong mac key rejected", false);
} catch {
  check("wrong mac key rejected", true);
}

// 4. Forged CMAC rejected
try {
  verifySun(tap1.piccData, "0000000000000000", metaReadKey, macKey);
  check("forged cmac rejected", false);
} catch {
  check("forged cmac rejected", true);
}

// 5. Tampered PICCData rejected
const tampered = tap1.piccData.slice(0, -2) + (tap1.piccData.endsWith("00") ? "11" : "00");
try {
  verifySun(tampered, tap1.cmac, metaReadKey, macKey);
  check("tampered piccdata rejected", false);
} catch {
  check("tampered piccdata rejected", true);
}

// 6. Mismatched pair rejected (cmac from another tap)
try {
  verifySun(tap1.piccData, tap2.cmac, metaReadKey, macKey);
  check("mismatched cmac rejected", false);
} catch {
  check("mismatched cmac rejected", true);
}

// 7. High counter value
const tapHigh = generateSun(uid, 0xffffff, metaReadKey, macKey);
const decodedHigh = verifySun(tapHigh.piccData, tapHigh.cmac, metaReadKey, macKey);
check("max counter roundtrips", decodedHigh.counter === 0xffffff);

console.log(failures === 0 ? "\nAll SUN tests passed" : `\n${failures} test(s) failed`);
process.exit(failures === 0 ? 0 : 1);
