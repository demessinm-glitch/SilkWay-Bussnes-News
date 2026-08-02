const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("guide catalog has at least eight traceable procedures", () => {
  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/guides/index.json"), "utf8"),
  );
  assert.ok(data.items.length >= 8);
  for (const guide of data.items) {
    assert.ok(guide.id && guide.titleZh && guide.summaryZh);
    assert.ok(["verified", "needs_review"].includes(guide.verificationStatus));
    assert.ok(Array.isArray(guide.steps) && guide.steps.length >= 2);
    assert.ok(Array.isArray(guide.documents) && guide.documents.length >= 1);
    assert.match(guide.sourceUrl, /^https:\/\//);
  }
});
