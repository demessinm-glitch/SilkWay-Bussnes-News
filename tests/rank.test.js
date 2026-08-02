const { test } = require("node:test");
const assert = require("node:assert/strict");
const { isBusinessRelevant, selectDaily } = require("../scripts/lib/rank");

test("deterministic business filter blocks lifestyle noise even when AI scores it highly", () => {
  const rejectedTitles = [
    "«Ордабасы», победив «Тобол», вернулся на вершину таблицы КПЛ-2026",
    "Жара до +40°С и грозы ожидаются в Казахстане 3 августа",
    "Как животных Алматинского зоопарка охлаждают в сильную жару",
    "Toyota bZ3X после 20 тыс. км: что сломалось первым",
    "Девять степных пожаров потушили в Акмолинской области",
    "В Алматы проводят рейды по профилактике преступлений из-за алкоголя",
  ];
  for (const [index, titleOriginal] of rejectedTitles.entries()) {
    assert.equal(
      isBusinessRelevant({
        id: `noise-${index}`,
        titleOriginal,
        sourceType: "business_media",
        relevanceScore: 99,
      }),
      false,
      titleOriginal,
    );
  }

  const acceptedTitles = [
    "Казахстан увеличит добычу нефти с сентября по решению ОПЕК+",
    "Казахстанцы накопили на депозитах рекордные 30 трлн тенге",
    "В Жамбылской области после ремонта открыли вокзал Боранды",
    "Интернет в самолетах может стать новым стандартом для казахстанских авиакомпаний",
  ];
  for (const [index, titleOriginal] of acceptedTitles.entries()) {
    assert.equal(
      isBusinessRelevant({
        id: `business-${index}`,
        titleOriginal,
        sourceType: "business_media",
        relevanceScore: 70,
      }),
      true,
      titleOriginal,
    );
  }

  assert.equal(
    isBusinessRelevant({
      titleOriginal: "О внесении изменений в приказ министра",
      sourceType: "legal",
    }),
    true,
  );
});

test("daily selection enforces quality threshold, category coverage and maximum", () => {
  const items = [
    {
      id: "low",
      titleOriginal: "Налоговые изменения для бизнеса",
      category: "economy",
      relevanceScore: 64,
      publishedAt: "2026-08-02T10:00:00+05:00",
    },
    {
      id: "economy",
      titleOriginal: "Банки Казахстана увеличили объем депозитов",
      category: "economy",
      relevanceScore: 80,
      sourceType: "business_media",
      publishedAt: "2026-08-02T10:00:00+05:00",
    },
    {
      id: "construction",
      titleOriginal: "Началось строительство новой инфраструктуры",
      category: "construction",
      relevanceScore: 78,
      sourceType: "official",
      publishedAt: "2026-08-02T09:00:00+05:00",
    },
    {
      id: "law",
      titleOriginal: "Принят новый закон о лицензировании",
      category: "law",
      relevanceScore: 76,
      sourceType: "legal",
      publishedAt: "2026-08-02T08:00:00+05:00",
    },
    {
      id: "extra",
      titleOriginal: "Нефтяные компании увеличили добычу",
      category: "energy",
      relevanceScore: 99,
      sourceType: "business_media",
      publishedAt: "2026-08-02T07:00:00+05:00",
    },
  ];

  const selected = selectDaily(items, {
    max: 3,
    now: new Date("2026-08-02T12:00:00+05:00"),
  });

  assert.equal(selected.length, 3);
  assert.deepEqual(
    new Set(selected.map((item) => item.id)),
    new Set(["economy", "construction", "law"]),
  );
  assert.ok(!selected.some((item) => item.id === "low"));
});
