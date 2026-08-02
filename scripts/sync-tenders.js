const fs = require("node:fs");
const path = require("node:path");
const { updateBuildMeta } = require("./lib/build-meta");

const ROOT = path.join(__dirname, "..");
const filePath = path.join(ROOT, "data/tenders/latest.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
if (!Array.isArray(data.items))
  throw new Error("Tender data has an invalid shape.");
if (data.items.length)
  updateBuildMeta(ROOT, {
    tendersUpdatedAt: data.generatedAt || new Date().toISOString(),
  });
console.log(
  JSON.stringify({
    status: data.items.length ? "success" : "success_with_warnings",
    tenders: data.items.length,
    warning: data.items.length
      ? null
      : "No verified procurement adapter is configured; public data was preserved.",
  }),
);
