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
