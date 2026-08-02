const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { publishJsonSafely } = require("../scripts/lib/storage");

test("safe publication refuses to replace valid data with an empty failed result", () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "silk-road-storage-"),
  );
  const target = path.join(directory, "latest.json");
  fs.writeFileSync(target, JSON.stringify({ items: [{ id: "kept" }] }), "utf8");

  assert.throws(
    () =>
      publishJsonSafely(target, { items: [] }, { collectionSucceeded: false }),
    /refusing to replace/i,
  );
  const after = JSON.parse(fs.readFileSync(target, "utf8"));
  assert.equal(after.items[0].id, "kept");

  fs.rmSync(directory, { recursive: true, force: true });
});

test("safe publication rejects an unexpectedly empty officials result", () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "silk-road-storage-"),
  );
  const target = path.join(directory, "officials.json");
  fs.writeFileSync(
    target,
    JSON.stringify({ people: [{ id: "kept" }] }),
    "utf8",
  );

  assert.throws(
    () =>
      publishJsonSafely(
        target,
        { people: [] },
        {
          collectionSucceeded: true,
          itemsKey: "people",
          rejectEmpty: true,
        },
      ),
    /empty/i,
  );
  const after = JSON.parse(fs.readFileSync(target, "utf8"));
  assert.equal(after.people[0].id, "kept");

  fs.rmSync(directory, { recursive: true, force: true });
});
