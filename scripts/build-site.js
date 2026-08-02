const fs = require("node:fs");
const path = require("node:path");

const PUBLIC_ROOT_FILES = new Set([
  "robots.txt",
  "sitemap.xml",
  "site.webmanifest",
  "favicon.ico",
]);
const EXCLUDED_DATA_DIRS = new Set(["drafts", "cache", "schemas"]);

function copyTree(source, destination, filter = () => true) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (!filter(entry)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyTree(from, to, filter);
    else fs.copyFileSync(from, to);
  }
}

function buildSite(
  root = path.join(__dirname, ".."),
  destination = path.join(root, "dist"),
) {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (
      entry.name.endsWith(".html") ||
      entry.name.endsWith(".css") ||
      PUBLIC_ROOT_FILES.has(entry.name)
    ) {
      fs.copyFileSync(
        path.join(root, entry.name),
        path.join(destination, entry.name),
      );
    }
  }
  copyTree(path.join(root, "assets"), path.join(destination, "assets"));
  copyTree(
    path.join(root, "data"),
    path.join(destination, "data"),
    (entry) => !entry.isDirectory() || !EXCLUDED_DATA_DIRS.has(entry.name),
  );
  return destination;
}

if (require.main === module) {
  const destination = buildSite();
  console.log(`Static site built at ${destination}`);
}

module.exports = { buildSite };
