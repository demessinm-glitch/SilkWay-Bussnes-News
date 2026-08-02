const { test } = require("node:test");
const assert = require("node:assert/strict");
const { collectSources } = require("../scripts/sync-news");

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
