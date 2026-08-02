const { spawnSync } = require("node:child_process");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const jobs = [
  "sync-news.js",
  "sync-officials.js",
  "sync-guides.js",
  "sync-tenders.js",
  "validate-data.js",
];
const failures = [];
for (const job of jobs) {
  const result = spawnSync(
    process.execPath,
    ["--use-system-ca", path.join(__dirname, job)],
    { cwd: ROOT, stdio: "inherit", env: process.env },
  );
  if (result.status !== 0) failures.push(job);
}
if (failures.length) {
  console.error(`Failed jobs: ${failures.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: "success", jobs: jobs.length }));
}
