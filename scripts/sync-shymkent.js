const fs = require("node:fs");
const path = require("node:path");
const { publishJsonSafely } = require("./lib/storage");

const SOURCE_URL =
  "https://www.gov.kz/memleket/entities/shymkent/about/structure?lang=en";
const API_URL =
  "https://www.gov.kz/api/v1/public/content-manager/curators?projects=shymkent&lang=en";
const OUT_PATH = path.join(__dirname, "..", "data", "shymkent-people.json");
const DISCLAIMER = "本页面内容翻译自原网站，中文翻译仅供参考";

const CHINESE_FIELDS = {
  37043: {
    nameZh: "瑟兹德克别科夫·加比特·阿布季马日托维奇",
    positionZh: "奇姆肯特市市长",
    workScopeZh: "负责奇姆肯特市政府全面领导与城市治理统筹工作。",
    generalInfoZh:
      "1980年7月8日出生于奇姆肯特市。2001年毕业于哈萨克国立法律大学，2003年毕业于俄罗斯联邦外交部外交学院。",
    careerHistoryZh:
      "2004-2007年，在哈萨克斯坦共和国外交部工作，历任国家礼宾服务处随员、三等秘书，欧洲和非洲司三等秘书，以及部登记办公室三等、二等秘书。\n2007-2011年，在哈萨克斯坦共和国议会上院办公室工作，历任上院主席秘书处首席专家、首席顾问、议会间关系和国际合作部门处长、副处长，以及与国际关系、国防和安全委员会互动部门负责人。\n2011-2012年，任哈萨克斯坦共和国外交部亚洲和非洲司南亚和中东处处长。\n2012-2017年，任哈萨克斯坦共和国驻法国大使馆参赞，并任哈萨克斯坦共和国外交部行政与控制司顾问。\n2017-2019年，任哈萨克斯坦共和国议会上院主席顾问、与国际关系、国防和安全委员会互动部门负责人、上院主席顾问。\n2019年5月至2019年9月，任哈萨克斯坦共和国外交部特别任务大使。\n2019年9月至2021年7月，任哈萨克斯坦共和国驻塞尔维亚共和国特命全权大使。\n2021年7月至2023年2月，任哈萨克斯坦总理登记办公室第一副主任。\n2023年2月至2023年9月，任哈萨克斯坦共和国政府办公厅第一副主任。\n自2023年9月5日起，任奇姆肯特市市长。",
  },
  7019: {
    nameZh: "伊日莫夫·阿尔马斯·佩尔涅哈诺维奇",
    positionZh: "部门负责人",
    workScopeZh: "负责奇姆肯特市长办公室相关部门管理和人员工作协调。",
    generalInfoZh:
      "2011年毕业于以 K.I. 萨特巴耶夫命名的哈萨克国立技术大学；2015年毕业于奇姆肯特大学。专业包括技术机器与设备、法学。",
    careerHistoryZh:
      "2010年9月18日至2011年3月29日，在阿拉木图 Sapsan Security Firm 有限公司担任安保服务监察员。\n2011年6月8日至2012年6月12日，在阿斯塔纳服哈萨克斯坦共和国武装力量兵役。\n2012年11月1日至2012年12月31日，在南哈萨克斯坦工业创新学院任青年实践教师，地点为南哈萨克斯坦州阿克苏肯特村。\n2013年7月15日至2013年9月30日，在南哈萨克斯坦州青年政策问题局任档案员，地点为奇姆肯特市。\n2013年10月1日至2013年11月25日，任奇姆肯特市阿尔-法拉比区区长办公室社会保护支持处代理首席专家。\n2013年11月25日至2014年9月23日，任奇姆肯特市阿尔-法拉比区区长办公室社会保护支持处首席专家。\n2014年9月23日至2015年2月17日，任奇姆肯特市阿尔-法拉比区区长办公室组织处首席专家。\n2015年2月17日至2015年9月10日，任奇姆肯特市阿尔-法拉比区区长办公室组织与控制处首席专家。\n2015年9月10日至2015年11月24日，任奇姆肯特市阿尔-法拉比区区长办公室企业支持处首席专家。\n2015年11月24日至2016年6月29日，任奇姆肯特市阿尔-法拉比区区长办公室组织与控制处首席专家。\n2016年6月29日至2016年8月11日，任哈萨克斯坦共和国卫生和社会发展部劳动、社会保护和移民委员会南哈萨克斯坦州第3养老金和社会保障处首席专家。\n2016年8月11日至2018年7月24日，任南哈萨克斯坦州奇姆肯特市长办公室人事管理服务处首席监察员。\n2018年7月24日至2018年11月12日，任奇姆肯特市长办公室人事管理服务处首席监察员。\n2018年11月12日至2019年11月18日，任奇姆肯特市长办公室人事管理服务首席监察员。\n自2019年11月18日起，任奇姆肯特市长办公室人事管理服务负责人。",
  },
  7053: {
    nameZh: "努尔马哈诺夫·艾别克·扎克普吾勒",
    positionZh: "部门负责人",
    workScopeZh: "负责区域政策、预测与规划相关工作。",
    generalInfoZh:
      "2010年毕业于以 M. 阿乌埃佐夫命名的南哈萨克斯坦国立大学，获学士学位。2013年毕业于 MSTU，获公共和地方行政、经济学硕士学位。",
    careerHistoryZh:
      "2011年2月2日至2011年11月4日，在南哈萨克斯坦州州长办公室从事统计工作，地点为奇姆肯特。\n2011年11月4日至2013年9月27日，任奇姆肯特市长办公室指导员。\n2013年9月27日至2013年11月13日，任奇姆肯特市经济和财政局经济部门融资科代理首席专家。\n2013年11月13日至2016年5月18日，任奇姆肯特市经济和财政局经济部门融资科首席专家。\n2016年5月18日至2017年5月2日，任奇姆肯特市长办公室动员和国家秘密保护处首席专家。\n2017年5月2日至2018年7月24日，任奇姆肯特市长办公室组织检查处首席监察员。\n2018年7月24日至2019年4月5日，任奇姆肯特市长办公室社会经济监测处首席监察员。\n2019年4月5日至2020年2月21日，任奇姆肯特市长办公室区域政策、预测与规划处首席监察员。\n自2020年2月21日起，任奇姆肯特市长办公室区域政策、预测与规划处负责人。",
  },
  7048: {
    nameZh: "比代别科夫·帖木儿·凯纳尔别克吾勒",
    positionZh: "部门负责人",
    workScopeZh: "负责动员、军事安全和国防事务相关工作。",
    generalInfoZh:
      "1994年毕业于哈萨克化学技术学院；2003年毕业于南哈萨克斯坦开放大学。专业为工程技术工艺和法学。",
    careerHistoryZh:
      "1989年9月1日至1994年6月1日，在哈萨克化学技术学院学习，地点为奇姆肯特。\n1994年8月1日至1997年2月11日，在奇姆肯特 Orgproektcement 股份公司任工艺工程师。\n1997年2月17日起，按合同服兵役。\n1997年2月17日至1997年9月3日，任阿克莫拉州阿尔沙雷区维亚切斯拉夫卡村第73805部队烟幕排排长。\n1997年9月3日至2000年3月9日，任阿克莫拉州阿尔沙雷区维亚切斯拉夫卡村第73805部队训练排排长。\n2001年2月1日至2003年1月31日，任南哈萨克斯坦州图尔库巴斯区军事委员部第3处处长。\n2003年1月31日至2005年2月12日，任南哈萨克斯坦州肯套市军事委员部副军事委员兼第1处处长。\n2005年2月12日至2005年12月24日，任南哈萨克斯坦州肯套市军事委员。\n2005年12月24日至2019年5月20日，在南哈萨克斯坦州国防部门多个岗位任职。\n自2019年5月20日起，任奇姆肯特市长军事安全和国防事务助理、动员处负责人。",
  },
  25189: {
    nameZh: "哈尔穆尔扎耶夫·巴克别尔迪·阿姆泽耶维奇",
    positionZh: "部门负责人",
    workScopeZh: "负责组织检查、区域发展和社会政治领域监测相关工作。",
    generalInfoZh:
      "毕业院校和年份：2008年毕业于 M. 阿乌埃佐夫南哈萨克斯坦国立大学；2011年毕业于学术创新大学；2017年毕业于哈萨克斯坦人民友谊工程教育大学。专业为国际关系、历史、法学。",
    careerHistoryZh:
      "2007年9月17日至2009年2月9日，任 Kasiet 有限责任公司专家，地点为奇姆肯特市。\n2014年8月1日至2015年1月26日，任南哈萨克斯坦州内政政策局操作员，地点为奇姆肯特。\n2015年1月26日至2015年5月8日，任南哈萨克斯坦州内政政策和宗教事务局操作员，地点为奇姆肯特。\n2015年7月16日至2015年9月29日，在特别审查期间任南哈萨克斯坦州内政政策和宗教事务局社会政治形势分析与预测处代理首席专家。\n2015年9月29日至2016年3月1日，任南哈萨克斯坦州内政政策和宗教事务局社会政治形势与预测处首席专家。\n2016年3月2日至2019年3月17日，任南哈萨克斯坦州内政政策局社会政治形势与预测处首席专家。\n2019年3月18日至2019年8月15日，任南哈萨克斯坦州内政政策局社会政治形势与预测处负责人。\n2019年8月16日至2020年5月11日，任突厥斯坦州公共发展局分析与预测处负责人。\n2020年5月12日至2021年2月25日，任奇姆肯特市长办公室组织与控制工作处首席监察员。\n2021年3月1日至2021年11月7日，任奇姆肯特市长办公室社会政治和社会领域监测处负责人。\n自2021年11月8日起，任奇姆肯特市长办公室组织检查与区域发展处负责人。",
  },
  7035: {
    nameZh: "巴赫特巴耶娃·别盖伊姆·伊捷诺夫娜",
    positionZh: "部门负责人",
    workScopeZh: "负责公民申请办理、来信来访监督和相关行政协调工作。",
    generalInfoZh:
      "1975年4月27日出生于南哈萨克斯坦州连格尔市。2000年毕业于南哈萨克斯坦地区人文学院。",
    careerHistoryZh:
      "2006年，毕业于哈萨克消费者合作社卡拉干达经济大学。\n1997年12月3日至1998年3月30日，任内务部学校奇姆肯特法律学院会计。\n1999年5月26日至2000年2月8日，任 IC-16711 机构特别部门登记技术员，地点为奇姆肯特市。\n2000年2月8日至2005年12月21日，任南哈萨克斯坦州内务局工作人员，地点为奇姆肯特市。\n2006年1月13日至2007年2月28日，任 Kaspi Bank 股份公司经济安全分行首席专家、经济安全处负责人和专家，地点为奇姆肯特市。\n2008年10月20日至2012年4月24日，任奇姆肯特市土地关系处个人住房建设科操作员、指导员。\n2012年4月23日至2012年6月22日，任奇姆肯特市土地关系处生产科代理首席专家。\n2012年6月22日至2013年3月1日，任奇姆肯特市土地关系处生产科首席专家。\n2013年3月1日至2015年7月1日，任奇姆肯特市土地关系处个人住房建设科首席专家。\n2015年8月11日至2018年2月2日，在努尔苏丹 Abu-Dhabi Plaza 项目的 World Monitoring 有限责任公司任安全设备监察员。\n2018年2月19日至2018年6月1日，在努尔苏丹 Abu-Dhabi Plaza 项目的 NikaStroyServis 有限责任公司任消防安全监察员。\n2021年12月7日至2022年4月18日，任奇姆肯特市建筑、城市规划和土地关系局建筑、城市规划和土地关系领域监测处方法专家。\n2022年6月29日至2022年7月21日，任奇姆肯特市建筑、城市规划和土地关系局建筑、城市规划和土地关系领域监测处首席专家。\n2022年7月22日至2023年11月30日，任奇姆肯特市长办公室公民申请办理处负责人、负责审查公民申请的市长顾问。\n自2023年12月1日起，任奇姆肯特市长办公室申请办理监督处负责审查公民申请的市长顾问兼部门负责人。",
  },
  7043: {
    nameZh: "萨金迪科娃·绍列·图拉利耶夫娜",
    positionZh: "部门负责人",
    workScopeZh: "负责国家秘密保护和相关保密管理工作。",
    generalInfoZh: "2004年毕业于阿拉木图经济大学。专业为经济师-金融家。",
    careerHistoryZh:
      "1990年4月7日至1990年5月22日，任 Telman 城市消费合作社商贸人员，地点为奇姆肯特市。\n1990年9月26日至1993年8月8日，任 Prodtovary 协会、Babur 消费合作社商贸人员，地点为奇姆肯特市。\n1994年1月12日至1995年12月28日，任 Shok-Nur 私营公司会计、总会计师，地点为奇姆肯特市。\n1996年1月2日至1996年7月24日，任南哈萨克斯坦州土地关系和土地管理委员会会计兼出纳，地点为奇姆肯特市。\n1996年7月29日至1997年4月15日，任以 H.A. 亚萨维命名的国际哈萨克-土耳其大学会计，地点为奇姆肯特市。\n1999年7月15日至1999年12月1日，任南哈萨克斯坦州州长办公室经济局接待处秘书，地点为奇姆肯特市。\n1999年12月1日至2007年10月1日，任南哈萨克斯坦州州长办公室接待处秘书，地点为奇姆肯特市。\n2007年10月1日至2007年11月20日，任南哈萨克斯坦州州长办公室文书保障处代理专家。\n2007年11月20日至2008年1月23日，任南哈萨克斯坦州州长办公室文书保障处专家。\n2008年1月23日至2009年2月19日，任南哈萨克斯坦州州长办公室文书保障处主任专家。\n2009年2月19日至2016年2月16日，任南哈萨克斯坦州州长办公室文书保障处首席专家。\n2016年2月16日至2018年7月17日，任南哈萨克斯坦州州长办公室国家秘密保护组首席监察员兼组长。\n2018年7月24日至2018年8月16日，任突厥斯坦州州长办公室国家秘密保护组首席监察员兼组长。\n自2018年8月16日起，任奇姆肯特市长办公室国家秘密保护处负责人。",
  },
  36671: {
    nameZh: "季列乌夫·萨亚特·若尔巴雷索维奇",
    positionZh: "经济领域监测部门负责人",
    workScopeZh: "负责经济领域监测、组织检查和相关协调工作。",
    generalInfoZh:
      "1981年1月13日出生于南哈萨克斯坦州马克塔阿拉尔区。2002年毕业于哈萨克人文法律大学，专业为法学。",
    careerHistoryZh:
      "2003年4月19日至2003年7月7日，任马克塔阿拉尔区区长办公室内政政策和青年事务处代理主任专家。\n2003年7月7日至2003年7月19日，任马克塔阿拉尔区区长办公室内政政策和青年事务处主任专家。\n2003年7月21日至2005年3月1日，任马克塔阿拉尔区区长办公室主任专家兼律师。\n2005年3月1日至2007年2月26日，任马克塔阿拉尔区区长办公室法律处首席专家。\n2007年2月26日至2008年1月17日，任哈萨克斯坦共和国公务员事务署公务员领域合法性监督处首席专家，地点为阿斯塔纳。\n2008年1月17日至2010年12月8日，任哈萨克斯坦共和国公务员事务署公务员人事保障处顾问，地点为阿斯塔纳。\n2010年12月8日至2011年3月1日，任哈萨克斯坦共和国环境保护部环境调节和控制委员会叶西尔生态司环境调节处代理首席专家，地点为阿斯塔纳。\n2011年3月1日至2011年9月1日，任该处首席专家。\n2011年9月1日至2013年6月11日，任阿斯塔纳市检查委员会组织法律工作处处长。\n2013年6月11日至2016年3月16日，任阿斯塔纳市检查委员会人事管理服务处处长。\n2016年3月16日至2016年7月25日，任阿斯塔纳市检查委员会人事管理服务负责人兼首席监察员。\n2016年8月8日至2018年7月17日，任南哈萨克斯坦州州长办公室人事管理服务首席监察员。\n2018年7月17日至2019年12月27日，任突厥斯坦州州长办公室人事管理服务首席监察员。\n2019年12月27日至2021年12月26日，任突厥斯坦州州长办公室创业发展监测处负责人。\n2022年3月9日至2023年7月10日，任奇姆肯特市长办公室组织检查和区域发展处代理首席专家。\n自2023年7月11日起，任奇姆肯特市长办公室经济领域监测处负责人。",
  },
  40186: {
    nameZh: "库斯别科夫·迪亚斯·穆赫塔罗维奇",
    positionZh: "检查工作处负责人",
    workScopeZh: "负责检查工作、任务执行监督和相关行政协调工作。",
    generalInfoZh:
      "1986年10月22日出生于阿拉木图市。2009年毕业于哈萨克斯坦工程技术大学，专业为计算机设备和软件。2013年毕业于图兰大学，专业为法学。",
    careerHistoryZh:
      "2007年10月1日至2012年12月31日，任阿拉木图市信息系统中心市政国有企业调度员，地点为阿拉木图市。\n2016年6月14日至2016年9月2日，任阿拉木图市博斯坦德克区区长办公室美化处代理首席专家。\n2016年9月2日至2018年3月29日，任阿拉木图市博斯坦德克区区长办公室美化处首席专家。\n2018年3月29日至2018年10月17日，任阿拉木图市博斯坦德克区区长助理。\n2018年10月18日至2021年4月14日，任阿拉木图市阿尔马雷区区长助理。\n2021年4月15日至2021年6月6日，任阿拉木图市阿尔马雷区区长办公室社会领域处首席专家。\n2021年6月7日至2022年1月4日，任阿拉木图市阿尔马雷区区长助理。\n2022年1月5日至2023年10月16日，任阿拉木图市阿尔马雷区区长办公室文化和语言发展处负责人。\n2023年11月9日至2023年12月1日，任奇姆肯特市长办公室申请办理处首席专家。\n自2023年12月1日起，任奇姆肯特市长办公室检查工作处负责人。",
  },
  25194: {
    nameZh: "阿尔捷耶夫·努尔兰·包尔詹诺维奇",
    positionZh: "统一人事管理服务负责人",
    workScopeZh: "负责统一人事管理服务、公务员事务和人事制度协调工作。",
    generalInfoZh:
      "毕业院校和年份：2014年毕业于以阿里-法拉比命名的哈萨克国立大学；2016年毕业于阿拉木图经济与统计学院；2016年毕业于哈萨克斯坦人民友谊工程教育大学。专业为国家和地方管理、经济与商业、法学。",
    careerHistoryZh:
      "2014年7月28日至2014年12月2日，任哈萨克斯坦共和国公务员事务署仓库负责人，地点为阿斯塔纳。\n2014年12月2日至2015年4月17日，任哈萨克斯坦共和国公务员事务和反腐败署监察员，地点为阿斯塔纳。\n2015年9月2日至2015年12月2日，任 Eco Lampa Astana 有限责任公司律师，地点为阿斯塔纳。\n2016年4月12日至2016年6月26日，任哈萨克斯坦共和国公务员事务署南哈萨克斯坦州分署代理主任专家，地点为奇姆肯特。\n2016年6月27日至2016年10月23日，任哈萨克斯坦共和国公务员事务署南哈萨克斯坦州分署公务员处主任专家。\n2016年10月24日至2018年1月2日，任哈萨克斯坦共和国公务员事务和反腐败署南哈萨克斯坦州分署公务员处主任专家。\n2018年1月3日至2018年8月16日，任哈萨克斯坦共和国公务员事务和反腐败署南哈萨克斯坦州分署公务员处首席专家。\n2018年8月17日至2019年8月8日，任哈萨克斯坦共和国公务员事务和反腐败署奇姆肯特市分署公务员处首席专家。\n2019年8月9日至2020年1月29日，任哈萨克斯坦共和国公务员事务署奇姆肯特市分署公务员处首席专家。\n2020年1月30日至2021年9月29日，任哈萨克斯坦共和国公务员事务署奇姆肯特市分署公务员处负责人。\n2021年10月1日至2021年11月7日，任奇姆肯特市长办公室人事管理服务负责人。\n自2021年11月8日起，任奇姆肯特市长办公室统一人事管理服务负责人。",
  },
};

function normalizeText(value = "") {
  return String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function repairMojibake(value = "") {
  const text = String(value || "");
  if (!/[ÐÑÒÓØ]/.test(text)) return text;
  return Buffer.from(text, "latin1").toString("utf8");
}

function htmlToText(value = "") {
  return repairMojibake(String(value))
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
    "暂无中文翻译，请参阅原文。";
  const careerHistoryZh =
    curated.careerHistoryZh ||
    existing.careerHistoryZh ||
    "暂无中文翻译，请参阅原文。";

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
    repairMojibake(item.position || item.level?.items?.[0]?.position || ""),
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
    biographyUrl: `https://www.gov.kz/memleket/entities/shymkent/about/structure/people/${item.id}?lang=en`,
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
  if (Number(a.id) === 37043) return -1;
  if (Number(b.id) === 37043) return 1;
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
    title: "Shymkent city administration structure",
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
