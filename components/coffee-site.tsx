"use client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORY_OPTIONS,
  MENU_ITEMS,
  filterMenu,
  type Category,
  type MenuItem,
  type MenuSort,
} from "@/lib/menu";
import {
  readFavorites,
  writeFavorites,
  toggleFavorite,
  mergeFavoriteChanges,
  STORAGE_KEY,
} from "@/lib/favorites";
import { sitePath } from "@/lib/paths";
import { Icon } from "./icons";

const rubles = (price: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(price);
const FAQ = [
  [
    "Как работает избранное?",
    "Нажмите на сердечко у напитка или десерта. Список сохранится в этом браузере и останется после обновления страницы. На другом устройстве будет своё избранное.",
  ],
  [
    "Можно ли сделать заказ на сайте?",
    "Это демонстрационная кофейня для портфолио. Здесь можно изучить меню и сохранить понравившееся, но оформить настоящий заказ или оплатить его нельзя.",
  ],
  [
    "Цены и состав настоящие?",
    "Меню, цены и описания придуманы для демонстрации сайта. Фотографии иллюстрируют позиции. Перед использованием для настоящей кофейни нужно согласовать меню, состав и цены.",
  ],
  [
    "Где находится «Пауза»?",
    "«Пауза» — вымышленная кофейня. Этот проект показывает, каким может быть сайт реального места. Поэтому здесь нет адреса, телефона и часов работы.",
  ],
];

export default function CoffeeSite() {
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<MenuSort>("default");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const favoritesRef = useRef<string[]>([]);
  const pendingChanges = useRef(new Map<string, boolean>());
  const [storageState, setStorageState] = useState<
    "loading" | "ready" | "unavailable" | "corrupt"
  >("loading");
  const storageRef = useRef<"loading" | "ready" | "unavailable" | "corrupt">(
    "loading",
  );
  const [storageError, setStorageError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const menuHeading = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const refreshFavorites = useCallback(() => {
    try {
      const saved = readFavorites(window.localStorage);
      const ids = pendingChanges.current.size
        ? writeFavorites(
            window.localStorage,
            mergeFavoriteChanges(saved, pendingChanges.current),
          )
        : saved;
      pendingChanges.current.clear();
      favoritesRef.current = ids;
      setFavorites(ids);
      storageRef.current = "ready";
      setStorageState("ready");
      setStorageError("");
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Браузер не разрешил доступ к избранному.";
      const state = /поврежден|неизвестный формат/.test(message)
        ? "corrupt"
        : "unavailable";
      storageRef.current = state;
      setStorageState(state);
      setStorageError(message);
    }
  }, []);
  useEffect(() => {
    refreshFavorites();
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) refreshFavorites();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [refreshFavorites]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (activeItem && !dialog.open) dialog.showModal();
    else if (!activeItem && dialog.open) dialog.close();
  }, [activeItem]);

  const visible = useMemo(
    () =>
      filterMenu(MENU_ITEMS, {
        category,
        query,
        favoritesOnly,
        favorites,
        sort,
      }),
    [category, query, favoritesOnly, favorites, sort],
  );
  function setFavorite(id: string) {
    if (storageRef.current === "loading") return;
    if (storageRef.current === "corrupt") {
      setNotice(
        "Сначала сбросьте повреждённое избранное в сообщении над меню. Сохранённые данные не изменены.",
      );
      return;
    }
    const next = toggleFavorite(favoritesRef.current, id);
    pendingChanges.current.set(id, next.includes(id));
    const item = MENU_ITEMS.find((item) => item.id === id)!;
    let saved = true;
    let current = next;
    try {
      const previous = readFavorites(window.localStorage);
      current = writeFavorites(
        window.localStorage,
        mergeFavoriteChanges(previous, pendingChanges.current),
      );
      pendingChanges.current.clear();
      storageRef.current = "ready";
      setStorageState("ready");
      setStorageError("");
    } catch (caught) {
      if (
        caught instanceof Error &&
        /поврежден|неизвестный формат/.test(caught.message)
      ) {
        storageRef.current = "corrupt";
        setStorageState("corrupt");
        setStorageError(caught.message);
        setNotice(
          "Сохранённое избранное повреждено. Изменение не сохранено; сбросьте данные, чтобы начать заново.",
        );
        return;
      }
      saved = false;
      storageRef.current = "unavailable";
      setStorageState("unavailable");
      setStorageError(
        "Не удалось сохранить избранное. Сейчас оно работает только до закрытия этой вкладки.",
      );
    }
    favoritesRef.current = current;
    setFavorites(current);
    setNotice(
      `${item.title}: ${current.includes(id) ? "добавлено в избранное" : "удалено из избранного"}.${saved ? " Список сохранён в этом браузере." : " Изменение не сохранено."}`,
    );
  }
  function resetFavorites() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      pendingChanges.current.clear();
      favoritesRef.current = [];
      setFavorites([]);
      setConfirmReset(false);
      storageRef.current = "ready";
      setStorageState("ready");
      setStorageError("");
      setNotice("Избранное сброшено. Можно собрать новый список.");
    } catch {
      setStorageError(
        "Не удалось сбросить избранное: хранилище браузера недоступно.",
      );
    }
  }
  function goToMenu(onlyFavorites = false) {
    setFavoritesOnly(onlyFavorites);
    setCategory("all");
    setQuery("");
    setMobileOpen(false);
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
    menuHeading.current?.focus({ preventScroll: true });
  }
  function resetFilters() {
    setCategory("all");
    setQuery("");
    setFavoritesOnly(false);
    setSort("default");
  }
  function openItem(item: MenuItem, trigger: HTMLElement) {
    lastTrigger.current = trigger;
    setActiveItem(item);
  }
  function closeItem() {
    setActiveItem(null);
    requestAnimationFrame(() => {
      if (lastTrigger.current?.isConnected) lastTrigger.current.focus();
      else menuHeading.current?.focus({ preventScroll: true });
    });
  }

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <a href="#top" className="brand" aria-label="Пауза — на главную">
            <span className="brand-icon">
              <Icon name="cup" size={25} />
            </span>
            <span>
              пауза<span className="brand-dot">.</span>
              <small>кофе и немного времени</small>
            </span>
          </a>
          <nav aria-label="Основная навигация" className="desktop-nav">
            <a href="#menu">Меню</a>
            <a href="#about">О месте</a>
            <a href="#faq">Хорошо знать</a>
          </nav>
          <div className="header-actions">
            <span className="demo-pill">Демо-кофейня</span>
            <button
              className="header-favorites"
              type="button"
              onClick={() => goToMenu(true)}
              aria-label={`Открыть избранное, позиций: ${favorites.length}`}
            >
              <Icon name="heart" size={19} />
              <span className="favorite-text">Избранное</span>
              <span className="favorite-count">{favorites.length}</span>
            </button>
            <button
              className="mobile-toggle"
              type="button"
              aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <Icon name="close" />
              ) : (
                <span>
                  <i />
                  <i />
                </span>
              )}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav
            id="mobile-nav"
            className="mobile-nav"
            aria-label="Мобильная навигация"
          >
            <a href="#menu" onClick={() => setMobileOpen(false)}>
              Меню
            </a>
            <a href="#about" onClick={() => setMobileOpen(false)}>
              О месте
            </a>
            <a href="#faq" onClick={() => setMobileOpen(false)}>
              Хорошо знать
            </a>
          </nav>
        )}
      </header>

      <main id="main">
        <section className="hero container" aria-labelledby="hero-title">
          <Image
            className="hero-image"
            src={sitePath("/images/hero.jpg")}
            alt="Тёплая атмосфера кофейни и ароматный кофе"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 1400px"
          />
          <div className="hero-shade" />
          <div className="hero-content">
            <span className="eyebrow">У каждого дня есть свой ритм</span>
            <h1 id="hero-title">
              Давайте
              <br />
              сделаем
              <br />
              <em>паузу.</em>
            </h1>
            <p>
              Любимый кофе. Что-нибудь к нему.
              <br />И немного времени для себя.
            </p>
            <a
              href="#menu"
              className="button button-cream"
              onClick={resetFilters}
            >
              Найти свой вкус
              <Icon name="arrow" size={19} />
            </a>
          </div>
          <div className="hero-bottom">
            <span>КОФЕ / ВЫПЕЧКА / МАЛЕНЬКИЕ РАДОСТИ</span>
            <span>
              Можно просто не спешить <span aria-hidden="true">↘</span>
            </span>
          </div>
          <div className="hero-stamp" aria-hidden="true">
            <Icon name="sun" size={31} />
            <span>
              МЕСТО
              <br />
              ДЛЯ ВАШЕЙ
              <br />
              <em>паузы</em>
            </span>
          </div>
        </section>

        <div className="intro-strip container">
          <span>Тёплые чашки</span>
          <i aria-hidden="true">✳</i>
          <span>Знакомые вкусы</span>
          <i aria-hidden="true">✳</i>
          <span>Ваш собственный темп</span>
        </div>

        <section
          className="menu-section section container"
          id="menu"
          aria-labelledby="menu-title"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">01 / Выбирайте по настроению</span>
              <h2 id="menu-title" tabIndex={-1} ref={menuHeading}>
                Что сделает
                <br />
                день <em>вкуснее?</em>
              </h2>
            </div>
            <div className="menu-intro">
              <p>
                Для первого глотка, долгого разговора
                <br className="desktop-break" /> или маленького «просто так».
              </p>
              <span>Меню и цены демонстрационные</span>
            </div>
          </div>

          <div className="menu-tools">
            <div className="search-box">
              <Icon name="search" size={19} />
              <label className="sr-only" htmlFor="menu-search">
                Поиск по меню
              </label>
              <input
                id="menu-search"
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Латте, миндаль или что-то ещё…"
                type="search"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Очистить поиск"
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                >
                  <Icon name="close" size={17} />
                </button>
              )}
            </div>
            <div className="sort-control">
              <label htmlFor="menu-sort">Порядок</label>
              <select
                id="menu-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as MenuSort)}
              >
                <option value="default">Как в меню</option>
                <option value="price-asc">Сначала дешевле</option>
                <option value="price-desc">Сначала дороже</option>
              </select>
            </div>
          </div>
          <div className="menu-filters">
            <fieldset className="category-filters">
              <legend className="sr-only">Категории меню</legend>
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={category === option.value ? "active" : ""}
                  aria-pressed={category === option.value}
                  onClick={() => setCategory(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </fieldset>
            <button
              type="button"
              className={`favorites-filter ${favoritesOnly ? "active" : ""}`}
              aria-pressed={favoritesOnly}
              onClick={() => setFavoritesOnly(!favoritesOnly)}
            >
              <Icon name="heart" size={17} filled={favoritesOnly} />
              Только избранное<span>{favorites.length}</span>
            </button>
          </div>
          {storageError && (
            <div className="storage-notice" role="alert">
              <p>{storageError}</p>
              {storageState === "corrupt" && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setConfirmReset(true)}
                >
                  Сбросить избранное
                </button>
              )}
              {storageState === "unavailable" && (
                <button
                  type="button"
                  className="text-button"
                  onClick={refreshFavorites}
                >
                  Попробовать снова
                </button>
              )}
            </div>
          )}
          {confirmReset && (
            <div
              className="reset-confirm"
              role="group"
              aria-labelledby="reset-title"
            >
              <strong id="reset-title">Сбросить избранное?</strong>
              <p>
                Будет удалён только список кофейни «Пауза» из этого браузера.
              </p>
              <button
                className="button button-small"
                type="button"
                onClick={resetFavorites}
              >
                Да, сбросить
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() => setConfirmReset(false)}
              >
                Оставить как есть
              </button>
            </div>
          )}
          <div className="results-line">
            <p aria-live="polite" aria-atomic="true">
              {favoritesOnly ? "В избранном" : "В меню"}: {visible.length}
              {query.trim() && <span> · по запросу «{query.trim()}»</span>}
            </p>
            {(category !== "all" ||
              query ||
              favoritesOnly ||
              sort !== "default") && (
              <button type="button" onClick={resetFilters}>
                Сбросить фильтры
                <Icon name="close" size={13} />
              </button>
            )}
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {notice}
          </p>
          {visible.length ? (
            <div className="menu-grid">
              {visible.map((item) => (
                <article
                  className="menu-card"
                  key={item.id}
                  aria-labelledby={`item-${item.id}`}
                >
                  <div className="card-visual">
                    <button
                      type="button"
                      className="product-image-button"
                      aria-label={`Подробнее: ${item.title}`}
                      onClick={(event) => openItem(item, event.currentTarget)}
                    >
                      <Image
                        src={sitePath(item.image as `/${string}`)}
                        alt={item.title}
                        fill
                        sizes="(max-width: 560px) 100vw, (max-width: 1000px) 50vw, 33vw"
                      />
                    </button>
                    <span className="card-tag">{item.tags[0]}</span>
                    <button
                      type="button"
                      className={`heart-button ${favorites.includes(item.id) ? "is-favorite" : ""}`}
                      aria-label={`${favorites.includes(item.id) ? "Удалить" : "Добавить"} ${item.title} ${favorites.includes(item.id) ? "из избранного" : "в избранное"}`}
                      aria-pressed={favorites.includes(item.id)}
                      disabled={storageState === "loading"}
                      onClick={() => setFavorite(item.id)}
                    >
                      <Icon
                        name="heart"
                        size={20}
                        filled={favorites.includes(item.id)}
                      />
                    </button>
                  </div>
                  <div className="card-content">
                    <div className="card-title-row">
                      <h3 id={`item-${item.id}`}>
                        <button
                          type="button"
                          onClick={(event) =>
                            openItem(item, event.currentTarget)
                          }
                        >
                          {item.title}
                        </button>
                      </h3>
                      <span>{rubles(item.price)}</span>
                    </div>
                    <p>{item.description}</p>
                    <div className="card-bottom">
                      <span>{item.volume}</span>
                      <button
                        type="button"
                        onClick={(event) => openItem(item, event.currentTarget)}
                        aria-label={`Состав и детали: ${item.title}`}
                      >
                        Состав и детали
                        <Icon name="arrow" size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span>
                <Icon name={favoritesOnly ? "heart" : "search"} size={35} />
              </span>
              <h3>
                {favoritesOnly
                  ? "Любимое ещё найдётся."
                  : "Такого вкуса пока нет."}
              </h3>
              <p>
                {favoritesOnly && !favorites.length
                  ? "Нажмите на сердечко у напитка или десерта — и он появится здесь."
                  : "Попробуйте другой запрос или сбросьте фильтры. В меню ещё много приятного."}
              </p>
              <button className="button" type="button" onClick={resetFilters}>
                Открыть всё меню
                <Icon name="arrow" size={17} />
              </button>
            </div>
          )}
          <div className="menu-note">
            <Icon name="heart" size={16} />
            <p>
              Сохраните любимое, чтобы не искать в следующий раз. Избранное
              остаётся только в этом браузере.
            </p>
          </div>
        </section>

        <section
          className="about-section"
          id="about"
          aria-labelledby="about-title"
        >
          <div className="container about-grid">
            <div className="about-visual">
              <Image
                src={sitePath("/images/interior.jpg")}
                alt="Уютное пространство кофейни с тёплым светом"
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
              />
              <span className="photo-note">Маленькая пауза в большом дне</span>
            </div>
            <div className="about-copy">
              <span className="eyebrow">02 / Больше, чем чашка</span>
              <h2 id="about-title">
                Не спешить —<br />
                тоже <em>план.</em>
              </h2>
              <p>
                Иногда лучший пункт в расписании — тот, где можно просто
                выдохнуть. Выбрать кофе, открыть книгу или поговорить обо всём
                на свете.
              </p>
              <p>
                Такой мы придумали «Паузу»: небольшую кофейню с понятным меню и
                вниманием к простым радостям.
              </p>
              <div className="about-values">
                <div>
                  <Icon name="cup" size={24} />
                  <span>
                    За любимым
                    <br />
                    вкусом
                  </span>
                </div>
                <div>
                  <Icon name="sun" size={25} />
                  <span>
                    За спокойным
                    <br />
                    моментом
                  </span>
                </div>
                <div>
                  <Icon name="heart" size={24} />
                  <span>
                    За маленькой
                    <br />
                    радостью
                  </span>
                </div>
              </div>
              <a href="#menu" className="text-link">
                Ваша пауза начинается здесь
                <Icon name="arrow" size={17} />
              </a>
            </div>
          </div>
        </section>

        <section className="favorites-banner container">
          <div className="banner-heart">
            <Icon name="heart" size={49} />
          </div>
          <div>
            <span className="eyebrow">Хорошее хочется повторить</span>
            <h2>
              Для вашего
              <br />
              <em>«как обычно».</em>
            </h2>
          </div>
          <div className="favorites-banner-copy">
            <p>
              Соберите свой маленький список.
              <br />
              Любимые вкусы будут ждать вас здесь.
            </p>
            <button
              className="button"
              type="button"
              onClick={() => goToMenu(true)}
            >
              Моё избранное
              <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>

        <section
          className="faq-section section container"
          id="faq"
          aria-labelledby="faq-title"
        >
          <div className="faq-intro">
            <span className="eyebrow">03 / Хорошо знать</span>
            <h2 id="faq-title">
              Ещё пара
              <br />
              <em>моментов.</em>
            </h2>
            <p>
              О меню, избранном
              <br />и этой демо-кофейне.
            </p>
          </div>
          <div className="faq-list">
            {FAQ.map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-upper">
            <span>КОФЕ И НЕМНОГО ВРЕМЕНИ</span>
            <a href="#menu">
              Ещё одну чашку?
              <Icon name="arrow" size={18} />
            </a>
          </div>
          <div className="footer-wordmark" aria-label="Пауза">
            пауза<span>.</span>
          </div>
          <div className="footer-bottom">
            <p>
              Демонстрационный проект для портфолио.
              <br />
              Кофейня вымышленная. Меню и цены условные.
            </p>
            <p>
              Заказы и оплата не оформляются.
              <br />
              Избранное хранится в вашем браузере.
            </p>
            <a
              href="https://github.com/skrlv/pauza-coffee-demo"
              target="_blank"
              rel="noreferrer"
            >
              Проект на GitHub
              <Icon name="arrow" size={14} />
            </a>
            <a href="#top">Наверх ↑</a>
          </div>
        </div>
      </footer>

      <dialog
        ref={dialogRef}
        className="product-dialog"
        aria-labelledby="dialog-title"
        onCancel={(event) => {
          event.preventDefault();
          closeItem();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeItem();
        }}
      >
        {activeItem && (
          <div className="dialog-layout">
            <div className="dialog-image">
              <Image
                src={sitePath(activeItem.image as `/${string}`)}
                alt={activeItem.title}
                fill
                sizes="(max-width: 640px) 100vw, 420px"
              />
            </div>
            <div className="dialog-content">
              <button
                className="dialog-close"
                type="button"
                aria-label="Закрыть карточку"
                onClick={closeItem}
                autoFocus
              >
                <Icon name="close" size={22} />
              </button>
              <span className="eyebrow">
                {
                  CATEGORY_OPTIONS.find(
                    (option) => option.value === activeItem.category,
                  )?.label
                }
              </span>
              <h2 id="dialog-title">{activeItem.title}</h2>
              <p className="dialog-description">{activeItem.description}</p>
              <div className="dialog-price">
                <strong>{rubles(activeItem.price)}</strong>
                <span>{activeItem.volume}</span>
              </div>
              <h3>Что внутри</h3>
              <p className="ingredients">
                {activeItem.ingredients.join(", ")}.
              </p>
              <p className="dialog-demo">
                Позиция демонстрационная. Фотография — иллюстрация, состав и
                цена условные.
              </p>
              <button
                className="button dialog-favorite"
                type="button"
                onClick={() => setFavorite(activeItem.id)}
                aria-pressed={favorites.includes(activeItem.id)}
              >
                <Icon
                  name="heart"
                  size={18}
                  filled={favorites.includes(activeItem.id)}
                />
                {favorites.includes(activeItem.id)
                  ? "Убрать из избранного"
                  : "В избранное"}
              </button>
              <p className="dialog-storage-note">
                {storageState === "corrupt"
                  ? "Чтобы сохранять позиции, сбросьте повреждённое избранное в меню."
                  : storageState === "unavailable"
                    ? "Список временный: сохранение в браузере недоступно."
                    : "Останется в этом браузере для следующей паузы."}
              </p>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
