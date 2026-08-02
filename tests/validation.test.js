const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { FILES, validateAll } = require("../scripts/validate-data");

test("validation registry covers every public directory feed", () => {
  const registered = new Set(FILES.map(([dataPath]) => dataPath));
  assert.ok(registered.has("data/directory/regions.json"));
  assert.ok(registered.has("data/directory/organizations.json"));
});

test("all public data files satisfy their JSON schemas", () => {
  const result = validateAll(path.join(__dirname, ".."));
  assert.equal(result.valid, true, result.errors.join("\n"));
});
