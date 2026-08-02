const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (relative) =>
  JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));

function officialHttps(value, label) {
  assert.match(value, /^https:\/\//, `${label} must use HTTPS`);
  const hostname = new URL(value).hostname;
  assert.ok(
    hostname === "gov.kz" || hostname.endsWith(".gov.kz"),
    `${label} must point to an official government domain`,
  );
}

test("remaining regional akimats expose source-backed leaders and public contacts", () => {
  const data = read("data/directory/regions.json");
  assert.equal(data.schemaVersion, 1);
  assert.equal(data.items.length, 17);
  assert.equal(new Set(data.items.map((item) => item.id)).size, 17);
  for (const region of data.items) {
    assert.ok(region.nameOriginal);
    assert.ok(region.nameZh);
    assert.ok(region.capitalZh);
    assert.ok(region.akimName);
    assert.ok(region.akimNameZh);
    assert.ok(region.positionZh);
    assert.ok(region.addressOriginal);
    assert.ok(region.addressZh);
    assert.match(region.phone, /^\+7[\d ()-]{8,}$/);
    officialHttps(region.websiteUrl, `${region.id} websiteUrl`);
    officialHttps(region.sourceUrl, `${region.id} sourceUrl`);
  }
});

test("business support directory contains public official contact channels", () => {
  const data = read("data/directory/organizations.json");
  assert.equal(data.schemaVersion, 1);
  assert.ok(data.items.length >= 5);
  for (const organization of data.items) {
    assert.ok(organization.nameOriginal);
    assert.ok(organization.nameZh);
    assert.ok(organization.categoryZh);
    assert.ok(organization.scopeZh);
    assert.ok(organization.addressOriginal);
    assert.match(organization.phone, /^\+7[\d ()-]{8,}$/);
    assert.match(organization.websiteUrl, /^https:\/\//);
    assert.match(organization.sourceUrl, /^https:\/\//);
  }
});

test("officials page loads regional and business contact directories", () => {
  const page = fs.readFileSync(path.join(root, "officials.html"), "utf8");
  assert.match(page, /id="regional-directory"/);
  assert.match(page, /id="business-directory"/);
  assert.match(page, /assets\/js\/directory\.js/);
});

test("tender feed contains at least two traceable public notices", () => {
  const data = read("data/tenders/latest.json");
  assert.ok(data.items.length >= 2);
  assert.equal(
    new Set(data.items.map((item) => item.id)).size,
    data.items.length,
  );
  for (const item of data.items) {
    assert.ok(item.titleOriginal);
    assert.ok(item.titleZh);
    assert.ok(item.buyerOriginal);
    assert.ok(item.buyerZh);
    assert.ok(item.regionZh);
    assert.ok(item.publishedAt);
    assert.ok(item.deadline);
    assert.match(item.sourceUrl, /^https:\/\//);
    assert.notEqual(new URL(item.sourceUrl).hostname, "example.com");
  }
});
