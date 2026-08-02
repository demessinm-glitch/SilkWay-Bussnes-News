const fs = require("node:fs");
const path = require("node:path");
const { updateBuildMeta } = require("./lib/build-meta");

const ROOT = path.join(__dirname, "..");
const filePath = path.join(ROOT, "data/guides/index.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
if (!Array.isArray(data.items) || data.items.length < 8)
  throw new Error("Guide catalog is incomplete.");
updateBuildMeta(ROOT, { guidesUpdatedAt: new Date().toISOString() });
console.log(JSON.stringify({ status: "success", guides: data.items.length }));
