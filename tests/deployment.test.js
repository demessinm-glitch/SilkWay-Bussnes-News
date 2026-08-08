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
  assert.match(workflow, /Daily tender synchronization/);
  assert.match(workflow, /checkout -B production/);
  assert.match(workflow, /push --force origin production/);
  assert.match(workflow, /php -l contact\.php/);
  assert.doesNotMatch(workflow, /HOSTER_FTP_PASSWORD|lftp/);
  assert.doesNotMatch(workflow, /actions\/deploy-pages/);

  const contentSync = read(".github/workflows/content-sync.yml");
  assert.match(contentSync, /npm run sync:news/);
  assert.match(contentSync, /npm run sync:officials/);
  assert.doesNotMatch(contentSync, /npm run sync:tenders/);
  assert.match(contentSync, /prettier --write data logs/);

  const tenderSync = read(".github/workflows/tender-sync.yml");
  assert.match(tenderSync, /name: Daily tender synchronization/);
  assert.match(tenderSync, /cron: "30 2 \* \* \*"/);
  assert.match(tenderSync, /MAX_TENDER_AI_REQUESTS_PER_RUN: "20"/);
  assert.match(tenderSync, /TENDER_SEARCH_COUNT: "100"/);
  assert.match(tenderSync, /TENDER_MAX_CANDIDATES_PER_RUN: "30"/);
  assert.match(tenderSync, /TENDER_DAILY_MAX: "20"/);
  assert.match(tenderSync, /TENDER_ARCHIVE_MAX_ITEMS: "200"/);
  assert.match(tenderSync, /NODE_OPTIONS: --use-system-ca/);
  assert.match(tenderSync, /npm run sync:tenders/);
  assert.match(tenderSync, /data\/tenders\/latest\.json/);

  const robots = read("robots.txt");
  const sitemap = read("sitemap.xml");
  assert.match(robots, /https:\/\/oguz\.kz\/sitemap\.xml/);
  assert.match(sitemap, /https:\/\/oguz\.kz\//);
  assert.doesNotMatch(`${robots}\n${sitemap}`, /github\.io|github-pages/i);
});
