const path = require("node:path");
const { readJson, atomicWriteJson } = require("./storage");

function updateBuildMeta(root, patch) {
  const filePath = path.join(root, "data/meta/build.json");
  const current = readJson(filePath, {
    schemaVersion: 1,
    lastSuccessfulUpdate: null,
    newsUpdatedAt: null,
    officialsUpdatedAt: null,
    guidesUpdatedAt: null,
    tendersUpdatedAt: null,
  });
  const next = { ...current, ...patch, schemaVersion: 1 };
  const stamps = [
    next.newsUpdatedAt,
    next.officialsUpdatedAt,
    next.guidesUpdatedAt,
    next.tendersUpdatedAt,
  ]
    .filter(Boolean)
    .sort();
  next.lastSuccessfulUpdate =
    stamps.at(-1) || current.lastSuccessfulUpdate || null;
  atomicWriteJson(filePath, next);
  return next;
}

module.exports = { updateBuildMeta };
