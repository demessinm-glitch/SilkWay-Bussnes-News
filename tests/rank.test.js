const { test } = require("node:test");
const assert = require("node:assert/strict");
const { selectDaily } = require("../scripts/lib/rank");

test("daily selection enforces quality threshold, category coverage and maximum", () => {
  const items = [
    {
      id: "low",
      category: "economy",
      relevanceScore: 64,
      publishedAt: "2026-08-02T10:00:00+05:00",
    },
    {
      id: "economy",
      category: "economy",
      relevanceScore: 80,
      sourceType: "business_media",
      publishedAt: "2026-08-02T10:00:00+05:00",
    },
    {
      id: "construction",
      category: "construction",
      relevanceScore: 78,
      sourceType: "official",
      publishedAt: "2026-08-02T09:00:00+05:00",
    },
    {
      id: "law",
      category: "law",
      relevanceScore: 76,
      sourceType: "legal",
      publishedAt: "2026-08-02T08:00:00+05:00",
    },
    {
      id: "extra",
      category: "energy",
      relevanceScore: 99,
      sourceType: "business_media",
      publishedAt: "2026-08-02T07:00:00+05:00",
    },
  ];

  const selected = selectDaily(items, {
    max: 3,
    now: new Date("2026-08-02T12:00:00+05:00"),
  });

  assert.equal(selected.length, 3);
  assert.deepEqual(
    new Set(selected.map((item) => item.id)),
    new Set(["economy", "construction", "law"]),
  );
  assert.ok(!selected.some((item) => item.id === "low"));
});
