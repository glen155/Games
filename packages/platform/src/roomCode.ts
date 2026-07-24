/**
 * Room-code alphabet: uppercase letters + digits with visually ambiguous
 * characters removed (no 0/O, 1/I/L). 6 chars over a 31-symbol alphabet is
 * ~887 million combinations — far too large to brute-force at family scale,
 * especially with short room lifetimes.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

export function generateRoomCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

/** Normalizes user-typed codes (uppercase, strip spaces) for lookups. */
export function normalizeRoomCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidRoomCode(code: string): boolean {
  const normalized = normalizeRoomCode(code);
  if (normalized.length !== CODE_LENGTH) return false;
  return [...normalized].every((ch) => ALPHABET.includes(ch));
}
