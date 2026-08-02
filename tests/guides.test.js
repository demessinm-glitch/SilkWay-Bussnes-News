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

test("Chinese investor start-up and MFA guides cite multiple official sources", () => {
  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/guides/index.json"), "utf8"),
  );
  const guides = [
    data.items.find((item) => item.id === "start-business-chinese-investor"),
    data.items.find((item) => item.id === "mfa-china-business"),
  ];

  for (const guide of guides) {
    assert.ok(guide, "required Chinese investor guide is missing");
    assert.ok(guide.officialSources.length >= 4);
    assert.ok(
      guide.officialSources.every((source) => /^https:\/\//.test(source.url)),
    );
    assert.ok(
      guide.officialSources.some((source) =>
        /gov\.kz|egov\.kz/.test(source.url),
      ),
    );
    assert.ok(
      guide.officialSources.every(
        (source) => !Number.isNaN(Date.parse(source.verifiedAt)),
      ),
    );
  }

  const start = guides[0];
  assert.ok(
    start.officialSources.some((source) => /egov\.kz/.test(source.url)),
  );
  assert.ok(
    start.officialSources.some((source) => /invest\.gov\.kz/.test(source.url)),
  );
  assert.match(start.summaryZh, /中国/);
});

test("guide detail renders every official source", () => {
  const script = fs.readFileSync(
    path.join(__dirname, "../assets/js/guide-detail.js"),
    "utf8",
  );
  assert.match(script, /guide\.officialSources/);
});
