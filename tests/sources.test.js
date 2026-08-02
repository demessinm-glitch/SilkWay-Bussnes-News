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

test("source registry contains every user-requested Kazakhstan outlet", () => {
  const sources = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "data", "config", "sources.json"),
      "utf8",
    ),
  );
  const byId = new Map(sources.map((source) => [source.id, source]));
  const requestedIds = [
    "forbes-kz",
    "kapital-kz",
    "inbusiness-kz",
    "zakon-kz",
    "nurfin-kz",
    "orda-kz",
    "vlast-kz",
    "egov-news",
    "akorda-kz",
    "informburo-kz",
    "qaj-kz",
    "mfa-kz",
  ];

  for (const id of requestedIds) assert.ok(byId.has(id), `missing ${id}`);
  assert.equal(byId.get("qaj-kz").enabled, false);
  assert.match(byId.get("qaj-kz").disabledReason, /TLS/i);
  assert.ok(
    requestedIds
      .filter((id) => id !== "qaj-kz")
      .every((id) => byId.get(id).enabled),
  );
});
