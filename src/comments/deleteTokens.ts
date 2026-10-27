const STORAGE_KEY = 'bevalk-comment-delete-tokens';

function readTokens(): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  } catch {
    return {};
  }
}

function writeTokens(tokens: Record<string, string>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Token storage is optional when browser storage is unavailable.
  }
}

export function rememberDeleteToken(id: string, token: string): void {
  const tokens = readTokens();
  tokens[id] = token;
  writeTokens(tokens);
}

export function deleteTokenFor(id: string): string | null {
  return readTokens()[id] ?? null;
}

export function forgetDeleteToken(id: string): void {
  const tokens = readTokens();
  delete tokens[id];
  writeTokens(tokens);
}
