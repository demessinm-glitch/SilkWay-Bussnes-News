const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { reusableTranslation, syncTenders } = require("../scripts/sync-tenders");

test("existing tender translation is reused across official quote and KGP abbreviation variants", () => {
  const existing = {
    titleOriginal: "Двигатель на DONGFENG DFH1080B80 в сборе с установкой",
    buyerOriginal:
      "Коммунальное государственное предприятие «Тазасу» акимата Жанааркинского района",
    titleZh: "DONGFENG发动机总成（含安装）",
    summaryZh: "该公告采购发动机总成并包含安装服务，条件以官方公告为准。",
    buyerZh: "扎纳阿尔卡区塔扎苏市政国有企业",
  };
  const facts = {
    search: { titleOriginal: existing.titleOriginal },
    overview: { titleOriginal: existing.titleOriginal },
    lots: [
      {
        buyerOriginal: 'КГП "Тазасу" акимата Жанааркинского района',
      },
    ],
  };

  assert.deepEqual(reusableTranslation(existing, facts), {
    titleZh: existing.titleZh,
    summaryZh: existing.summaryZh,
    buyerZh: existing.buyerZh,
  });
});

test("existing tender translation is not reused when buyer identity changes", () => {
  const existing = {
    titleOriginal: "Энергоаудит",
    buyerOriginal: "КГП Первая больница",
    titleZh: "能源审计",
    summaryZh: "采购能源审计服务，具体条件以官方公告为准。",
    buyerZh: "第一医院",
  };
  const facts = {
    search: { titleOriginal: "Энергоаудит" },
    overview: { titleOriginal: "Энергоаудит" },
    lots: [{ buyerOriginal: "КГП Вторая больница" }],
  };

  assert.equal(reusableTranslation(existing, facts), null);
});

function tenderFacts(index) {
  const noticeNumber = `${18000000 + index}-1`;
  return {
    search: {
      noticeNumber,
      titleOriginal: `Поставка промышленного оборудования ${index}`,
      organizerOriginal: `Организатор ${index}`,
      methodOriginal: "Открытый конкурс",
      applicationStart: "2026-08-03T08:00:00+05:00",
      deadline: "2026-08-10T08:00:00+05:00",
      budgetAmount: 10000000 + index,
      sourceUrl: `https://goszakup.gov.kz/ru/announce/index/${18000000 + index}?tab=lots`,
    },
    overview: {
      noticeNumber,
      titleOriginal: `Поставка промышленного оборудования ${index}`,
      statusOriginal: "Опубликовано",
      publishedAt: `2026-08-03T07:${String(index).padStart(2, "0")}:00+05:00`,
      applicationStart: "2026-08-03T08:00:00+05:00",
      deadline: "2026-08-10T08:00:00+05:00",
    },
    lots: [
      {
        lotNumber: `${90000000 + index}-ОК1`,
        buyerOriginal: `Государственное предприятие Покупатель ${index}`,
        itemOriginal: `Промышленное оборудование ${index}`,
        detailOriginal: "Оборудование для производственной линии",
        budgetAmount: 10000000 + index,
        statusOriginal: "Опубликован",
      },
    ],
  };
}

test("daily tender sync verifies 30 candidates but publishes at most 20 new notices", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "daily-tenders-"));
  const filePath = path.join(directory, "latest.json");
  fs.writeFileSync(
    filePath,
    JSON.stringify({ schemaVersion: 1, generatedAt: null, items: [] }),
  );
  const previous = {
    maxAi: process.env.MAX_TENDER_AI_REQUESTS_PER_RUN,
    searchCount: process.env.TENDER_SEARCH_COUNT,
    maxCandidates: process.env.TENDER_MAX_CANDIDATES_PER_RUN,
    dailyMax: process.env.TENDER_DAILY_MAX,
    archiveMax: process.env.TENDER_ARCHIVE_MAX_ITEMS,
  };
  process.env.MAX_TENDER_AI_REQUESTS_PER_RUN = "30";
  process.env.TENDER_SEARCH_COUNT = "100";
  process.env.TENDER_MAX_CANDIDATES_PER_RUN = "30";
  process.env.TENDER_DAILY_MAX = "20";
  process.env.TENDER_ARCHIVE_MAX_ITEMS = "200";
  let collectionOptions;

  try {
    const result = await syncTenders({
      filePath,
      collect: async (options) => {
        collectionOptions = options;
        return {
          searchCount: 50,
          facts: Array.from({ length: 25 }, (_, index) => tenderFacts(index)),
          errors: [],
        };
      },
      translate: async ({ titleOriginal, buyerOriginal }) => ({
        titleZh: `工业设备招标：${titleOriginal.match(/\d+$/)[0]}`,
        summaryZh: "面向具备供货和技术服务能力的企业，具体要求以官方公告为准。",
        buyerZh: `哈萨克斯坦采购方${buyerOriginal.match(/\d+$/)[0]}`,
      }),
      now: new Date("2026-08-03T02:00:00Z"),
      verifiedAt: "2026-08-03T02:00:00.000Z",
      skipBuildMeta: true,
    });
    const stored = JSON.parse(fs.readFileSync(filePath, "utf8"));

    assert.equal(collectionOptions.count, 100);
    assert.equal(collectionOptions.maxCandidates, 30);
    assert.equal(result.published, 20);
    assert.equal(stored.items.length, 20);
  } finally {
    for (const [key, value] of Object.entries({
      MAX_TENDER_AI_REQUESTS_PER_RUN: previous.maxAi,
      TENDER_SEARCH_COUNT: previous.searchCount,
      TENDER_MAX_CANDIDATES_PER_RUN: previous.maxCandidates,
      TENDER_DAILY_MAX: previous.dailyMax,
      TENDER_ARCHIVE_MAX_ITEMS: previous.archiveMax,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("daily tender sync excludes already published notice IDs from collection", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "existing-tenders-"));
  const filePath = path.join(directory, "latest.json");
  const storedTender = (
    noticeNumber,
    titleOriginal = "Приобретение трансформатора",
    buyerZh = "哈萨克斯坦采购方",
  ) => ({
    id: `goszakup-${noticeNumber}`,
    noticeNumber,
    titleOriginal,
    titleZh: "采购变压器设备",
    summaryZh: "该公告采购工业设备，具体要求和申请条件以官方公告为准。",
    buyerZh,
    budgetAmount: 8000000,
  });
  fs.writeFileSync(
    filePath,
    JSON.stringify({
      schemaVersion: 1,
      generatedAt: "2026-08-02T02:00:00.000Z",
      items: [
        storedTender("17414985-1"),
        storedTender("17414962-1"),
        storedTender(
          "17417352-1",
          "Приобретение промышленного оборудования",
          "哈萨克斯坦 РГУ 采购方",
        ),
        storedTender(
          "17417408-1",
          "Услуги по страхованию транспортных средств",
        ),
      ],
    }),
  );
  let collectionOptions;

  try {
    await syncTenders({
      filePath,
      collect: async (options) => {
        collectionOptions = options;
        return { searchCount: 2, facts: [], errors: [] };
      },
      skipBuildMeta: true,
    });

    assert.deepEqual(collectionOptions.excludeNoticeNumbers, [
      "17414985-1",
      "17414962-1",
    ]);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
