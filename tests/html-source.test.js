const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parseHtmlList } = require("../scripts/sources/html-list");

test("official HTML adapter extracts normalized article metadata", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "fixtures", "primeminister-list.html"),
    "utf8",
  );
  const source = {
    id: "primeminister-kz",
    name: "Prime Minister",
    baseUrl: "https://primeminister.kz",
    selectors: {
      item: ".main__article",
      link: "closest:a",
      title: ".main__article-heading",
      summary: ".main__article-text",
      date: ".article__date",
    },
  };

  const items = parseHtmlList(html, source);

  assert.equal(items.length, 1);
  assert.equal(
    items[0].sourceUrl,
    "https://primeminister.kz/ru/news/energy-project-101",
  );
  assert.equal(
    items[0].titleOriginal,
    "Правительство рассмотрело развитие энергетической инфраструктуры",
  );
  assert.equal(
    items[0].summaryOriginal,
    "На заседании рассмотрены открытые данные о ходе проекта.",
  );
  assert.equal(items[0].publishedAt, "2026-07-31T00:00:00+05:00");
});

test("HTML adapter reads ISO datetime attributes", () => {
  const source = {
    id: "nurfin-kz",
    name: "NUR.KZ Finance",
    url: "https://www.nur.kz/nurfin/",
    language: "ru",
    selectors: {
      item: ".article-card",
      link: ".article-card__title",
      title: ".article-card__title",
      date: ".article-card__date",
      dateAttr: "datetime",
    },
  };
  const html = `
    <article class="article-card">
      <a class="article-card__title" href="/nurfin/economy/42-test/">Новый инвестиционный проект</a>
      <time class="article-card__date" datetime="2026-07-31T11:00:17.000Z">31 июля 2026, 16:00</time>
    </article>`;

  const [item] = parseHtmlList(html, source);

  assert.equal(item.publishedAt, "2026-07-31T11:00:17.000Z");
});

test("HTML adapter parses Russian publication dates in Almaty time", () => {
  const source = {
    id: "akorda-kz",
    name: "Akorda",
    url: "https://akorda.kz/ru/events",
    language: "ru",
    selectors: {
      item: ".card",
      link: "h3 a",
      title: "h3 a",
      date: "h5",
    },
  };
  const html = `
    <div class="card">
      <h3><a href="/ru/investicionnoe-soveshchanie-42">Инвестиционное совещание</a></h3>
      <h5>1 августа 2026 года</h5>
    </div>`;

  const [item] = parseHtmlList(html, source);

  assert.equal(item.publishedAt, "2026-08-01T00:00:00+05:00");
});
