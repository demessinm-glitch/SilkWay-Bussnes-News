const fs = require("node:fs");
const path = require("node:path");
const { publishJsonSafely } = require("./lib/storage");

const SOURCE_URL =
  "https://www.gov.kz/memleket/entities/almaty/about/structure?lang=en";
const API_URL =
  "https://www.gov.kz/api/v1/public/content-manager/curators?projects=almaty&lang=en";
const OUT_PATH = path.join(__dirname, "..", "data", "almaty-people.json");
const DISCLAIMER = "本页面内容翻译自原网站，中文翻译仅供参考";

const CHINESE_FIELDS = {
  51061: {
    nameZh: "萨特巴尔德·达尔汗·阿曼格尔德吾勒",
    positionZh: "阿拉木图市市长",
    workScopeZh: "负责阿拉木图市政府全面领导与城市治理统筹工作。",
    generalInfoZh:
      "1974年3月26日出生于南哈萨克斯坦州。毕业于萨肯·赛富林阿克莫拉农业学院（1996年）和哈萨克人文法律大学（2003年）。\n其专业为经济管理和法律，拥有经济学副博士学位。",
    careerHistoryZh:
      "1996-2000年，在商业机构担任会计和经济师。\n2000-2002年，在财政部预算程序控制司担任高级和首席监察审计员。\n2002-2006年，在哈萨克斯坦共和国总统办公厅担任助理、顾问、首席专家和处长。\n2006-2007年，任阿斯塔纳市政府下属市政国有企业“Zhylu”主任。\n2007-2010年，任预算司副司长、财政司副司长，以及教育和科学部科学委员会副主席。\n2010-2011年，任国家安全委员会部门负责人。\n2011-2013年，任总理办公厅社会经济处副处长。\n2013-2015年，任奇姆肯特市市长。\n2015-2017年，任南哈萨克斯坦州第一副州长。\n2018-2019年，任哈萨克斯坦共和国议会上院议员。\n2019-2022年，任哈萨克斯坦共和国驻乌兹别克斯坦共和国特命全权大使。\n2022-2025年，任突厥斯坦州州长。\n2025年1月至5月，任哈萨克斯坦共和国总统办公厅第一副主任。\n自2025年5月起，任阿拉木图市市长。\n获奖情况：曾获“Eren Enbegi Ushin”奖章、“Qurmet”勋章和“Parasat”勋章。",
  },
  15672: {
    nameZh: "阿赫托夫·马迈·卡尼耶维奇",
    positionZh: "阿拉木图市政府伦理专员",
    workScopeZh: "负责阿拉木图市政府伦理规范、廉政文化和公务行为相关协调工作。",
    generalInfoZh:
      "马迈·卡济耶维奇·阿赫托夫出生于1967年9月26日。1994年毕业于阿里-法拉比哈萨克国立大学，专业为语言文学，取得哈萨克语言文学教师资格。",
    careerHistoryZh:
      "1984年，在克孜勒奥尔达州卡尔加雷国营农场以工人身份开始工作。1986年至1988年，在阿尔汉格尔斯克服苏联军役。\n1994年至1999年，大学毕业后在哈萨克国立法学院任教师。\n1999年至2005年，任穆赫塔尔·阿乌埃佐夫文学艺术研究所高级研究员。\n2005年至2007年，任阿拉木图文化局副局长。2007年任阿拉木图市内政政策局副局长。2007年至2009年，任语言发展与协调处处长。\n2009年至2010年，任阿拉木图市政府市政国有企业“Til”主任。\n2010年至2017年，任阿拉木图市语言、档案和文书发展局代理局长、局长。\n自2017年起，担任阿拉木图市长办公室伦理专员。\n2014年获“Eren enbegi ushin”奖章。",
  },
  13982: {
    nameZh: "阿米罗娃·塔米拉·捷利马诺夫娜",
    positionZh: "阿拉木图市市长办公室财务经济处负责人",
    workScopeZh: "负责市长办公室财务、预算、经济保障和相关行政管理工作。",
    generalInfoZh:
      "塔米拉·阿米罗娃出生于1973年1月14日。1996年毕业于江布尔轻工和食品工业技术学院，专业为技术与设计；2004年毕业于吉尔吉斯国立大学（以朱·巴拉萨根命名），专业为金融与信贷。",
    careerHistoryZh:
      "2001年1月15日至2002年10月23日，在吉尔吉斯共和国索库卢克区国家税务监察局税收和缴款征收监督处、地方税征收监督处、土地税财务经济处担任税务监察员。\n2004年4月14日至2011年5月24日，在卡普恰盖市税务局担任代理税务监察员、税务监察员、首席税务监察员、首席专家，以及会计分析、法人信息接收处理、个人信息接收处理等部门的首席税务监察员，并担任法人信息接收处理处信息技术部门主任税务监察员兼程序员。\n2011年5月25日至2013年3月10日，在阿拉木图市梅代乌区税务局个人信息接收处理中心、法人和个体企业家信息接收处理中心担任主任专家、主任税务监察员。\n2013年3月11日至2018年3月1日，任阿拉木图市长办公室内部审计服务首席专家。\n2018年3月2日至2022年1月16日，任阿拉木图市长办公室财务经济处首席专家。\n2020年10月22日至2022年1月16日，任阿拉木图市长办公室财务经济处代理负责人。\n自2022年1月17日起，任阿拉木图市长办公室财务经济处负责人。",
  },
  13985: {
    nameZh: "伊马舍夫·谢里克·叶拉迪勒吾勒",
    positionZh: "阿拉木图市长办公室意识形态工作发展处负责人",
    workScopeZh: "负责意识形态工作、公共沟通和相关政策协调工作。",
    generalInfoZh:
      "谢里克·叶拉迪勒吾勒·伊马舍夫出生于1993年3月25日。2015年毕业于阿里-法拉比哈萨克国立大学，专业为法律。",
    careerHistoryZh:
      "2015年，在阿拉木图工业学院担任社会与人文学科讲师，开始职业生涯。\n2016年，在阿拉木图市瑙雷兹拜区区长办公室担任技术人员（统计员）。\n2017年至2019年，在阿拉木图市瑙雷兹拜区区长办公室文化和语言发展处先后担任代理首席专家、首席专家。\n2019年至2020年，在卡拉干达州文化、档案和文书局组织工作与公共服务处担任首席专家。\n2020年至2021年，在卡拉干达州文化、档案和文书局任处长。\n2021年，任阿拉木图市阿уезов区区长助理。\n2022年至2025年，任阿拉木图州卡拉赛区区长顾问。\n自2026年1月起，任阿拉木图市长办公室意识形态工作处负责人。",
  },
  21810: {
    nameZh: "马杰耶娃·扎娜尔·阿瑟尔别科夫娜",
    positionZh: "阿拉木图市长办公室区域发展处负责人",
    workScopeZh: "负责区域发展、城区协调和相关规划执行工作。",
    generalInfoZh:
      "马杰耶娃·阿纳尔·阿克勒别科夫娜出生于1981年3月15日。2004年毕业于哈萨克国立医科大学，专业为医学；2012年毕业于阿拉木图经济与统计学院，专业为金融；2018年毕业于公共卫生研究生院，专业为公共卫生。",
    careerHistoryZh:
      "2005年9月12日至2014年4月18日，任区级全科医生、第一治疗科主任、代理副主治医师、国有企业“城市综合门诊部第16号”医疗工作副主治医师。\n2014年4月21日至2014年10月10日，任阿拉木图市卫生局卫生发展项目规划、分析和监测处代理首席专家。\n2014年10月10日至2016年6月13日，任阿拉木图市卫生局公共服务处负责人。\n2016年6月13日至2016年8月1日，任阿拉木图市卫生局医疗预防服务和公共服务处首席专家。\n2016年8月1日至2018年5月21日，任阿拉木图市卫生局卫生发展项目规划、分析和监测处负责人。\n2018年5月21日至2018年6月25日，任阿拉木图市卫生局公共卫生、卫生项目监测和信息技术发展处负责人。\n2018年6月25日至2018年8月1日，任阿拉木图市卫生局代理副局长。\n2018年8月1日至2019年2月5日，任阿拉木图市卫生局副局长。\n2019年2月5日至2021年2月25日，任阿拉木图市公共卫生局副局长。\n2021年2月26日至2022年1月16日，任阿拉木图市长办公室检查工作处首席监察员。\n2022年1月17日至2024年7月21日，任阿拉木图市长办公室检查工作处负责人。\n自2024年7月22日起，任阿拉木图市长办公室区域发展处负责人。",
  },
  22116: {
    nameZh: "梅尔扎别科娃·古尔努尔·捷吉斯克孜",
    positionZh: "阿拉木图市长办公室法律处负责人",
    workScopeZh: "负责市长办公室法律事务、规范性文件和法务协调工作。",
    generalInfoZh:
      "古尔努尔·梅尔扎别科娃出生于1978年9月22日。1999年毕业于阿里-法拉比哈萨克国立大学，专业为法律。",
    careerHistoryZh:
      "2000年9月11日至2001年4月30日，任阿拉木图司法组织分析处代理主任专家和主任专家。\n2001年5月1日至2001年7月29日，任阿拉木图司法局组织控制和人事工作、法律系统化和编纂处主任专家。\n2001年7月30日至2004年4月25日，任阿拉木图司法局登记处、公证、法律宣传组织和向居民提供法律援助处主任专家、首席专家。\n2004年4月26日至2009年9月24日，任阿拉木图司法局登记处、公证、法律宣传组织和向居民提供法律援助处首席专家。\n2009年9月25日至2011年6月17日，任阿拉木图司法局组织、控制和人事工作处首席专家。\n2011年6月18日至2011年12月8日，任阿拉木图司法局规范性法律文件登记处首席专家。\n2011年12月9日至2015年10月27日，任阿拉木图市长办公室法律处首席专家。\n2015年10月28日至2019年10月31日，任阿拉木图市长办公室国家法律处首席专家。\n2019年11月1日至2022年1月16日，任阿拉木图市长办公室国家法律处首席监察员。\n2022年1月17日至2022年3月31日，任阿拉木图市长办公室法律处首席监察员。\n2020年9月28日至2022年1月16日，任阿拉木图市长办公室国家法律处代理负责人。\n2022年1月17日至2022年3月31日，任阿拉木图市长办公室法律处代理负责人。\n自2022年4月1日起，任阿拉木图市长办公室法律处负责人。",
  },
  21809: {
    nameZh: "拉赫姆巴耶夫·阿德列特·巴赫特詹诺维奇",
    positionZh: "阿拉木图市长办公室组织监督工作处负责人",
    workScopeZh: "负责组织监督、执行检查和市政府内部协调工作。",
    generalInfoZh:
      "拉赫姆巴耶夫·阿德列特·巴赫特詹诺维奇出生于1991年11月17日。2014年毕业于哈萨克工程与金融银行学院。",
    careerHistoryZh:
      "2015年，在 Altyn Adam Agency LLP 担任专家，开始职业生涯。\n2015年至2017年，在 Intercomp Outsourcing Kazakhstan LLP 担任专家。\n2021年至2022年，在阿拉木图市创业与投资局农业工业综合体处担任代理首席专家，后任首席专家。\n2022年至2023年，任阿拉木图市“阿塔梅肯”全国企业家商会对外关系与创新处负责人。\n2023年至2024年，在阿拉木图市财政局国家机关、国防和执法机构领域预算规划处担任代理首席专家，后任首席专家。\n2024年至2025年，在阿拉木图市长办公室组织与控制工作处担任首席专家和首席监察员。\n自2025年11月起，任阿拉木图市长办公室组织与控制工作处负责人。",
  },
  22117: {
    nameZh: "桑巴耶娃·古尔米拉·绍特诺娃",
    positionZh: "阿拉木图市长办公室国家秘密保护处负责人",
    workScopeZh: "负责市政府国家秘密保护、文档保密和相关内部管理工作。",
    generalInfoZh:
      "古尔米拉·桑巴耶娃出生于1970年4月2日。1993年毕业于伊·詹苏古罗夫塔尔迪库尔干师范学院，专业为“哈萨克学校中的俄语和文学”。",
    careerHistoryZh:
      "1987年8月10日至1988年12月31日，在萨雷巴斯套村担任俄语和文学教师。\n1993年9月1日至1994年10月3日，在塔尔加尔区基洛夫任俄语和历史教师。\n1994年10月10日至1994年11月30日，任塔尔加尔区基洛夫教育工作副校长。\n1994年12月1日至1994年2月27日，在萨雷巴斯套任俄语和文学教师。\n1995年3月5日至1995年8月26日，在萨雷巴斯套任教育工作副校长。\n1995年8月27日至1996年8月6日，任区人文学科方法专家。\n1996年8月12日至1998年3月9日，在阿拉木图州伊犁区教育部门工作。\n1998年3月10日至1999年6月1日，任阿拉木图州伊犁区学生之家方法专家。\n2001年7月26日至2002年3月27日，在萨雷奥泽克第97751、第77035部队塔尔加尔通信计算中心任高级操作员。\n2002年3月28日至2003年8月10日，在萨雷奥泽克第77035部队任硬件设备机械师。\n2003年8月11日至2005年6月3日，在萨雷奥泽克第74852、第12740部队任保密部门负责人。\n2005年6月4日至2007年11月23日，任萨雷奥泽克第12740部队保密部门责任执行员。\n2007年11月24日至2008年3月17日，任第12740部队保密部门文员。\n2008年3月18日至2008年9月18日，任第12740部队保密部门负责人。\n2008年9月19日至2012年4月1日，在阿拉木图第85095部队行政处保密部门任执行人员，隶属哈萨克斯坦共和国武装力量空中机动部队司令部。\n2012年4月2日至2017年2月1日，在阿拉木图第85095部队保密部门任责任执行员，隶属哈萨克斯坦共和国武装力量空中机动部队司令部。\n2017年2月2日至2017年6月1日，任行政处保密部门负责人。\n2020年10月26日至2020年11月29日，在阿拉木图哈萨克斯坦共和国武装力量空中机动部队司令部工作。\n2020年11月30日至2021年5月4日，任阿拉木图市长办公室国家秘密保护处代理首席专家。\n自2021年5月5日起，任阿拉木图市长办公室国家秘密保护处首席专家、国家秘密保护处负责人。",
  },
  20852: {
    nameZh: "希甘巴耶夫·穆拉特·卡纳皮亚维奇",
    positionZh: "阿拉木图市长办公室内部审计服务负责人、国家审计员",
    workScopeZh: "负责内部审计、财政监督和政府机关审计合规相关工作。",
    generalInfoZh:
      "希甘巴耶夫·穆拉特·卡纳皮亚维奇于1976年10月29日出生于卡拉干达州巴尔喀什市。\n2001年毕业于以 O.A. 拜科努罗夫命名的热兹卡兹甘大学，专业为经济与管理。2005年毕业于哈萨克-俄罗斯大学，专业为法律。2012年获得卡拉干达“Bolashak”大学经济与商业硕士学位，2013年获得哈萨克斯坦共和国总统直属公共行政学院公共管理硕士学位。",
    careerHistoryZh:
      "1994年，在巴尔喀什铜业生产联合体修理机械服务部门担任维修钳工，开始职业生涯。自2001年起在公务员体系工作。\n2021年至2025年，任哈萨克斯坦共和国金融监督署内部审计服务负责人。\n自2026年1月起，任阿拉木图市长办公室内部审计服务处负责人、国家审计员。",
  },
  13143: {
    nameZh: "察尔科娃·加林娜·阿纳托利耶夫娜",
    positionZh: "阿拉木图市长办公室文件保障与监督处负责人",
    workScopeZh: "负责文件流转、行政监督、执行控制和办公室文书保障工作。",
    generalInfoZh:
      "加林娜·察尔科娃出生于1963年1月3日。1986年毕业于以 S.M. 基洛夫命名的哈萨克国立大学，专业为法律。",
    careerHistoryZh:
      "1981年9月1日至1986年8月5日，任阿拉木图铁路护士。\n1986年11月17日至1989年1月2日，任阿拉木图市执行委员会登记办公室站点监察员、高级监察员。\n1989年1月2日至1992年5月13日，任阿拉木图市执行委员会司法局登记办公室顾问、高级专家、主任专家。\n1992年5月15日至1992年10月23日，任阿拉木图“Hydroplastika”市政企业律师。\n1992年11月10日至1993年12月6日，任阿拉木图市行政负责人办公室国家法律处主任专家。\n1994年1月3日至1994年10月13日，任阿拉木图市行政劳动就业总局主任专家律师。\n1994年10月10日至1996年3月20日，任阿拉木图市行政负责人办公室来信和接待公民处主任专家。\n1996年3月21日至1999年7月31日，任阿拉木图市行政负责人办公室综合处主任专家。\n1999年8月1日至2003年4月20日，任阿拉木图市长综合处首席专家。\n2003年4月21日至2008年6月2日，任阿拉木图市长控制、检查和人事工作处首席专家。\n2008年6月3日至2010年11月28日，任阿拉木图市长文件保障处首席专家。\n2010年11月29日至2022年1月16日，任阿拉木图市长文件保障处处长、部门负责人。\n自2022年1月17日起，任阿拉木图市长文件保障与监督处负责人。\n曾获哈萨克斯坦共和国荣誉证书（2015年）和“最佳公务员”徽章（2018年）。",
  },
};

