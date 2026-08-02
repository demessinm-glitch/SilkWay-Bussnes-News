const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  canonicalizeUrl,
  deduplicateArticles,
} = require("../scripts/lib/dedupe");

test("news deduplication ignores tracking parameters and keeps the richer record", () => {
  const tracked =
    "https://example.kz/news/item/?utm_source=rss&utm_campaign=daily#story";
  assert.equal(canonicalizeUrl(tracked), "https://example.kz/news/item");

  const articles = [
    {
      id: "a",
      sourceUrl: tracked,
      titleOriginal: "Новый логистический центр",
      text: "Коротко",
    },
    {
      id: "b",
      sourceUrl: "https://example.kz/news/item",
      titleOriginal: "Новый логистический центр",
      text: "Подробный исходный текст новости",
    },
  ];
  const result = deduplicateArticles(articles);

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "b");
  assert.equal(result[0].canonicalUrl, "https://example.kz/news/item");
});
