const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  buildTenderRecord,
  createRequestGate,
  isTenderRelevant,
  mergeTenderRecords,
  parseAnnouncementOverview,
  parseLots,
  parseSearchResults,
  selectTenderCandidates,
} = require("../scripts/sources/goszakup");

test("goszakup request gate respects the portal five-second crawl delay", async () => {
  let now = 1_000;
  const sleeps = [];
  const gate = createRequestGate({
    intervalMs: 5_000,
    now: () => now,
    sleep: async (delay) => {
      sleeps.push(delay);
      now += delay;
    },
  });

  await gate();
  now += 1_200;
  await gate();
  now += 5_500;
  await gate();

  assert.deepEqual(sleeps, [3_800]);
});

const SEARCH_HTML = `
<table id="search-result"><tbody>
<tr>
  <td><strong>17414985-1</strong><small>Лотов: 1</small></td>
  <td><a href="/ru/announce/index/17414985">Государственные закупки услуг энергоаудита</a>
    <small><b>Организатор:</b> КГП «Качарская городская больница»</small></td>
  <td>Запрос ценовых предложений</td>
  <td>2026-08-03<br>08:00:00</td>
  <td>2026-08-05<br>08:00:05</td>
  <td><strong>1 857 700.00</strong></td>
  <td>Опубликовано</td>
</tr>
</tbody></table>`;

const OVERVIEW_HTML = `
<div><label>Номер объявления</label><input value="17414985-1"></div>
<div><label>Наименование объявления</label><input value="Государственные закупки услуг энергоаудита"></div>
<div><label>Статус объявления</label><input value="Опубликовано"></div>
<div><label>Дата публикации объявления</label><input value="2026-08-02 23:33:34"></div>
<div><label>Срок начала приема заявок</label><input value="2026-08-03 08:00:00"></div>
<div><label>Срок окончания приема заявок</label><input value="2026-08-05 08:00:05"></div>`;

const LOTS_HTML = `
<table>
<tr><th>№ п/п</th><th>Номер лота</th><th>Заказчик</th><th>Наименование</th><th>Дополнительная характеристика</th><th>Цена за ед.</th><th>Кол-во</th><th>Ед. изм.</th><th>Плановая сумма</th><th>Статус лота</th></tr>
<tr><td>1</td><td>83526809-ЗЦП1</td><td>Коммунальное государственное предприятие "Качарская городская больница" Управления здравоохранения акимата Костанайской области</td><td>Услуги по проведению энергетического аудита</td><td>Услуги по проведению энергетического аудита</td><td>1 857 700.00</td><td>1</td><td>Одна услуга</td><td>1 857 700.00</td><td>Опубликован</td></tr>
</table>`;

test("goszakup parser preserves official search facts and deadline seconds", () => {
  const [item] = parseSearchResults(SEARCH_HTML);

  assert.equal(item.noticeNumber, "17414985-1");
  assert.equal(
    item.titleOriginal,
    "Государственные закупки услуг энергоаудита",
  );
  assert.equal(item.methodOriginal, "Запрос ценовых предложений");
  assert.equal(item.budgetAmount, 1857700);
  assert.equal(item.deadline, "2026-08-05T08:00:05+05:00");
  assert.equal(
    item.sourceUrl,
    "https://goszakup.gov.kz/ru/announce/index/17414985?tab=lots",
  );
});

test("goszakup parser reads overview and line-level buyer", () => {
  const overview = parseAnnouncementOverview(OVERVIEW_HTML);
  const lots = parseLots(LOTS_HTML);

  assert.equal(overview.publishedAt, "2026-08-02T23:33:34+05:00");
  assert.equal(overview.deadline, "2026-08-05T08:00:05+05:00");
  assert.equal(lots.length, 1);
  assert.equal(lots[0].lotNumber, "83526809-ЗЦП1");
  assert.match(lots[0].buyerOriginal, /Костанайской области/);
  assert.equal(lots[0].budgetAmount, 1857700);
});

test("tender relevance keeps industrial opportunities and rejects routine supplies", () => {
  assert.equal(
    isTenderRelevant({
      titleOriginal: "Двигатель DONGFENG в сборе с установкой",
      budgetAmount: 6000000,
    }),
    true,
  );
  assert.equal(
    isTenderRelevant({
      titleOriginal: "Приобретение хозяйственных товаров",
      budgetAmount: 2318548,
    }),
    false,
  );
});

