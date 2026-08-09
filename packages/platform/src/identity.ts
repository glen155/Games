/**
 * A player's remembered identity — nickname plus, per game, which room they
 * were last in — so reloading a page or coming back to a different game
 * doesn't force them to retype their name. Mirrors the host's existing
 * room-resume pattern (`hostRoomStorageKey` in useRoom.ts) but scoped to
 * players: one global nickname shared across every game, and a room pointer
 * kept separately per game slug (each game is its own room).
 *
 * All reads/writes are wrapped in try/catch — localStorage can throw under
 * blocked storage or private browsing, and losing "remember me" should
 * degrade to "ask again," never crash the app.
 */

const NICKNAME_KEY = 'games-platform:nickname';

export function playerRoomStorageKey(slug: string): string {
  return `games-platform:player-room:${slug}`;
}

export function getStoredNickname(): string | null {
  try {
    return localStorage.getItem(NICKNAME_KEY);
  } catch {
    return null;
  }
}

export function setStoredNickname(nickname: string): void {
  try {
    localStorage.setItem(NICKNAME_KEY, nickname);
  } catch {
    // Storage unavailable — nothing to remember, nothing to fail loudly over.
  }
}

export function getStoredPlayerRoom(slug: string): string | null {
  try {
    return localStorage.getItem(playerRoomStorageKey(slug));
  } catch {
    return null;
  }
}

export function setStoredPlayerRoom(slug: string, code: string): void {
  try {
    localStorage.setItem(playerRoomStorageKey(slug), code);
  } catch {
    // Ignored — see module comment.
  }
}

export function clearStoredPlayerRoom(slug: string): void {
  try {
    localStorage.removeItem(playerRoomStorageKey(slug));
  } catch {
    // Ignored — see module comment.
  }
}
