const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { validateAll } = require("../scripts/validate-data");

test("all public data files satisfy their JSON schemas", () => {
  const result = validateAll(path.join(__dirname, ".."));
  assert.equal(result.valid, true, result.errors.join("\n"));
});
