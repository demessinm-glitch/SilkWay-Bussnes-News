const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  collectSources,
  mergeLatest,
  prepareCandidates,
} = require("../scripts/sync-news");

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

test("candidate preparation rejects non-business noise before AI and sorts newest first", () => {
  const candidates = prepareCandidates(
    [
      {
        sourceId: "inbusiness-kz",
        sourceType: "business_media",
        sourceUrl: "https://inbusiness.kz/ru/news/fire",
        titleOriginal: "Пожары в Баянауле: что происходит в лесах",
        publishedAt: "2026-08-02T18:15:00Z",
      },
      {
        sourceId: "forbes-kz",
        sourceType: "business_media",
        sourceUrl: "https://forbes.kz/articles/industry",
        titleOriginal: "Казахстан ускоряет развитие промышленного производства",
        publishedAt: "2026-08-02T17:00:00Z",
      },
      {
        sourceId: "mfa-kz",
        sourceType: "official",
        sourceUrl: "https://www.gov.kz/memleket/entities/mfa/news/42",
        titleOriginal: "МИД представил новые инвестиционные проекты",
        publishedAt: "2026-08-02T18:00:00Z",
      },
    ],
    Date.parse("2026-08-03T00:00:00Z"),
  );

  assert.deepEqual(
    candidates.map((item) => item.sourceId),
    ["mfa-kz", "forbes-kz"],
  );
});
