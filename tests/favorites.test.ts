import test from "node:test";
import assert from "node:assert/strict";
import {
  readFavorites,
  writeFavorites,
  toggleFavorite,
  mergeFavoriteChanges,
  STORAGE_KEY,
  type StorageLike,
} from "../lib/favorites.ts";
import { MENU_ITEMS } from "../lib/menu.ts";

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

test("an untouched browser has no favorites and reading never creates a record", () => {
  const storage = memoryStorage();
  assert.deepEqual(readFavorites(storage), []);
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test("favorites persist as a versioned envelope and are restored on a subsequent read", () => {
  const storage = memoryStorage();
  assert.deepEqual(writeFavorites(storage, ["latte", "cheesecake"]), [
    "latte",
    "cheesecake",
  ]);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)!), {
    version: 1,
    favorites: ["latte", "cheesecake"],
  });
  assert.deepEqual(readFavorites(storage), ["latte", "cheesecake"]);
});

test("unknown IDs and duplicates are removed; no more than the known menu can be saved", () => {
  const storage = memoryStorage();
  const known = MENU_ITEMS.map((item) => item.id);
  const input = [...known, ...known, "unknown", "retired"];
  assert.deepEqual(writeFavorites(storage, input), known);
  assert.deepEqual(readFavorites(storage), known);
  assert.equal(input.length, 26);
});

test("retired IDs in an otherwise valid record are ignored without rewriting the original", () => {
  const storage = memoryStorage();
  const raw = JSON.stringify({
    version: 1,
    favorites: ["latte", "retired", "latte"],
  });
  storage.setItem(STORAGE_KEY, raw);
  assert.deepEqual(readFavorites(storage), ["latte"]);
  assert.equal(storage.getItem(STORAGE_KEY), raw);
});

test("toggle is pure, reversible and ignores unknown menu IDs", () => {
  const current = Object.freeze(["latte"]);
  assert.deepEqual(toggleFavorite(current, "cheesecake"), [
    "latte",
    "cheesecake",
  ]);
  assert.deepEqual(toggleFavorite(current, "latte"), []);
  assert.deepEqual(
    toggleFavorite(toggleFavorite(current, "cheesecake"), "cheesecake"),
    current,
  );
  assert.deepEqual(toggleFavorite(current, "unknown"), ["latte"]);
  assert.deepEqual(current, ["latte"]);
});

test("malformed JSON, unsupported versions and invalid entries fail and remain intact until explicit reset", () => {
  const storage = memoryStorage();
  const broken = [
    "",
    "{broken",
    "null",
    "[]",
    JSON.stringify({ version: 2, favorites: [] }),
    JSON.stringify({ version: 1, favorites: [42] }),
    JSON.stringify({ version: 1, favorites: "latte" }),
    "x".repeat(16_385),
  ];
  for (const raw of broken) {
    storage.setItem(STORAGE_KEY, raw);
    assert.throws(() => readFavorites(storage), /повреждено/);
    assert.equal(storage.getItem(STORAGE_KEY), raw);
  }
  storage.setItem("another-app", "keep");
  storage.removeItem(STORAGE_KEY);
  assert.deepEqual(readFavorites(storage), []);
  assert.equal(storage.getItem("another-app"), "keep");
});

test("denied reads and failed writes return meaningful errors without pretending to save", () => {
  const denied: StorageLike = {
    getItem() {
      throw new Error("SecurityError");
    },
    setItem() {
      throw new Error("SecurityError");
    },
    removeItem() {},
  };
  assert.throws(() => readFavorites(denied), /браузер запретил/);
  assert.throws(() => writeFavorites(denied, ["latte"]), /не сохранено/);
  let original = JSON.stringify({ version: 1, favorites: ["espresso"] });
  const full: StorageLike = {
    getItem: () => original,
    setItem() {
      throw new Error("QuotaExceededError");
    },
    removeItem() {
      original = "";
    },
  };
  assert.throws(() => writeFavorites(full, ["latte"]), /не сохранено/);
  assert.deepEqual(readFavorites(full), ["espresso"]);
});

test("merging temporary edits preserves untouched saved picks and applies explicit additions and removals", () => {
  const saved = Object.freeze(["espresso", "latte", "cheesecake"]);
  const changes = new Map([
    ["latte", false],
    ["iced-latte", true],
    ["earl-grey", true],
  ]);
  assert.deepEqual(mergeFavoriteChanges(saved, changes), [
    "espresso",
    "cheesecake",
    "iced-latte",
    "earl-grey",
  ]);
  assert.deepEqual(saved, ["espresso", "latte", "cheesecake"]);
  assert.deepEqual(
    [...changes],
    [
      ["latte", false],
      ["iced-latte", true],
      ["earl-grey", true],
    ],
  );
});

test("merge sanitizes old data, ignores unknown changes and deduplicates already saved additions", () => {
  assert.deepEqual(
    mergeFavoriteChanges(
      ["latte", "retired", "latte", "espresso"],
      new Map([
        ["latte", true],
        ["unknown", true],
        ["also-unknown", false],
        ["espresso", false],
      ]),
    ),
    ["latte"],
  );
  assert.deepEqual(
    mergeFavoriteChanges(["latte", "retired", "latte"], new Map()),
    ["latte"],
  );
  assert.deepEqual(
    mergeFavoriteChanges(
      [],
      new Map([
        ["cheesecake", true],
        ["latte", false],
      ]),
    ),
    ["cheesecake"],
  );
});

test("final desired state wins after repeated temporary edits and recovered list can be persisted", () => {
  const changes = new Map<string, boolean>();
  changes.set("latte", true);
  changes.set("latte", false);
  changes.set("cheesecake", false);
  changes.set("cheesecake", true);
  const storage = memoryStorage();
  writeFavorites(storage, ["latte", "espresso"]);
  const merged = mergeFavoriteChanges(readFavorites(storage), changes);
  writeFavorites(storage, merged);
  assert.deepEqual(readFavorites(storage), ["espresso", "cheesecake"]);
});
