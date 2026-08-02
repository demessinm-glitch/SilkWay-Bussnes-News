const { test } = require("node:test");
const assert = require("node:assert/strict");
const { resolveLegacyPerson } = require("../assets/js/legacy-profile");

const people = [
  { id: 307, name: "Zhenis Kassymbek" },
  { id: 1813, name: "Nurlan Nurkenov" },
];

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

test("legacy profile resolves an explicit stable id or historical slug", () => {
  assert.equal(resolveLegacyPerson(people, "307", slugify), people[0]);
  assert.equal(
    resolveLegacyPerson(people, "nurlan-nurkenov", slugify),
    people[1],
  );
});

test("legacy profile never falls back to another person for an unknown id", () => {
  assert.equal(resolveLegacyPerson(people, "unknown-person", slugify), null);
  assert.equal(resolveLegacyPerson(people, null, slugify), null);
});
