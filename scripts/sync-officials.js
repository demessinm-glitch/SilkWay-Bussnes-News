const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { updateBuildMeta } = require("./lib/build-meta");
const { backfillStableIds } = require("./lib/officials");
const { atomicWriteJson } = require("./lib/storage");

const ROOT = path.join(__dirname, "..");
const jobs = ["sync-almaty.js", "sync-astana.js", "sync-shymkent.js"];
const failures = [];
for (const job of jobs) {
  const result = spawnSync(
    process.execPath,
    ["--use-system-ca", path.join(__dirname, job)],
    { cwd: ROOT, stdio: "inherit" },
  );
  if (result.status !== 0) failures.push(job);
}
const files = [
  "data/almaty-people.json",
  "data/astana-structure.json",
  "data/shymkent-people.json",
];

for (const file of files) {
  const filePath = path.join(ROOT, file);
  try {
    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    atomicWriteJson(filePath, backfillStableIds(payload));
  } catch (error) {
    console.warn(`${file}: stable id migration failed: ${error.message}`);
    failures.push(`${file}:stable-ids`);
  }
}

const usable = files.every((file) => {
  try {
    const people = JSON.parse(
      fs.readFileSync(path.join(ROOT, file), "utf8"),
    ).people;
    return (
      Array.isArray(people) &&
      people.length > 0 &&
      people.every((person) => /^\d+$/.test(String(person.id || "")))
    );
  } catch {
    return false;
  }
});
if (!usable) {
  console.error("Official directory has no valid fallback data.");
  process.exitCode = 1;
} else {
  if (!failures.length) {
    updateBuildMeta(ROOT, { officialsUpdatedAt: new Date().toISOString() });
  }
  console.log(
    JSON.stringify({
      status: failures.length ? "success_with_warnings" : "success",
      failedJobs: failures,
    }),
  );
}
