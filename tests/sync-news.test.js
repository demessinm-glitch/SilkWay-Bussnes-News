const { test } = require("node:test");
const assert = require("node:assert/strict");
const { collectSources, mergeLatest } = require("../scripts/sync-news");

test("merging a new edition removes previously published non-business noise", () => {
  const existing = {
    items: [
      {
        id: "football",
        status: "published",
        sourceType: "business_media",
        titleOriginal: "Ордабасы вернулся на вершину таблицы КПЛ",
        publishedAt: "2026-08-02T10:00:00Z",
      },
      {
        id: "oil",
        status: "published",
        sourceType: "business_media",
        titleOriginal: "Казахстан увеличит добычу нефти по решению ОПЕК+",
        publishedAt: "2026-08-02T09:00:00Z",
      },
    ],
  };

  const merged = mergeLatest(existing, [], "2026-08-02T12:00:00Z");

  assert.deepEqual(
    merged.items.map((item) => item.id),
    ["oil"],
  );
});

test("source collection continues when one adapter fails", async () => {
  const sources = [
    { id: "ok", enabled: true, adapter: "rss" },
    { id: "broken", enabled: true, adapter: "html-list" },
  ];
  const adapters = {
    rss: {
      collect: async () => [
        { sourceUrl: "https://example.kz/1", titleOriginal: "One" },
      ],
    },
    "html-list": {
      collect: async () => {
        throw new Error("temporary outage");
      },
    },
  };

  const result = await collectSources(sources, { adapters, timeoutMs: 100 });

  assert.equal(result.articles.length, 1);
  assert.equal(result.sources.length, 2);
  assert.equal(
    result.sources.find((source) => source.sourceId === "broken").status,
    "failed",
  );
  assert.match(
    result.sources.find((source) => source.sourceId === "broken").errors[0],
    /temporary outage/,
  );
});