function normalizeText(value = "") {
  return String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&ntilde;/g, "n")
    .replace(/&Uuml;/g, "U")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .split(/\n+/)
    .map(normalizeText)
    .filter(Boolean)
    .join("\n");
}

function absoluteGovUrl(value = "") {
  return value ? new URL(value, "https://www.gov.kz").href : "";
}

function readExistingPayload() {
  try {
    return JSON.parse(fs.readFileSync(OUT_PATH, "utf8"));
  } catch {
    return null;
  }
}

function mergeChineseFields(person, existingPeople) {
  const existing =
    existingPeople.find((item) => Number(item.id) === Number(person.id)) || {};
  const curated = CHINESE_FIELDS[person.id] || {};
  const generalInfoZh =
    curated.generalInfoZh ||
    existing.generalInfoZh ||
    "暂无中文翻译，请参阅英文原文。";
  const careerHistoryZh =
    curated.careerHistoryZh ||
    existing.careerHistoryZh ||
    "暂无中文翻译，请参阅英文原文。";

  return {
    ...person,
    nameZh: curated.nameZh || existing.nameZh || person.name,
    positionZh: curated.positionZh || existing.positionZh || person.position,
    workScopeZh:
      curated.workScopeZh ||
      existing.workScopeZh ||
      "官方页面未列出单独工作范围。",
    generalInfoZh,
    careerHistoryZh,
    detailZh: [generalInfoZh, careerHistoryZh].filter(Boolean).join("\n"),
    translationNote: DISCLAIMER,
  };
}

