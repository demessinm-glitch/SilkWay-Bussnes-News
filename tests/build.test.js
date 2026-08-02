const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildSite } = require("../scripts/build-site");

test("static build includes public pages and excludes source-only or secret files", () => {
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), "silkroad-dist-"));
  buildSite(path.join(__dirname, ".."), destination);
  assert.ok(fs.existsSync(path.join(destination, "index.html")));
  assert.ok(fs.existsSync(path.join(destination, "services.html")));
  for (const legacyPage of [
    "almaty-json.html",
    "astana-json.html",
    "shymkent-json.html",
    "almaty-biography.html",
    "astana-biography.html",
    "shymkent-biography.html",
    "astana-person.html",
    "local-governments.html",
  ]) {
    assert.ok(
      fs.existsSync(path.join(destination, legacyPage)),
      `${legacyPage} must remain available`,
    );
  }
  assert.ok(fs.existsSync(path.join(destination, "assets/css/main.css")));
  assert.ok(
    fs.existsSync(path.join(destination, "assets/js/legacy-profile.js")),
  );
  assert.ok(fs.existsSync(path.join(destination, "assets/js/directory.js")));
  assert.ok(fs.existsSync(path.join(destination, "styles.css")));
  assert.ok(fs.existsSync(path.join(destination, "data/news/latest.json")));
  assert.ok(
    fs.existsSync(path.join(destination, "data/directory/regions.json")),
  );
  assert.ok(
    fs.existsSync(path.join(destination, "data/directory/organizations.json")),
  );
  assert.equal(
    fs.existsSync(path.join(destination, "data/schemas/regions.schema.json")),
    false,
  );
  assert.equal(fs.existsSync(path.join(destination, "tests")), false);
  assert.equal(fs.existsSync(path.join(destination, "scripts")), false);
  assert.equal(fs.existsSync(path.join(destination, "package.json")), false);
  assert.equal(
    fs.readdirSync(destination).some((name) => name.endsWith(".docx")),
    false,
  );
  fs.rmSync(destination, { recursive: true, force: true });
});
