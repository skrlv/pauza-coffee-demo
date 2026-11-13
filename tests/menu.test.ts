import test from "node:test";
import assert from "node:assert/strict";
import { MENU_ITEMS, CATEGORY_OPTIONS, filterMenu } from "../lib/menu.ts";

test("fictional menu contains 12 unique items with usable prices, ingredients and local images", () => {
  assert.equal(MENU_ITEMS.length, 12);
  assert.equal(new Set(MENU_ITEMS.map((item) => item.id)).size, 12);
  for (const item of MENU_ITEMS) {
    assert.ok(item.title.trim() && item.description.trim());
    assert.ok(item.ingredients.length > 0 && item.ingredients.every(Boolean));
    assert.ok(Number.isInteger(item.price) && item.price > 0);
    assert.match(item.volume, /^\d+ (мл|г)$/);
    assert.match(item.image, /^\/images\/[a-z-]+\.jpg$/);
    assert.ok(
      CATEGORY_OPTIONS.some((option) => option.value === item.category),
    );
  }
  assert.deepEqual(
    CATEGORY_OPTIONS.map((option) => option.label),
    ["Всё меню", "Кофе", "Чай и какао", "Десерты"],
  );
});

test("default and all-menu filters return every item in editorial order without sharing the array", () => {
  const result = filterMenu(MENU_ITEMS);
  assert.deepEqual(result, MENU_ITEMS);
  assert.notEqual(result, MENU_ITEMS);
  assert.deepEqual(
    filterMenu(MENU_ITEMS, { category: "all", query: "   " }),
    MENU_ITEMS,
  );
});

test("category filtering separates coffee, tea/cocoa and desserts", () => {
  assert.equal(filterMenu(MENU_ITEMS, { category: "coffee" }).length, 6);
  assert.deepEqual(
    filterMenu(MENU_ITEMS, { category: "tea" }).map((item) => item.id),
    ["matcha-latte", "earl-grey", "cocoa"],
  );
  assert.equal(filterMenu(MENU_ITEMS, { category: "desserts" }).length, 3);
});

test("search ignores case, extra spaces and ё/е differences", () => {
  assert.deepEqual(
    filterMenu(MENU_ITEMS, { query: "  АЙС-ЛАТТЕ  " }).map((item) => item.id),
    ["iced-latte"],
  );
  assert.deepEqual(
    filterMenu(MENU_ITEMS, { query: "ЧЕРНЫЙ КОФЕ" }).map((item) => item.id),
    ["espresso", "americano"],
  );
  assert.deepEqual(
    filterMenu(MENU_ITEMS, { query: "  черный    чай  " }).map(
      (item) => item.id,
    ),
    ["earl-grey"],
  );
});

test("search covers ingredients and tags, with all query terms required", () => {
  assert.deepEqual(
    filterMenu(MENU_ITEMS, { query: "бергамот" }).map((item) => item.id),
    ["earl-grey"],
  );
  assert.deepEqual(
    filterMenu(MENU_ITEMS, { query: "миндаль" }).map((item) => item.id),
    ["almond-croissant"],
  );
  assert.deepEqual(
    filterMenu(MENU_ITEMS, { query: "со льдом" }).map((item) => item.id),
    ["iced-latte"],
  );
  assert.deepEqual(
    filterMenu(MENU_ITEMS, { query: "несуществующий напиток" }),
    [],
  );
});

test("category, query and favorites filter combine rather than replacing one another", () => {
  const favorites = ["iced-latte", "latte", "earl-grey", "retired-item"];
  assert.deepEqual(
    filterMenu(MENU_ITEMS, {
      category: "coffee",
      query: "молоко",
      favoritesOnly: true,
      favorites,
    }).map((item) => item.id),
    ["latte", "iced-latte"],
  );
  assert.deepEqual(
    filterMenu(MENU_ITEMS, { favoritesOnly: true, favorites: [] }),
    [],
  );
  assert.equal(
    filterMenu(MENU_ITEMS, { favoritesOnly: false, favorites: [] }).length,
    12,
  );
});

test("price sorts respect filters, preserve menu order on ties and never mutate the menu", () => {
  const originalOrder = MENU_ITEMS.map((item) => item.id);
  const ascending = filterMenu(MENU_ITEMS, { sort: "price-asc" });
  const descending = filterMenu(MENU_ITEMS, { sort: "price-desc" });
  assert.equal(ascending[0].id, "espresso");
  assert.equal(descending[0].id, "cheesecake");
  assert.deepEqual(
    ascending.filter((item) => item.price === 290).map((item) => item.id),
    ["latte", "flat-white", "almond-croissant"],
  );
  assert.deepEqual(
    filterMenu(MENU_ITEMS, { category: "tea", sort: "price-desc" }).map(
      (item) => item.id,
    ),
    ["matcha-latte", "cocoa", "earl-grey"],
  );
  assert.deepEqual(
    MENU_ITEMS.map((item) => item.id),
    originalOrder,
  );
});