test("China-focused tender relevance rejects routine local services", () => {
  for (const titleOriginal of [
    "Услуги по обязательному страхованию владельцев транспортных средств",
    "Услуги по очистке и дезинфекции вентиляционных систем",
    "Лабораторные исследования в системе инфекционного контроля",
    "Услуги по чистке дымоходов и вентиляционных каналов",
    "Приобретение топлива для автомобилей Дизель",
    "Консервирование системы водоочистки гемодиализного оборудования",
  ]) {
    assert.equal(
      isTenderRelevant({ titleOriginal, budgetAmount: 8000000 }),
      false,
      titleOriginal,
    );
  }
});

test("candidate selection excludes archived notices before applying the verification limit", () => {
  const candidate = (noticeNumber, minute) => ({
    noticeNumber,
    titleOriginal: `Поставка промышленного оборудования ${noticeNumber}`,
    budgetAmount: 10000000,
    deadline: `2026-08-10T08:${minute}:00+05:00`,
  });
  const selected = selectTenderCandidates(
    [
      candidate("17414985-1", "00"),
      candidate("18000001-1", "01"),
      candidate("18000002-1", "02"),
      candidate("18000003-1", "03"),
    ],
    {
      now: new Date("2026-08-03T00:00:00Z"),
      maxCandidates: 2,
      excludeNoticeNumbers: ["17414985-1"],
    },
  );

  assert.deepEqual(
    selected.map((item) => item.noticeNumber),
    ["18000001-1", "18000002-1"],
  );
});

test("verified goszakup facts become a schema-ready Chinese tender record", () => {
  const search = parseSearchResults(SEARCH_HTML)[0];
  const overview = parseAnnouncementOverview(OVERVIEW_HTML);
  const lots = parseLots(LOTS_HTML);
  const record = buildTenderRecord({
    search,
    overview,
    lots,
    translation: {
      titleZh: "能源审计服务政府采购",
      summaryZh:
        "科斯塔奈州卡恰尔市医院采购能源审计服务，申请人与预算信息应以官方公告为准。",
      buyerZh: "科斯塔奈州政府卫生局所属卡恰尔市医院市政国有企业",
    },
    now: new Date("2026-08-03T00:00:00Z"),
    verifiedAt: "2026-08-02T19:30:00.000Z",
  });

  assert.equal(record.id, "goszakup-17414985-1");
  assert.equal(record.regionZh, "科斯塔奈州");
  assert.equal(record.methodZh, "询价采购");
  assert.equal(record.status, "open");
  assert.equal(record.currency, "KZT");
  assert.equal(record.budgetAmount, 1857700);
});

test("failed or empty collection does not erase previous tender records", () => {
  const existing = {
    schemaVersion: 1,
    generatedAt: "2026-08-02T19:30:00.000Z",
    items: [
      { id: "goszakup-17414985-1", deadline: "2026-08-05T08:00:05+05:00" },
    ],
  };
  const merged = mergeTenderRecords(existing, [], {
    now: new Date("2026-08-03T00:00:00Z"),
  });

  assert.equal(merged.items.length, 1);
  assert.equal(merged.generatedAt, existing.generatedAt);
});

test("tender merge removes routine services and Cyrillic-leaking Chinese records", () => {
  const item = (id, titleOriginal, titleZh, buyerZh = "哈萨克斯坦采购方") => ({
    id,
    noticeNumber: id.replace("goszakup-", ""),
    titleOriginal,
    titleZh,
    summaryZh: "该公告面向具备供货能力的企业，具体要求以官方公告为准。",
    buyerZh,
    budgetAmount: 8000000,
    publishedAt: "2026-08-03T07:00:00+05:00",
    deadline: "2026-08-10T08:00:00+05:00",
    status: "open",
  });
  const existing = {
    schemaVersion: 1,
    generatedAt: "2026-08-03T08:00:00.000Z",
    items: [
      item(
        "goszakup-18000001-1",
        "Услуги по страхованию транспортных средств",
        "车辆保险服务",
      ),
      item(
        "goszakup-18000002-1",
        "Приобретение трансформатора",
        "采购变压器",
        "哈萨克斯坦 РГУ 采购方",
      ),
      item("goszakup-18000003-1", "Приобретение компьютеров", "采购计算机设备"),
    ],
  };
  const fresh = [
    item(
      "goszakup-18000004-1",
      "Двигатель DONGFENG в сборе с установкой",
      "采购东风发动机总成及安装服务",
    ),
  ];

  const merged = mergeTenderRecords(existing, fresh, {
    generatedAt: "2026-08-03T09:00:00.000Z",
    now: new Date("2026-08-03T00:00:00Z"),
    maxItems: 20,
  });

  assert.deepEqual(merged.items.map((record) => record.id).sort(), [
    "goszakup-18000003-1",
    "goszakup-18000004-1",
  ]);
});
