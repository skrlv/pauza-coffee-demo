import { MENU_ITEMS } from "./menu.ts";

export const STORAGE_KEY = "pauza.favorites.v1";
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
const knownIds = new Set(MENU_ITEMS.map((item) => item.id));

function sanitizeFavorites(ids: readonly string[]): string[] {
  return [
    ...new Set(ids.filter((id) => typeof id === "string" && knownIds.has(id))),
  ];
}

/** Read only: a damaged record is left intact until the visitor explicitly resets it. */
export function readFavorites(storage: StorageLike): string[] {
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    throw new Error(
      "Избранное недоступно: браузер запретил локальное хранение. Разрешите его в настройках и попробуйте снова.",
    );
  }
  if (raw === null) return [];
  try {
    if (raw.length > 16_384) throw new Error();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error();
    const envelope = parsed as { version?: unknown; favorites?: unknown };
    if (
      envelope.version !== 1 ||
      !Array.isArray(envelope.favorites) ||
      !envelope.favorites.every((id) => typeof id === "string")
    )
      throw new Error();
    // Menu changes may retire IDs. Unknown IDs are omitted; the stored record is not rewritten.
    return sanitizeFavorites(envelope.favorites);
  } catch {
    throw new Error(
      "Сохранённое избранное повреждено или имеет неизвестный формат. Сбросьте избранное, чтобы начать заново.",
    );
  }
}

/** Returns the deduplicated, known IDs that were saved. Throws if saving fails. */
export function writeFavorites(
  storage: StorageLike,
  ids: readonly string[],
): string[] {
  const favorites = sanitizeFavorites(ids);
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, favorites }));
  } catch {
    throw new Error(
      "Не удалось сохранить избранное. Возможно, хранилище браузера отключено или заполнено. Изменение не сохранено.",
    );
  }
  return favorites;
}

/** An unknown menu item is ignored; the original selection array is never changed. */
export function toggleFavorite(
  current: readonly string[],
  id: string,
): string[] {
  const favorites = sanitizeFavorites(current);
  if (!knownIds.has(id)) return favorites;
  return favorites.includes(id)
    ? favorites.filter((value) => value !== id)
    : [...favorites, id];
}

/** Apply only edits made while storage was unavailable, retaining unrelated saved picks. */
export function mergeFavoriteChanges(
  saved: readonly string[],
  changes: ReadonlyMap<string, boolean>,
): string[] {
  const merged = new Set(sanitizeFavorites(saved));
  for (const [id, selected] of changes) {
    if (!knownIds.has(id)) continue;
    if (selected) merged.add(id);
    else merged.delete(id);
  }
  return [...merged];
}
