const path = require("node:path");
const { updateBuildMeta } = require("./lib/build-meta");
const { translateTender } = require("./lib/tender-ai");
const { publishJsonSafely, readJson } = require("./lib/storage");
const {
  buildTenderRecord,
  collectVerifiedTenderFacts,
  mergeTenderRecords,
} = require("./sources/goszakup");

const ROOT = path.join(__dirname, "..");
const DEFAULT_FILE_PATH = path.join(ROOT, "data/tenders/latest.json");

function normalizeOfficialIdentity(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/коммунальное\s+государственное\s+предприятие/giu, "кгп")
    .replace(/[«»"'`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function reusableTranslation(existing, facts) {
  const buyerOriginal = facts.lots[0]?.buyerOriginal;
  const titleOriginal =
    facts.overview.titleOriginal || facts.search.titleOriginal;
  if (
    !existing ||
    normalizeOfficialIdentity(existing.titleOriginal) !==
      normalizeOfficialIdentity(titleOriginal) ||
    normalizeOfficialIdentity(existing.buyerOriginal) !==
      normalizeOfficialIdentity(buyerOriginal)
  )
    return null;
  return {
    titleZh: existing.titleZh,
    summaryZh: existing.summaryZh,
    buyerZh: existing.buyerZh,
  };
}

async function syncTenders(options = {}) {
  const filePath = options.filePath || DEFAULT_FILE_PATH;
  const existing = readJson(filePath, {
    schemaVersion: 1,
    generatedAt: null,
    items: [],
  });
  const collect = options.collect || collectVerifiedTenderFacts;
  const translate = options.translate || translateTender;
  let collection;
  try {
    collection = await collect(options.collection || {});
  } catch (error) {
    return {
      status: "success_with_warnings",
      searchCount: 0,
      verified: 0,
      published: existing.items.length,
      aiRequests: 0,
      warnings: [
        `goszakup collection failed; previous data preserved: ${error.message}`,
      ],
      errors: [],
    };
  }

  const existingById = new Map(
    existing.items.map((item) => [item.noticeNumber, item]),
  );
  const maxAiRequests = Math.max(
    0,
    Number(process.env.MAX_TENDER_AI_REQUESTS_PER_RUN || 6),
  );
  const fresh = [];
  const errors = [...collection.errors];
  let aiRequests = 0;

  for (const facts of collection.facts) {
    try {
      const existingItem = existingById.get(facts.search.noticeNumber);
      let translation = reusableTranslation(existingItem, facts);
      if (!translation) {
        if (
          aiRequests >= maxAiRequests ||
          (!options.translate &&
            (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL))
        ) {
          errors.push({
            noticeNumber: facts.search.noticeNumber,
            error: "translation_not_run",
          });
          continue;
        }
        aiRequests += 1;
        translation = await translate(
          {
            titleOriginal:
              facts.overview.titleOriginal || facts.search.titleOriginal,
            buyerOriginal: facts.lots[0].buyerOriginal,
            itemOriginal: facts.lots.map((lot) => lot.itemOriginal).join("; "),
            detailOriginal: facts.lots
              .map((lot) => lot.detailOriginal)
              .filter(Boolean)
              .join("; "),
            sourceUrl: facts.search.sourceUrl,
          },
          options.ai || {},
        );
      }
      fresh.push(
        buildTenderRecord({
          ...facts,
          translation,
          now: options.now || new Date(),
          verifiedAt: options.verifiedAt || new Date().toISOString(),
        }),
      );
    } catch (error) {
      errors.push({
        noticeNumber: facts.search.noticeNumber,
        error: error.message,
      });
    }
  }

  if (!fresh.length) {
    return {
      status: "success_with_warnings",
      searchCount: collection.searchCount,
      verified: collection.facts.length,
      published: existing.items.length,
      aiRequests,
      warnings: [
        "No new verified tender records were publishable; previous data preserved.",
      ],
      errors,
    };
  }

  const generatedAt = new Date().toISOString();
  const next = mergeTenderRecords(existing, fresh, {
    generatedAt,
    now: options.now || new Date(),
    maxItems: options.maxItems || 30,
  });
  publishJsonSafely(filePath, next, {
    collectionSucceeded: true,
    rejectEmpty: true,
  });
  if (!options.skipBuildMeta)
    updateBuildMeta(ROOT, { tendersUpdatedAt: generatedAt });

  return {
    status: errors.length ? "success_with_warnings" : "success",
    searchCount: collection.searchCount,
    verified: fresh.length,
    published: next.items.length,
    aiRequests,
    warnings: errors.length
      ? [`${errors.length} tender candidates were skipped safely.`]
      : [],
    errors,
  };
}

if (require.main === module) {
  syncTenders()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(`Tender synchronization failed safely: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = {
  normalizeOfficialIdentity,
  reusableTranslation,
  syncTenders,
};
