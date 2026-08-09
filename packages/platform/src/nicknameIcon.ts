/**
 * A small easter egg: certain family nicknames get a matching icon next to
 * their name wherever a nickname is displayed. Matched against a curated
 * alias list (not a substring/fuzzy match — that would risk false hits on
 * unrelated names), normalized so spacing/punctuation/case don't matter
 * ("K Dawg", "k-dawg", "KDAWG" all match the same entry).
 */

const STAR_ALIASES = new Set(['kom', 'kdawg', 'starfish']);
const COWBOY_ALIASES = new Set(['rc', 'cowgirl', 'cowboy']);

function normalize(nickname: string): string {
  return nickname.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Returns the matching icon for a nickname, or null if it doesn't match
 * any known alias. */
export function nicknameIcon(nickname: string): string | null {
  const key = normalize(nickname);
  if (STAR_ALIASES.has(key)) return '⭐';
  if (COWBOY_ALIASES.has(key)) return '🤠';
  return null;
}

/** The nickname with its icon prefixed (icon + space), or the nickname
 * unchanged if it doesn't match. Convenient for the common case of just
 * dropping an icon in front of a displayed name. */
export function nicknameWithIcon(nickname: string): string {
  const icon = nicknameIcon(nickname);
  return icon ? `${icon} ${nickname}` : nickname;
}
