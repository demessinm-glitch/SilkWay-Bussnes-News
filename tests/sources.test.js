const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("source registry has enabled official, business and legal feeds", () => {
  const registryPath = path.join(
    __dirname,
    "..",
    "data",
    "config",
    "sources.json",
  );
  const sources = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const enabled = sources.filter((source) => source.enabled);

  assert.ok(enabled.length >= 3);
  assert.ok(enabled.some((source) => source.type === "official"));
  assert.ok(enabled.some((source) => source.type === "business_media"));
  assert.ok(enabled.some((source) => source.type === "legal"));
  for (const source of enabled) {
    assert.match(source.url, /^https:\/\//);
    assert.ok(["rss", "html-list"].includes(source.adapter));
    assert.ok(source.copyrightMode);
  }
});
