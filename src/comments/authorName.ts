export const NAME_STORAGE_KEY = 'bevalk-comment-author';

export function readStoredName(): string {
  try {
    return window.localStorage.getItem(NAME_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function writeStoredName(name: string): void {
  try {
    window.localStorage.setItem(NAME_STORAGE_KEY, name);
  } catch {
    // Storage is optional in private browsing.
  }
}
