const PRIORITY_GROUPS = [
  new Set(["construction"]),
  new Set(["economy", "investment"]),
  new Set(["law", "government"]),
];

const EXCLUDED_TOPICS =
  /футбол|кпл|матч|ордабасы|тобол|погод|жар[ауы]|гроз|град|шквал|шторм|температур|зоопарк|животн|что сломалось|тест-драйв|обзор автомобил|пожар|возгоран|преступлен|алкогол|рейд/iu;
const BUSINESS_SIGNALS =
  /эконом|финанс|банк|депозит|инфляц|тенге|налог|бюджет|ввп|инвест|нефт|газ|энерг|опек|добыч|производ|промыш|завод|строител|инфраструктур|транспорт|логист|авиа|самолет|железнодорож|вокзал|экспорт|импорт|торгов|рынок|бизнес|предприним|компан|предприят|регулир|закон|постанов|приказ|лиценз|тариф|тамож|субсид|контракт|госзакуп|цифров|интернет|связь|маршрут|金融|银行|存款|通胀|投资|石油|天然气|能源|工业|工厂|建设|基础设施|交通|物流|航空|铁路|出口|进口|贸易|市场|企业|监管|法律|许可|关税|补贴|合同|政府采购|数字/iu;

function isBusinessRelevant(item) {
  if (item.sourceType === "legal") return true;
  const sourceText = [item.titleOriginal, item.summaryOriginal]
    .filter(Boolean)
    .join(" ");
  if (!sourceText || EXCLUDED_TOPICS.test(sourceText)) return false;
  return BUSINESS_SIGNALS.test(sourceText);
}

function scoreArticle(item, now = new Date()) {
  let score = Number(item.relevanceScore) || 0;
  if (item.sourceType === "official" || item.sourceType === "legal")
    score += 10;
  const published = new Date(item.publishedAt);
  if (
    !Number.isNaN(published.getTime()) &&
    now.getTime() - published.getTime() <= 12 * 60 * 60 * 1000
  )
    score += 5;
  if (item.category === "china_kz") score += 8;
  if (PRIORITY_GROUPS.some((group) => group.has(item.category))) score += 4;
  return score;
}

function selectDaily(items, options = {}) {
  const max = Math.max(1, Number(options.max) || 12);
  const now = options.now || new Date();
  const eligible = items
    .filter(
      (item) =>
        item.status !== "rejected" &&
        Number(item.relevanceScore) >= 65 &&
        isBusinessRelevant(item),
    )
    .map((item) => ({ ...item, rank: scoreArticle(item, now) }))
    .sort(
      (a, b) =>
        b.rank - a.rank || new Date(b.publishedAt) - new Date(a.publishedAt),
    );

  const selected = [];
  const selectedIds = new Set();
  for (const group of PRIORITY_GROUPS) {
    const candidate = eligible.find(
      (item) => group.has(item.category) && !selectedIds.has(item.id),
    );
    if (candidate && selected.length < max) {
      selected.push(candidate);
      selectedIds.add(candidate.id);
    }
  }
  for (const item of eligible) {
    if (selected.length >= max) break;
    if (!selectedIds.has(item.id)) {
      selected.push(item);
      selectedIds.add(item.id);
    }
  }
  return selected;
}

module.exports = {
  BUSINESS_SIGNALS,
  EXCLUDED_TOPICS,
  PRIORITY_GROUPS,
  isBusinessRelevant,
  scoreArticle,
  selectDaily,
};
