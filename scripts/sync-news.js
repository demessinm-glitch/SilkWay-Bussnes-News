const path = require("node:path");
const crypto = require("node:crypto");
const { analyzeArticle } = require("./lib/ai");
const { deduplicateArticles } = require("./lib/dedupe");
const { isBusinessRelevant, selectDaily } = require("./lib/rank");
const {
  atomicWriteJson,
  publishJsonSafely,
  readJson,
} = require("./lib/storage");
const { updateBuildMeta } = require("./lib/build-meta");

const ROOT = path.join(__dirname, "..");
const DEFAULT_ADAPTERS = {
  rss: require("./sources/rss"),
  "html-list": require("./sources/html-list"),
};

function safeError(error) {
  return String(error?.message || error || "Unknown error")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .slice(0, 500);
}

async function collectSources(sources, options = {}) {
  const adapters = options.adapters || DEFAULT_ADAPTERS;
  const timeoutMs = Number(options.timeoutMs) || 15_000;
  const reports = [];
  const articles = [];

  await Promise.all(
    sources
      .filter((source) => source.enabled)
      .map(async (source) => {
        const report = {
          sourceId: source.id,
          status: "success",
          fetched: 0,
          accepted: 0,
          errors: [],
        };
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const adapter = adapters[source.adapter];
          if (!adapter)
            throw new Error(`Unknown source adapter: ${source.adapter}`);
          const collected = await adapter.collect(source, {
            signal: controller.signal,
          });
          report.fetched = collected.length;
          report.accepted = collected.length;
          articles.push(
            ...collected.map((article) => ({
              ...article,
              sourceType: source.type,
            })),
          );
        } catch (error) {
          report.status = "failed";
          report.errors.push(safeError(error));
        } finally {
          clearTimeout(timer);
          reports.push(report);
        }
      }),
  );

  return {
    articles,
    sources: reports.sort((a, b) => a.sourceId.localeCompare(b.sourceId)),
  };
}

function contentHash(article) {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        url: article.canonicalUrl || article.sourceUrl,
        title: article.titleOriginal,
        summary: article.summaryOriginal,
        publishedAt: article.publishedAt,
      }),
    )
    .digest("hex");
}

function recentEnough(article, now = Date.now()) {
  const published = new Date(article.publishedAt).getTime();
  return (
    Number.isFinite(published) &&
    published <= now + 60 * 60 * 1000 &&
    now - published <= 48 * 60 * 60 * 1000
  );
}

function mergeLatest(existing, daily, generatedAt) {
  const byId = new Map();
  for (const item of [...daily, ...(existing.items || [])]) {
    if (
      item.status === "published" &&
      isBusinessRelevant(item) &&
      !byId.has(item.id)
    )
      byId.set(item.id, item);
  }
  const items = [...byId.values()]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 200);
  return { schemaVersion: 1, generatedAt, items };
}

async function syncNews(options = {}) {
  const startedAt = new Date().toISOString();
  const sources =
    options.sources ||
    readJson(path.join(ROOT, "data", "config", "sources.json"), []);
  const existing = readJson(path.join(ROOT, "data", "news", "latest.json"), {
    schemaVersion: 1,
    items: [],
  });
  const cachePath = path.join(ROOT, "data", "cache", "news-translations.json");
  const cache = readJson(cachePath, {});
  const collection = await collectSources(sources, options);
  const collectionSucceeded = collection.sources.some(
    (source) => source.status === "success",
  );
  const candidates = deduplicateArticles(collection.articles)
    .filter(
      (article) =>
        article.publishedAt && recentEnough(article, options.now || Date.now()),
    )
    .map((article) => ({
      ...article,
      contentHash: contentHash(article),
      collectedAt: new Date().toISOString(),
    }));

  const translated = [];
  const untranslated = [];
  const maxAiRequests = Number(process.env.MAX_AI_REQUESTS_PER_RUN || 25);
  let aiRequests = 0;

  for (const article of candidates) {
    if (cache[article.contentHash]) {
      translated.push({
        ...article,
        ...cache[article.contentHash],
        sourceUrl: article.sourceUrl,
        canonicalUrl: article.canonicalUrl,
      });
      continue;
    }
    if (
      !process.env.OPENAI_API_KEY ||
      !process.env.OPENAI_MODEL ||
      aiRequests >= maxAiRequests
    ) {
      untranslated.push({
        ...article,
        status: "collected",
        reason: "translation_not_run",
      });
      continue;
    }
    try {
      aiRequests += 1;
      const result = await analyzeArticle(article, options.ai || {});
      cache[article.contentHash] = {
        ...result,
        sourceUrl: undefined,
        canonicalUrl: undefined,
        titleOriginal: undefined,
        summaryOriginal: undefined,
      };
      translated.push(result);
    } catch (error) {
      untranslated.push({
        ...article,
        status: "failed",
        reason: safeError(error),
      });
    }
  }

  const daily = selectDaily(translated, {
    max: Number(process.env.DAILY_MAX_NEWS || 12),
  });
  const generatedAt = new Date().toISOString();
  const next = mergeLatest(existing, daily, generatedAt);
  const warnings = [];
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL)
    warnings.push(
      "AI translation skipped: OPENAI_API_KEY or OPENAI_MODEL is not configured",
    );
  if (!collectionSucceeded) warnings.push("All configured news sources failed");
  if (untranslated.length)
    warnings.push(
      `${untranslated.length} articles remain untranslated or failed`,
    );

  if (untranslated.length)
    atomicWriteJson(path.join(ROOT, "data", "drafts", "untranslated.json"), {
      generatedAt,
      items: untranslated,
    });
  if (translated.length) atomicWriteJson(cachePath, cache);
  if (daily.length) {
    publishJsonSafely(path.join(ROOT, "data", "news", "latest.json"), next, {
      collectionSucceeded,
    });
    updateBuildMeta(ROOT, { newsUpdatedAt: generatedAt });
  }

  const log = {
    schemaVersion: 1,
    runId: startedAt.replace(/[:.]/g, "-"),
    startedAt,
    finishedAt: new Date().toISOString(),
    status: collectionSucceeded
      ? warnings.length
        ? "success_with_warnings"
        : "success"
      : "failed",
    sources: collection.sources,
    collected: collection.articles.length,
    deduplicated: candidates.length,
    aiRequests,
    publishedNews: daily.length,
    warnings,
    errors: collection.sources.flatMap((source) => source.errors),
  };
  atomicWriteJson(
    path.join(ROOT, "logs", `run-${startedAt.slice(0, 10)}.json`),
    log,
  );
  return log;
}

if (require.main === module) {
  syncNews()
    .then((log) => {
      console.log(
        JSON.stringify({
          status: log.status,
          collected: log.collected,
          published: log.publishedNews,
          warnings: log.warnings,
        }),
      );
      if (log.status === "failed") process.exitCode = 1;
    })
    .catch((error) => {
      console.error(`News synchronization failed: ${safeError(error)}`);
      process.exitCode = 1;
    });
}

module.exports = {
  collectSources,
  contentHash,
  mergeLatest,
  recentEnough,
  safeError,
  syncNews,
};