function mapPerson(item) {
  const name = normalizeText(
    [item.lastname, item.name, item.middlename].filter(Boolean).join(" "),
  );
  const position = normalizeText(
    item.position || item.level?.items?.[0]?.position || "",
  );
  const generalInfo = htmlToText(item.biography || "");
  const careerHistory = htmlToText(item.biography_details || "");

  return {
    id: item.id,
    name,
    position,
    order: item.order || "",
    photo: absoluteGovUrl(item.photo),
    phone: normalizeText(item.phone || item.phone_number || ""),
    receptionPhone: normalizeText(
      item.public_reception_phone || item.phone || item.phone_number || "",
    ),
    email: normalizeText(item.email || ""),
    biographyUrl: `https://www.gov.kz/memleket/entities/almaty/about/structure/people/${item.id}?lang=en`,
    generalInfo,
    careerHistory,
    career: [generalInfo, careerHistory].filter(Boolean).join("\n"),
    detail: [generalInfo, careerHistory].filter(Boolean).join("\n"),
    responsibilities: htmlToText(
      item.cur_directions?.items
        ?.map((entry) => entry.title || entry.name)
        .join("\n") || "",
    ),
  };
}

function sortPeople(a, b) {
  const orderA = Number(a.order);
  const orderB = Number(b.order);
  const hasOrderA = Number.isFinite(orderA) && a.order !== "";
  const hasOrderB = Number.isFinite(orderB) && b.order !== "";

  if (hasOrderA && hasOrderB) return orderA - orderB;
  if (hasOrderA) return -1;
  if (hasOrderB) return 1;
  return String(a.name).localeCompare(String(b.name), "en");
}

async function main() {
  const existing = readExistingPayload();
  const existingPeople = existing?.people || [];
  const response = await fetch(API_URL, {
    signal: AbortSignal.timeout(45000),
    headers: {
      accept: "application/json",
      "accept-language": "en",
      "user-agent": "Mozilla/5.0 (compatible; SilkRoadInfoSync/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${API_URL}: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  const people = data
    .map(mapPerson)
    .filter((person) => person.name)
    .map((person) => mergeChineseFields(person, existingPeople))
    .sort(sortPeople);

  const payload = {
    sourceUrl: SOURCE_URL,
    syncedAt: new Date().toISOString(),
    title: "Almaty city administration structure",
    people,
  };

  publishJsonSafely(OUT_PATH, payload, {
    collectionSucceeded: true,
    itemsKey: "people",
    rejectEmpty: true,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
