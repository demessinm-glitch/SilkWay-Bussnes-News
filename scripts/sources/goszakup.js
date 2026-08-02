const cheerio = require("cheerio");

const BASE_URL = "https://goszakup.gov.kz";
const SOURCE_NAME = "Портал государственных закупок Республики Казахстан";
const DEFAULT_REQUEST_DELAY_MS = 5_000;
const BUSINESS_TENDER_SIGNALS =
  /энергоаудит|двигател|оборудован|станок|машин|техник|строител|реконструк|модерниз|инфраструктур|логист|транспорт|железнодорож|автомобил|инженер|проектирован|программ|сервер|компьютер|телеком|связ|электр|энерг|нефт|газ|промышлен|производ|монтаж|установк|консалт|аудит|лаборатор|металл|насос|генератор|трансформатор|вентиляц|водоснаб|канализац/iu;
const ROUTINE_SUPPLIES =
  /питани|овощ|продукт|хозяйствен|канцеляр|мыло|салфет|медикамент|лекарств|одежд|обув|уголок сантехника/iu;

const REGION_NAMES = [
  [/Жанааркин/iu, "乌勒套州"],
  [/Костанай/iu, "科斯塔奈州"],
  [/Акмол/iu, "阿克莫拉州"],
  [/Актюбин/iu, "阿克托别州"],
  [/Алматинск/iu, "阿拉木图州"],
  [/Атырау/iu, "阿特劳州"],
  [/Восточно-Казахстан/iu, "东哈萨克斯坦州"],
  [/Жамбыл/iu, "江布尔州"],
  [/Жетысу/iu, "杰特苏州"],
  [/Западно-Казахстан/iu, "西哈萨克斯坦州"],
  [/Караганд/iu, "卡拉干达州"],
  [/Кызылордин/iu, "克孜勒奥尔达州"],
  [/Мангиста/iu, "曼格斯套州"],
  [/Павлодар/iu, "巴甫洛达尔州"],
  [/Северо-Казахстан/iu, "北哈萨克斯坦州"],
  [/Туркестан/iu, "突厥斯坦州"],
  [/Улытау/iu, "乌勒套州"],
  [/области Абай|Абайской области/iu, "阿拜州"],
  [/Астана/iu, "阿斯塔纳市"],
  [/Алматы/iu, "阿拉木图市"],
  [/Шымкент/iu, "奇姆肯特市"],
];

