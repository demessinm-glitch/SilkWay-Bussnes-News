const { test } = require("node:test");
const assert = require("node:assert/strict");
const { reusableTranslation } = require("../scripts/sync-tenders");

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
