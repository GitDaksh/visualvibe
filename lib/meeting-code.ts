/**
 * Meeting codes look like "hxq-mzpr-tkd": short enough to read out loud,
 * and valid as Stream call IDs (a-z, 0-9, "-" and "_").
 */
const ALPHABET = "abcdefghijkmnpqrstuvwxyz"; // no "l" or "o", which read like 1 and 0

function pick(randomByte: number) {
  return ALPHABET[randomByte % ALPHABET.length];
}

export function generateMeetingCode() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const letters = Array.from(bytes, pick).join("");
  return `${letters.slice(0, 3)}-${letters.slice(3, 7)}-${letters.slice(7, 10)}`;
}

/** A stable code for someone's personal room, derived from their user ID. */
export function personalRoomCode(userId: string) {
  // cyrb53: fast, well-distributed 53-bit string hash.
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  const key = `room:${userId}`;
  for (let i = 0; i < key.length; i++) {
    const ch = key.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  let n = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  let letters = "";
  for (let i = 0; i < 10; i++) {
    letters += ALPHABET[n % ALPHABET.length];
    n = Math.floor(n / ALPHABET.length);
  }
  return `${letters.slice(0, 3)}-${letters.slice(3, 7)}-${letters.slice(7, 10)}`;
}

const ID_PATTERN = /^[a-z0-9_-]{3,64}$/i;

export function isValidMeetingId(id: string) {
  return ID_PATTERN.test(id);
}

/**
 * Accepts whatever people paste: a full invite link, a /meeting/ URL from the
 * old app, or just the code. Returns the meeting ID, or null.
 */
export function parseMeetingInput(raw: string): string | null {
  const input = raw.trim();
  if (!input) return null;
  const fromPath = input.match(/\/(?:meeting|m)\/([a-z0-9_-]{3,64})/i);
  if (fromPath) return fromPath[1];
  const code = input.replace(/\s+/g, "").toLowerCase();
  if (ID_PATTERN.test(code)) return code;
  return null;
}