function normalizeText(value = "") {
  return String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createRequestGate(options = {}) {
  const intervalMs = Math.max(
    0,
    Number(options.intervalMs ?? DEFAULT_REQUEST_DELAY_MS),
  );
  const now = options.now || Date.now;
  const sleep =
    options.sleep ||
    ((delay) => new Promise((resolve) => setTimeout(resolve, delay)));
  let lastRequestAt = null;
  let pending = Promise.resolve();

  return function waitForRequestTurn() {
    const next = pending.then(async () => {
      if (lastRequestAt !== null) {
        const delay = Math.max(0, lastRequestAt + intervalMs - now());
        if (delay > 0) await sleep(delay);
      }
      lastRequestAt = now();
    });
    pending = next.catch(() => {});
    return next;
  };
}

function parseAmount(value) {
  const normalized = normalizeText(value).replace(/\s/g, "").replace(/,/g, ".");
  const amount = Number(normalized.replace(/[^\d.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function parseAlmatyDate(value) {
  const text = normalizeText(value);
  const match = text.match(/(\d{4})-(\d{2})-(\d{2})\s*(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+05:00`;
}

function parseSearchResults(html) {
  const $ = cheerio.load(html);
  const items = [];
  $("#search-result tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 7) return;
    const noticeNumber = normalizeText(cells.eq(0).find("strong").text());
    const link = cells.eq(1).find("a[href]").first();
    if (!/^\d+-\d+$/.test(noticeNumber) || !link.length) return;
    const sourceUrl = new URL(link.attr("href"), BASE_URL);
    sourceUrl.searchParams.set("tab", "lots");
    items.push({
      noticeNumber,
      titleOriginal: normalizeText(link.text()),
      organizerOriginal: normalizeText(
        cells.eq(1).find("small").text(),
      ).replace(/^Организатор:\s*/iu, ""),
      methodOriginal: normalizeText(cells.eq(2).text()),
      applicationStart: parseAlmatyDate(cells.eq(3).text()),
      deadline: parseAlmatyDate(cells.eq(4).text()),
      budgetAmount: parseAmount(cells.eq(5).text()),
      statusOriginal: normalizeText(cells.eq(6).text()),
      sourceUrl: sourceUrl.href,
    });
  });
  return items;
}

function parseAnnouncementOverview(html) {
  const $ = cheerio.load(html);
  const fields = new Map();
  $("label").each((_, label) => {
    const name = normalizeText($(label).text());
    const field = $(label).parent().find("input,textarea,select").first();
    const value = normalizeText(field.attr("value") || field.text());
    if (name && value) fields.set(name, value);
  });
  return {
    noticeNumber: fields.get("Номер объявления") || null,
    titleOriginal: fields.get("Наименование объявления") || null,
    statusOriginal: fields.get("Статус объявления") || null,
    publishedAt: parseAlmatyDate(fields.get("Дата публикации объявления")),
    applicationStart: parseAlmatyDate(fields.get("Срок начала приема заявок")),
    deadline: parseAlmatyDate(fields.get("Срок окончания приема заявок")),
  };
}

function parseLots(html) {
  const $ = cheerio.load(html);
  const table = $("table")
    .filter((_, element) =>
      /Номер лота.*Заказчик.*Плановая сумма/isu.test($(element).text()),
    )
    .first();
  if (!table.length) return [];
  const rows = table.find("tr");
  const headers = rows
    .first()
    .find("th,td")
    .map((_, cell) => normalizeText($(cell).text()))
    .get();
  const indexOf = (name) => headers.findIndex((header) => header === name);
  const lotIndex = indexOf("Номер лота");
  const buyerIndex = indexOf("Заказчик");
  const titleIndex = indexOf("Наименование");
  const detailIndex = indexOf("Дополнительная характеристика");
  const amountIndex = indexOf("Плановая сумма");
  const statusIndex = headers.findIndex((header) => header === "Статус лота");
  if (
    [lotIndex, buyerIndex, titleIndex, amountIndex].some((index) => index < 0)
  )
    return [];

  return rows
    .slice(1)
    .map((_, row) => {
      const cells = $(row).find("td");
      return {
        lotNumber: normalizeText(cells.eq(lotIndex).text()),
        buyerOriginal: normalizeText(cells.eq(buyerIndex).text()),
        itemOriginal: normalizeText(cells.eq(titleIndex).text()),
        detailOriginal:
          detailIndex >= 0 ? normalizeText(cells.eq(detailIndex).text()) : "",
        budgetAmount: parseAmount(cells.eq(amountIndex).text()),
        statusOriginal:
          statusIndex >= 0 ? normalizeText(cells.eq(statusIndex).text()) : "",
      };
    })
    .get()
    .filter((lot) => lot.lotNumber && lot.buyerOriginal);
}

function isTenderRelevant(item) {
  if (Number(item.budgetAmount) < 1_000_000) return false;
  const text = `${item.titleOriginal || ""} ${item.itemOriginal || ""} ${item.detailOriginal || ""}`;
  return !ROUTINE_SUPPLIES.test(text) && BUSINESS_TENDER_SIGNALS.test(text);
}

function inferRegionZh(text) {
  return (
    REGION_NAMES.find(([pattern]) => pattern.test(text || ""))?.[1] ||
    "哈萨克斯坦"
  );
}

function translateMethod(methodOriginal) {
  if (/Запрос ценовых предложений/iu.test(methodOriginal)) return "询价采购";
  if (/Открытый конкурс/iu.test(methodOriginal)) return "公开招标";
  if (/Из одного источника/iu.test(methodOriginal)) return "单一来源采购";
  if (/аукцион/iu.test(methodOriginal)) return "拍卖采购";
  if (/конкурс/iu.test(methodOriginal)) return "招标采购";
  return "政府采购（方式见原公告）";
}

function statusFromDeadline(deadline, now = new Date()) {
  const remaining = new Date(deadline).getTime() - now.getTime();
  if (!Number.isFinite(remaining) || remaining <= 0) return "closed";
  return remaining <= 24 * 60 * 60 * 1000 ? "closing" : "open";
}

function buildTenderRecord({
  search,
  overview,
  lots,
  translation,
  now = new Date(),
  verifiedAt = new Date().toISOString(),
}) {
  const buyers = [
    ...new Set(lots.map((lot) => lot.buyerOriginal).filter(Boolean)),
  ];
  if (buyers.length !== 1)
    throw new Error("Tender must have one verified buyer across its lots");
  const buyerOriginal = buyers[0];
  const deadline = overview.deadline || search.deadline;
  const budgetAmount =
    search.budgetAmount || lots.reduce((sum, lot) => sum + lot.budgetAmount, 0);
  return {
    id: `goszakup-${search.noticeNumber}`,
    noticeNumber: search.noticeNumber,
    titleOriginal: overview.titleOriginal || search.titleOriginal,
    titleZh: translation.titleZh,
    summaryZh: translation.summaryZh,
    buyerOriginal,
    buyerZh: translation.buyerZh,
    regionZh: inferRegionZh(
      `${buyerOriginal} ${search.organizerOriginal || ""}`,
    ),
    methodOriginal: search.methodOriginal,
    methodZh: translateMethod(search.methodOriginal),
    budgetAmount,
    currency: "KZT",
    budgetTextZh: `预算金额：${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(budgetAmount)} 坚戈；税务口径以官方公告为准。`,
    publishedAt: overview.publishedAt,
    applicationStart: overview.applicationStart || search.applicationStart,
    deadline,
    status: statusFromDeadline(deadline, now),
    sourceName: SOURCE_NAME,
    sourceUrl: search.sourceUrl,
    verifiedAt,
  };
}

function mergeTenderRecords(existing, fresh, options = {}) {
  if (!fresh.length) return existing;
  const now = options.now || new Date();
  const maxItems = Math.max(1, Number(options.maxItems) || 30);
  const byId = new Map();
  for (const item of [...fresh, ...(existing.items || [])]) {
    if (!byId.has(item.id)) {
      byId.set(item.id, {
        ...item,
        status: item.deadline
          ? statusFromDeadline(item.deadline, now)
          : item.status,
      });
    }
  }
  return {
    schemaVersion: 1,
    generatedAt: options.generatedAt || new Date().toISOString(),
    items: [...byId.values()]
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, maxItems),
  };
}

function buildSearchUrl(options = {}) {
  const url = new URL("/ru/search/announce", BASE_URL);
  url.searchParams.set("count_record", String(options.count || 50));
  for (const status of ["210", "220", "240"])
    url.searchParams.append("filter[status][]", status);
  url.searchParams.set(
    "filter[amount_from]",
    String(options.minimumAmount || 1_000_000),
  );
  return url.href;
}

async function fetchTextWithRetry(url, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const attempts = Math.max(1, Number(options.attempts) || 3);
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      if (options.requestGate) await options.requestGate();
      const signals = [AbortSignal.timeout(options.timeoutMs || 25_000)];
      if (options.signal) signals.push(options.signal);
      const response = await fetchImpl(url, {
        signal: AbortSignal.any(signals),
        headers: {
          accept: "text/html,application/xhtml+xml",
          "accept-language": "ru-RU,ru;q=0.9",
          "user-agent": "SilkRoadTenderSync/2.0 (+https://oguz.kz/)",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts)
        await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
    }
  }
  throw new Error(`${url}: ${lastError?.message || "request failed"}`);
}

async function collectVerifiedTenderFacts(options = {}) {
  const now = options.now || new Date();
  const requestGate =
    options.requestGate ||
    createRequestGate({
      intervalMs: options.requestDelayMs ?? DEFAULT_REQUEST_DELAY_MS,
      now: options.nowMs,
      sleep: options.sleep,
    });
  const requestOptions = { ...options, requestGate };
  const searchHtml = await fetchTextWithRetry(
    buildSearchUrl(options),
    requestOptions,
  );
  const searchResults = parseSearchResults(searchHtml);
  const candidates = searchResults
    .filter(
      (item) =>
        item.deadline &&
        new Date(item.deadline) > now &&
        isTenderRelevant(item),
    )
    .slice(0, Math.max(1, Number(options.maxCandidates) || 8));
  const facts = [];
  const errors = [];

  for (const search of candidates) {
    try {
      const overviewUrl = search.sourceUrl.replace(/\?tab=lots$/, "");
      const overviewHtml = await fetchTextWithRetry(
        overviewUrl,
        requestOptions,
      );
      const lotsHtml = await fetchTextWithRetry(
        search.sourceUrl,
        requestOptions,
      );
      const overview = parseAnnouncementOverview(overviewHtml);
      const lots = parseLots(lotsHtml);
      if (overview.noticeNumber !== search.noticeNumber)
        throw new Error("notice number mismatch");
      if (
        !overview.publishedAt ||
        !overview.applicationStart ||
        !overview.deadline
      )
        throw new Error("announcement timestamps are incomplete");
      if (!lots.length) throw new Error("verified lot table is empty");
      if (new Set(lots.map((lot) => lot.buyerOriginal)).size !== 1)
        throw new Error("multiple buyers are not supported safely");
      facts.push({ search, overview, lots });
    } catch (error) {
      errors.push({ noticeNumber: search.noticeNumber, error: error.message });
    }
  }
  return { facts, errors, searchCount: searchResults.length };
}

module.exports = {
  BASE_URL,
  DEFAULT_REQUEST_DELAY_MS,
  SOURCE_NAME,
  buildSearchUrl,
  buildTenderRecord,
  collectVerifiedTenderFacts,
  createRequestGate,
  fetchTextWithRetry,
  inferRegionZh,
  isTenderRelevant,
  mergeTenderRecords,
  parseAlmatyDate,
  parseAmount,
  parseAnnouncementOverview,
  parseLots,
  parseSearchResults,
  statusFromDeadline,
  translateMethod,
};
