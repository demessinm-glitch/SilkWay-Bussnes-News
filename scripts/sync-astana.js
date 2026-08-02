const fs = require("node:fs");
const path = require("node:path");
const { publishJsonSafely } = require("./lib/storage");

const SOURCE_URL =
  "https://www.gov.kz/memleket/entities/astana/about/structure?lang=en";
const OUT_PATH = path.join(__dirname, "..", "data", "astana-structure.json");

function normalizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function stripSecurityNotice(value = "") {
  const text = normalizeText(value);
  return /(Ақпараттық қауіпсіздік|Доступ на интернет-ресурс временно ограничен|support\.sts\.kz)/i.test(
    text,
  )
    ? ""
    : text;
}

function htmlToText(value = "") {
  return String(value)
    .replace(/<\/(p|li|div|h[1-6]|ol|ul)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .split(/\n+/)
    .map(normalizeText)
    .filter(Boolean)
    .join("\n");
}

function getChineseFields(id) {
  const translations = {
    307: {
      nameZh: "卡瑟姆别克·热尼斯·马赫穆杜雷",
      positionZh: "阿斯塔纳市市长",
      generalInfoZh:
        "卡瑟姆别克·热尼斯·马赫穆杜雷于1975年出生在江布尔州。毕业于哈萨克国立建筑与建设学院，专业为建筑与设计。2001年毕业于古米廖夫欧亚国立大学，专业为公共管理。",
      careerHistoryZh:
        "1997年，他在哈萨克国立建筑与建设学院以实习研究员身份开始职业生涯。1998年至2000年，任哈萨克斯坦共和国反垄断政策委员会部门负责人，并曾任哈萨克斯坦共和国交通与通信部水运司司长。2004年至2005年，任阿克套国际海港商业港口司长。2005年11月，被任命为交通与通信部副部长，后任交通与通信部执行秘书，并曾任交通与通信部长。此后，任投资与发展部长、工业和基础设施发展部长。2019年2月25日，任哈萨克斯坦共和国副总理。2019年9月19日至2022年12月，任卡拉干达州州长。2022年12月8日起，任阿斯塔纳市市长。",
    },
    1813: {
      nameZh: "努尔肯诺夫·努尔兰·詹贝尔舒勒",
      positionZh: "阿斯塔纳市第一副市长",
      workScopeZh:
        "城市公共交通与通信、道路基础设施、轻轨建设、清雪、城市边缘区域发展、建筑施工监管、劳动监察、兽医、植物保护、公用事业、排水和雨水渠、公用工程网络。",
      generalInfoZh:
        "他个人负责城市公共交通与通信、道路基础设施建设、轻轨线路建设、清雪、城市边缘区域发展、国家建筑和施工监管、劳动监察、兽医、植物保护、公用事业（水供应与用水）、排水、雨水渠以及公用工程网络等领域。他于1976年11月3日出生在采利诺格勒市。教育经历包括：塞弗林阿克莫拉农业大学、哈萨克斯坦共和国总统直属学院国家公共政策学院、卡拉干达经济大学。",
      careerHistoryZh:
        "1999年至2006年，他在阿斯塔纳市政府担任多个职务。2017年至2019年，任哈萨克斯坦共和国总统办公厅国家监察员（阿斯塔纳）。2019年至2022年，任努尔苏丹市副市长。自2022年9月19日起，任阿斯塔纳市副市长。自2023年1月9日起，任阿斯塔纳市第一副市长。",
    },
    24969: {
      nameZh: "拜肯·耶塞特·别里库雷",
      positionZh: "阿斯塔纳市副市长",
      workScopeZh:
        "下属法人实体、共有建设及问题项目完工、动员和民防、征兵、违法行为预防、内部与青年政策、社会稳定、宗教、教育和语言发展。",
      generalInfoZh:
        "他个人负责与市政府下属法人实体有关的工作、共有建设、问题共有建设项目完工、动员、领土和民防、征兵入伍公民、城市违法行为预防、内部政策、青年政策和意识形态、首都社会政治稳定与社会和谐，以及哈萨克斯坦人民大会秘书处、宗教、预防宗教极端主义和恐怖主义、教育和语言发展等领域。耶塞特·别里库雷·拜肯于1986年10月23日出生在卡拉干达州滕吉兹地区巴尔希诺村。受过高等教育：2005年毕业于哈萨克人文法律大学人文与法律学院，2008年毕业于哈萨克人文法律大学，2010年毕业于叶·阿·布克托夫卡拉干达国立大学。2015年获“劳动优秀奖章”。已婚，育有三个孩子。",
      careerHistoryZh:
        "2008年12月12日至2009年2月18日，任阿斯塔纳经济和预算规划局投资政策与规划处代理首席专家；2009年2月18日至2009年7月16日，任该处首席专家；2009年7月16日至2010年10月28日，任该处主任专家；2010年10月28日至2010年11月23日，任阿斯塔纳经济和预算规划局法律保障与采购处主任专家；2010年11月23日至2013年3月7日，任阿斯塔纳市长办公室社会文化领域部门主任专家；2013年3月7日至2013年8月26日，任阿斯塔纳市长首席监察员；2013年8月26日至2016年8月8日，任阿斯塔纳市长办公室组织和监察部负责人；2016年8月9日至2017年8月1日，任哈萨克斯坦共和国总统办公厅主任秘书处专家；2017年8月2日至2019年1月31日，任哈萨克斯坦共和国总统办公厅国家控制和组织地域工作部国家监察员；2019年2月1日至2019年7月3日，任卡拉干达州努拉区区长；2019年7月4日至2019年8月28日，任努尔苏丹市长办公室副主任；2019年8月29日至2020年，任努尔苏丹市长办公厅主任；2020年10月14日至2022年2月，任萨雷阿尔卡区区长；2022年2月9日至2022年9月，任努尔苏丹市副市长；自2022年9月19日起，任阿斯塔纳市副市长。",
    },
    24546: {
      nameZh: "格洛托夫·叶夫根尼·谢尔盖耶维奇",
      positionZh: "阿斯塔纳市副市长",
      workScopeZh:
        "财政预算与经济政策、投资和创新发展、创业、工业、旅游、食品供应、农业、就业与社会保护、公共服务、数字化、卫生、文化和体育。",
      generalInfoZh:
        "他个人负责财政、预算和经济政策，投资与创新发展，创业、工业、旅游、食品供应、农业、就业和社会保护，公共服务、数字化、本地内容推广和协调、“简单事物经济”、社会企业公司（SEC）、卫生、Ikomek 服务工作、文化、体育文化和运动等领域。",
      careerHistoryZh: "官方页面未提供单独的工作履历内容。",
    },
    22165: {
      nameZh: "叶什克耶夫·道拉特·扎托维奇",
      positionZh: "阿斯塔纳市市长办公室主任",
      workScopeZh: "市长办公室机关管理、组织协调与行政保障。",
      generalInfoZh:
        "他于1975年出生在卡拉干达。1996年毕业于卡拉干达国立大学（经济学家），2000年和2014年毕业于卡拉干达消费者合作经济大学（法学家、经济学硕士）。",
      careerHistoryZh:
        "1999年至2007年，他在卡拉干达州海关机关担任多个职务。2007年至2023年，曾领导卡拉干达州州长办公室多个部门。曾任卡拉干达市卡济别克比区副区长、卡拉干达州州长办公室副主任、主任。2023年2月17日，被任命为阿斯塔纳市市长办公室主任。",
    },
  };

  const translation = translations[id];
  if (!translation) {
    return {};
  }

  return {
    ...translation,
    detailZh: [translation.generalInfoZh, translation.careerHistoryZh]
      .filter(Boolean)
      .join("\n"),
    translationNote: "本页面内容翻译自原网站，中文翻译仅供参考",
  };
}

function readExistingPayload() {
  try {
    return JSON.parse(fs.readFileSync(OUT_PATH, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const existing = readExistingPayload();
  const payload = await scrapeWithPlaywright().catch(async (error) => {
    console.warn(`Playwright scrape failed: ${error.message}`);
    return scrapeStaticHtml().catch((fallbackError) => {
      console.warn(`Static scrape failed: ${fallbackError.message}`);
      return { people: [], warning: fallbackError.message };
    });
  });

  const sourceSucceeded =
    Array.isArray(payload.people) && payload.people.length > 0;
  if (!sourceSucceeded && existing?.people?.length) {
    throw new Error(
      "Astana source returned no people; previous data and timestamp were preserved.",
    );
  }

  let people =
    payload.people && payload.people.length > 0
      ? mergePeople(payload.people, existing?.people || [])
      : existing?.people || [];

  if ((!payload.people || payload.people.length === 0) && people.length > 0) {
    people = await enrichExistingPeopleFromApi(people);
  }
  const output = {
    sourceUrl: SOURCE_URL,
    syncedAt: new Date().toISOString(),
    title: "Astana city administration structure",
    people,
    warning:
      people.length === 0
        ? payload.warning || "No people were extracted from the source page."
        : undefined,
  };

  publishJsonSafely(OUT_PATH, output, {
    collectionSucceeded: sourceSucceeded,
    itemsKey: "people",
    rejectEmpty: true,
  });
}

function mergePeople(freshPeople, existingPeople) {
  const existingByName = new Map(
    existingPeople.map((person) => [
      normalizeText(person.name).toLowerCase(),
      person,
    ]),
  );

  return freshPeople.map((person) => {
    const existing =
      existingByName.get(normalizeText(person.name).toLowerCase()) || {};
    return {
      ...person,
      id: sourceBackedId(person) || sourceBackedId(existing),
      biographyUrl: person.biographyUrl || existing.biographyUrl || "",
      phone: chooseLonger(person.phone, existing.phone),
      receptionPhone: chooseLonger(
        person.receptionPhone,
        existing.receptionPhone || existing.phone,
      ),
      detail: person.detail || existing.detail || existing.career || "",
      career: person.career || existing.career || existing.detail || "",
      generalInfo: person.generalInfo || existing.generalInfo || "",
      careerHistory: person.careerHistory || existing.careerHistory || "",
      responsibilities:
        person.responsibilities || existing.responsibilities || "",
    };
  });
}

function chooseLonger(primary = "", fallback = "") {
  const first = normalizeText(primary);
  const second = normalizeText(fallback);
  return second.length > first.length ? second : first;
}

async function scrapeWithPlaywright() {
  const { chromium } = require("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1200 },
    userAgent: "Mozilla/5.0 (compatible; SilkRoadInfoSync/1.0)",
  });

  try {
    await page.goto(SOURCE_URL, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(3500);

    const people = await page.evaluate(() => {
      const source = location.href;

      function clean(value) {
        return String(value || "")
          .replace(/\s+/g, " ")
          .trim();
      }

      function absoluteUrl(value) {
        try {
          return value ? new URL(value, source).href : "";
        } catch {
          return "";
        }
      }

      function textLines(node) {
        return String(node.innerText || "")
          .split(
            /\n|(?=Phone number:)|(?=E-mail:)|(?=Reception dates:)|(?=Areas of work)|(?=Supervised areas)|(?=Biography)/i,
          )
          .map(clean)
          .filter(Boolean);
      }

      function guessName(lines) {
        return (
          lines.find(
            (line) =>
              /^[A-Z][A-Za-z' -]+ [A-Z][A-Za-z' -]+/.test(line) &&
              line.length < 90 &&
              !/(Akim|Mayor|Deputy|Chief|Head|Phone|E-mail|Reception|Biography|Areas of work)/i.test(
                line,
              ),
          ) ||
          lines[0] ||
          ""
        );
      }

      function cleanName(value) {
        return clean(value).replace(
          /\s+(Mayor|Akim|First Deputy Akim|Deputy Akim|Deputy Mayor|Chief of Staff.*)$/i,
          "",
        );
      }

      function extractAfter(text, labelPattern, stopPattern) {
        const label = text.match(labelPattern);
        if (!label) return "";
        const start = label.index + label[0].length;
        const tail = text.slice(start);
        const stop = tail.search(stopPattern);
        return clean(stop >= 0 ? tail.slice(0, stop) : tail);
      }

      const cards = Array.from(
        document.querySelectorAll("article, li, section, div"),
      )
        .filter((node) => {
          const text = clean(node.innerText);
          return (
            text.length > 80 &&
            text.length < 1400 &&
            /(Phone number|E-mail|Biography|Reception dates|Supervised areas)/i.test(
              text,
            ) &&
            node.querySelector("img")
          );
        })
        .filter(
          (node, index, all) =>
            !all.some(
              (other, otherIndex) =>
                otherIndex !== index && other.contains(node),
            ),
        );

      return cards.map((card) => {
        const fullText = clean(card.innerText);
        const lines = textLines(card);
        const name = cleanName(guessName(lines));
        const biographyLink = Array.from(card.querySelectorAll("a")).find(
          (link) => /biography/i.test(clean(link.innerText)),
        );
        const photo = card.querySelector("img");
        const phone = fullText.match(/\+7[\d\s()–-]{8,}/)?.[0] || "";
        const email =
          fullText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
        const position =
          lines.find(
            (line) =>
              line !== name &&
              /^(Mayor|Akim|First Deputy Akim|Deputy Akim|Deputy Mayor|Chief of Staff|Head)/i.test(
                line,
              ),
          ) ||
          lines.find(
            (line) =>
              line !== name &&
              /(Akim|Mayor|Deputy|Chief of Staff)/i.test(line) &&
              line.length < 120,
          ) ||
          "";
        const directions = extractAfter(
          fullText,
          /(Areas of work|Supervised areas|Curated directions|Responsible areas):?/i,
          /(Phone number|Phone:|E-mail|Reception dates|Biography)/i,
        );

        return {
          name,
          position,
          photo: absoluteUrl(
            photo?.getAttribute("src") || photo?.getAttribute("data-src"),
          ),
          phone: clean(phone),
          email: clean(email),
          biographyUrl: absoluteUrl(biographyLink?.getAttribute("href")),
          career: "",
          detail: "",
          responsibilities: directions,
        };
      });
    });

    await enrichBiographies(browser, people);
    return { people: compactPeople(people) };
  } finally {
    await browser.close();
  }
}

async function enrichBiographies(browser, people) {
  const targets = people.filter((person) => person.biographyUrl).slice(0, 20);

  for (const person of targets) {
    const apiDetails = await fetchCuratorDetails(person).catch((error) => {
      console.warn(`Curator API failed for ${person.name}: ${error.message}`);
      return null;
    });

    if (apiDetails) {
      Object.assign(person, apiDetails);
      continue;
    }

    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });
    try {
      await page.goto(person.biographyUrl, {
        waitUntil: "networkidle",
        timeout: 60000,
      });
      await page.waitForTimeout(1200);
      const biography = await page.evaluate(() => {
        const clone = document.body.cloneNode(true);
        clone
          .querySelectorAll("script, style, header, footer, nav, svg")
          .forEach((node) => node.remove());
        return String(clone.innerText || "")
          .replace(/\s+/g, " ")
          .trim();
      });
      person.detail = stripSecurityNotice(biography).slice(0, 2800);
      person.career = person.detail;
    } catch (error) {
      person.career = "";
      person.biographyWarning = error.message;
    } finally {
      await page.close();
    }
  }
}

async function enrichExistingPeopleFromApi(people) {
  const updated = [];

  for (const person of people) {
    if (!person.biographyUrl) {
      updated.push(person);
      continue;
    }

    const apiDetails = await fetchCuratorDetails(person).catch((error) => {
      console.warn(`Curator API failed for ${person.name}: ${error.message}`);
      return null;
    });

    updated.push(apiDetails ? { ...person, ...apiDetails } : person);
  }

  return updated;
}

async function fetchCuratorDetails(person) {
  const id = person.biographyUrl.match(/people\/(\d+)/)?.[1];
  if (!id) return null;

  const response = await fetch(
    `https://www.gov.kz/api/v1/public/content-manager/curators/${id}`,
    {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; SilkRoadInfoSync/1.0)",
        accept: "application/json",
        "accept-language": "en",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const generalInfo = stripSecurityNotice(htmlToText(data.biography || ""));
  const careerHistory = stripSecurityNotice(
    htmlToText(data.biography_details || ""),
  );

  return {
    id: Number(id),
    name:
      normalizeText(
        [data.lastname, data.name, data.middlename].filter(Boolean).join(" "),
      ) || person.name,
    position: normalizeText(
      data.level?.items?.[0]?.position || data.position || person.position,
    ),
    photo: data.photo
      ? new URL(data.photo, "https://www.gov.kz").href
      : person.photo,
    phone: normalizeText(data.phone || person.phone),
    receptionPhone: normalizeText(
      data.public_reception_phone ||
        data.phone ||
        person.receptionPhone ||
        person.phone,
    ),
    email: normalizeText(data.email || person.email),
    biographyUrl: `https://www.gov.kz/memleket/entities/astana/about/structure/people/${id}?lang=en`,
    career: [generalInfo, careerHistory].filter(Boolean).join("\n"),
    detail: [generalInfo, careerHistory].filter(Boolean).join("\n"),
    generalInfo,
    careerHistory,
    ...getChineseFields(id),
  };
}

function sourceBackedId(person) {
  const value =
    person.id || person.biographyUrl?.match(/\/people\/(\d+)/)?.[1] || "";
  return /^\d+$/.test(String(value)) ? Number(value) : null;
}

function compactPeople(people) {
  const seen = new Set();

  return people
    .map((person) => ({
      id: sourceBackedId(person),
      name: normalizeText(person.name),
      position: normalizeText(person.position),
      photo: normalizeText(person.photo),
      phone: normalizeText(person.phone),
      receptionPhone: normalizeText(person.receptionPhone),
      email: normalizeText(person.email),
      biographyUrl: normalizeText(person.biographyUrl),
      career: normalizeText(person.career),
      detail: stripSecurityNotice(person.detail || person.career),
      generalInfo: normalizeText(person.generalInfo),
      careerHistory: normalizeText(person.careerHistory),
      nameZh: normalizeText(person.nameZh),
      positionZh: normalizeText(person.positionZh),
      generalInfoZh: normalizeText(person.generalInfoZh),
      careerHistoryZh: normalizeText(person.careerHistoryZh),
      detailZh: normalizeText(person.detailZh),
      workScopeZh: normalizeText(person.workScopeZh),
      translationNote: normalizeText(person.translationNote),
      responsibilities: normalizeText(person.responsibilities),
    }))
    .filter(
      (person) =>
        person.name && !seen.has(person.name) && seen.add(person.name),
    );
}

async function scrapeStaticHtml() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; SilkRoadInfoSync/1.0)",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${SOURCE_URL}: ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();
  const text = normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );

  return {
    people: [],
    warning: text.includes("enable JavaScript")
      ? "Source page requires JavaScript rendering."
      : "Static HTML did not contain person cards.",
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
