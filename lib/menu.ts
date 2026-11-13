/** Fictional menu and illustrative prices for the «Пауза» portfolio demo. */
export type Category = "all" | "coffee" | "tea" | "desserts";
export type MenuCategory = Exclude<Category, "all">;
export interface MenuItem {
  id: string;
  title: string;
  category: MenuCategory;
  description: string;
  ingredients: string[];
  /** Illustrative price in whole Russian rubles, not an offer for sale. */
  price: number;
  volume: string;
  tags: string[];
  image: string;
}

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "all", label: "Всё меню" },
  { value: "coffee", label: "Кофе" },
  { value: "tea", label: "Чай и какао" },
  { value: "desserts", label: "Десерты" },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "espresso",
    title: "Эспрессо",
    category: "coffee",
    description: "Небольшая чашка с плотным вкусом и карамельным послевкусием.",
    ingredients: ["Кофе", "Вода"],
    price: 160,
    volume: "35 мл",
    tags: ["Классика", "Чёрный кофе"],
    image: "/images/black-coffee.jpg",
  },
  {
    id: "americano",
    title: "Американо",
    category: "coffee",
    description:
      "Эспрессо с горячей водой — для тех, кто любит растянуть момент.",
    ingredients: ["Эспрессо", "Вода"],
    price: 190,
    volume: "250 мл",
    tags: ["Классика", "Чёрный кофе"],
    image: "/images/black-coffee.jpg",
  },
  {
    id: "cappuccino",
    title: "Капучино",
    category: "coffee",
    description: "Знакомый баланс эспрессо, тёплого молока и воздушной пены.",
    ingredients: ["Эспрессо", "Молоко"],
    price: 270,
    volume: "250 мл",
    tags: ["Классика", "С молоком"],
    image: "/images/latte.jpg",
  },
  {
    id: "latte",
    title: "Латте",
    category: "coffee",
    description:
      "Мягкий молочный кофе, к которому так и просится что-нибудь сладкое.",
    ingredients: ["Эспрессо", "Молоко"],
    price: 290,
    volume: "300 мл",
    tags: ["Нежный", "С молоком"],
    image: "/images/latte.jpg",
  },
  {
    id: "flat-white",
    title: "Флэт уайт",
    category: "coffee",
    description:
      "Двойной эспрессо и тонкая молочная текстура с выразительным вкусом кофе.",
    ingredients: ["Двойной эспрессо", "Молоко"],
    price: 290,
    volume: "200 мл",
    tags: ["Насыщенный", "С молоком"],
    image: "/images/latte.jpg",
  },
  {
    id: "iced-latte",
    title: "Айс-латте",
    category: "coffee",
    description:
      "Эспрессо и прохладное молоко со льдом для неспешной прогулки.",
    ingredients: ["Эспрессо", "Молоко", "Лёд"],
    price: 320,
    volume: "350 мл",
    tags: ["Со льдом", "С молоком"],
    image: "/images/iced-coffee.jpg",
  },
  {
    id: "matcha-latte",
    title: "Матча латте",
    category: "tea",
    description:
      "Зелёный чай матча, взбитый с молоком до мягкой кремовой текстуры.",
    ingredients: ["Чай матча", "Молоко", "Вода"],
    price: 340,
    volume: "300 мл",
    tags: ["Чайная пауза", "С молоком"],
    image: "/images/matcha.jpg",
  },
  {
    id: "earl-grey",
    title: "Эрл грей",
    category: "tea",
    description:
      "Чёрный чай с ароматом бергамота и спокойным цитрусовым характером.",
    ingredients: ["Чёрный чай", "Бергамот", "Вода"],
    price: 220,
    volume: "400 мл",
    tags: ["Чайная пауза", "Классика"],
    image: "/images/tea.jpg",
  },
  {
    id: "cocoa",
    title: "Какао",
    category: "tea",
    description:
      "Горячий шоколадный напиток на молоке с лёгкой ванильной нотой.",
    ingredients: ["Какао-порошок", "Молоко", "Сахар", "Ваниль"],
    price: 280,
    volume: "300 мл",
    tags: ["Шоколадный", "С молоком"],
    image: "/images/cocoa.jpg",
  },
  {
    id: "butter-croissant",
    title: "Круассан",
    category: "desserts",
    description:
      "Слоёный круассан со сливочным маслом и тонкой хрустящей корочкой.",
    ingredients: [
      "Пшеничная мука",
      "Сливочное масло",
      "Молоко",
      "Дрожжи",
      "Сахар",
      "Яйцо",
      "Соль",
    ],
    price: 210,
    volume: "80 г",
    tags: ["Выпечка", "Классика"],
    image: "/images/croissant.jpg",
  },
  {
    id: "almond-croissant",
    title: "Миндальный круассан",
    category: "desserts",
    description:
      "Слоёное тесто, миндальный крем и лепестки миндаля к любимой чашке.",
    ingredients: [
      "Пшеничная мука",
      "Сливочное масло",
      "Миндаль",
      "Молоко",
      "Яйцо",
      "Сахар",
      "Дрожжи",
      "Соль",
    ],
    price: 290,
    volume: "110 г",
    tags: ["Выпечка", "Миндальный"],
    image: "/images/croissant.jpg",
  },
  {
    id: "cheesecake",
    title: "Чизкейк",
    category: "desserts",
    description: "Нежная сливочная начинка на рассыпчатой песочной основе.",
    ingredients: [
      "Сливочный сыр",
      "Сливки",
      "Сахар",
      "Яйцо",
      "Пшеничная мука",
      "Сливочное масло",
      "Ваниль",
    ],
    price: 360,
    volume: "140 г",
    tags: ["Нежный", "К кофе"],
    image: "/images/cheesecake.jpg",
  },
];

export type MenuSort = "default" | "price-asc" | "price-desc";
export interface MenuFilters {
  category?: Category;
  query?: string;
  favoritesOnly?: boolean;
  favorites?: readonly string[];
  sort?: MenuSort;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .trim()
    .replace(/\s+/g, " ");
}

/** Combines filters without mutating either menu items or the caller's array. */
export function filterMenu(
  items: readonly MenuItem[],
  filters: MenuFilters = {},
): MenuItem[] {
  const {
    category = "all",
    favoritesOnly = false,
    favorites = [],
    sort = "default",
  } = filters;
  const terms = normalizeSearch(filters.query ?? "")
    .split(" ")
    .filter(Boolean);
  const favoriteIds = new Set(favorites);
  const result = items.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (favoritesOnly && !favoriteIds.has(item.id)) return false;
    const categoryLabel =
      CATEGORY_OPTIONS.find((option) => option.value === item.category)
        ?.label ?? "";
    const searchable = normalizeSearch(
      [
        item.title,
        item.description,
        ...item.ingredients,
        ...item.tags,
        categoryLabel,
      ].join(" "),
    );
    return terms.every((term) => searchable.includes(term));
  });
  if (sort === "price-asc") result.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") result.sort((a, b) => b.price - a.price);
  return result;
}
