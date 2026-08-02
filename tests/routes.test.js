const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("required Chinese routes exist while legacy city URLs stay available", () => {
  const required = [
    "news.html",
    "news-detail.html",
    "officials.html",
    "official-detail.html",
    "guides.html",
    "guide-detail.html",
    "tenders.html",
    "sources.html",
    "services.html",
    "about.html",
    "404.html",
  ];
  const legacy = ["almaty-json.html", "astana-json.html", "shymkent-json.html"];

  for (const filename of required) {
    const fullPath = path.join(root, filename);
    assert.ok(fs.existsSync(fullPath), `${filename} is missing`);
    assert.match(fs.readFileSync(fullPath, "utf8"), /<html[^>]+lang="zh-CN"/);
  }
  for (const filename of legacy)
    assert.ok(
      fs.existsSync(path.join(root, filename)),
      `${filename} was removed`,
    );
});
