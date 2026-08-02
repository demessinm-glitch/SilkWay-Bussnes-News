const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("production deployment targets only oguz.kz on Hoster.kz", () => {
  assert.equal(
    fs.existsSync(path.join(root, ".github/workflows/deploy-pages.yml")),
    false,
  );

  const workflow = read(".github/workflows/deploy-hoster.yml");
  assert.match(workflow, /permissions:\s+contents: write/);
  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /Automatic content synchronization/);
  assert.match(workflow, /checkout -B production/);
  assert.match(workflow, /push --force origin production/);
  assert.doesNotMatch(workflow, /HOSTER_FTP_PASSWORD|lftp/);
  assert.doesNotMatch(workflow, /actions\/deploy-pages/);

  const contentSync = read(".github/workflows/content-sync.yml");
  assert.match(contentSync, /npm run sync:news/);
  assert.match(contentSync, /npm run sync:officials/);
  assert.match(contentSync, /prettier --write data logs/);
  assert.doesNotMatch(contentSync, /sync:tenders/);

  const robots = read("robots.txt");
  const sitemap = read("sitemap.xml");
  assert.match(robots, /https:\/\/oguz\.kz\/sitemap\.xml/);
  assert.match(sitemap, /https:\/\/oguz\.kz\//);
  assert.doesNotMatch(`${robots}\n${sitemap}`, /github\.io|github-pages/i);
});
