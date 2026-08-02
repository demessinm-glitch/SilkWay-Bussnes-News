const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const files = [
  "data/almaty-people.json",
  "data/astana-structure.json",
  "data/shymkent-people.json",
];

test("every published official has a stable source-backed id", () => {
  for (const relativePath of files) {
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8"),
    );
    assert.ok(data.people.length > 0, `${relativePath} must contain people`);
    for (const person of data.people) {
      assert.match(
        String(person.id || ""),
        /^\d+$/,
        `${relativePath}: ${person.name} is missing a stable numeric id`,
      );
    }
  }
});
