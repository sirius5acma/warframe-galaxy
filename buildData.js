import fs from 'fs';

const URL_RESOURCES = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/Resources.json';
const URL_I18N = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/i18n.json';

// 🌟 1. 新增：九重天 (銳捷號) 專屬白名單 (優先比對)
const PROXIMA_KEYWORDS = {
  "Earth Proxima": ["毗鄰星（地球", "地球毗鄰星", "Earth Proxima"],
  "Venus Proxima": ["毗鄰星（金星", "金星毗鄰星", "Venus Proxima"],
  "Saturn Proxima": ["毗鄰星（土星", "土星毗鄰星", "Saturn Proxima"],
  "Neptune Proxima": ["毗鄰星（海王星", "海王星毗鄰星", "Neptune Proxima"],
  "Pluto Proxima": ["毗鄰星（冥王星", "冥王星毗鄰星", "Pluto Proxima"],
  "Veil Proxima": ["毗鄰星（面紗", "面紗毗鄰星", "Veil Proxima", "面紗"]
};

// 🌟 2. 一般星球白名單
const PLANET_KEYWORDS = {
  "Earth": ["地球", "Earth"],
  "Venus": ["金星", "Venus"],
  "Mercury": ["水星", "Mercury"],
  "Mars": ["火星", "Mars"],
  "Phobos": ["火衛一", "Phobos"],
  "Ceres": ["穀神星", "Ceres"],
  "Jupiter": ["木星", "Jupiter"],
  "Europa": ["歐羅巴", "Europa"],
  "Saturn": ["土星", "Saturn"],
  "Uranus": ["天王星", "Uranus"],
  "Neptune": ["海王星", "Neptune"],
  "Pluto": ["冥王星", "Pluto"],
  "Sedna": ["賽德娜", "Sedna"],
  "Eris": ["鬩神星", "Eris"],
  "Void": ["虛空", "Void"],
  "Kuva Fortress": ["赤毒要塞", "Kuva Fortress"],
  "Lua": ["月球", "Lua"],
  "Deimos": ["火衛二", "魔裔禁地", "Deimos"], 
  "Zariman": ["扎日曼", "Zariman"],
  "Duviri": ["渡域", "Duviri"]
};

async function build() {
  console.log('🚀 開始從 WFCD 獲取最新資料...');
  
  const [resReq, i18nReq] = await Promise.all([
    fetch(URL_RESOURCES),
    fetch(URL_I18N)
  ]);

  const resources = await resReq.json();
  const i18n = await i18nReq.json();
  const planetIndex = {};

  const addDrop = (planetKey, itemName) => {
    if (!planetIndex[planetKey]) {
      planetIndex[planetKey] = [];
    }
    if (!planetIndex[planetKey].includes(itemName)) {
      planetIndex[planetKey].push(itemName);
    }
  };

  const i18nMap = {};
  for (const key in i18n) {
    if (i18n[key].en && i18n[key].en.name) {
      i18nMap[i18n[key].en.name.toLowerCase()] = i18n[key];
    }
  }

  console.log('🔍 開始建立 Planet -> Drop 索引...');
  
  resources.forEach(item => {
    let match = i18n[item.uniqueName] || (item.name && i18nMap[item.name.toLowerCase()]);
    let tcName = match?.tc?.name || match?.['zh-hant']?.name || item.name;
    let tcDesc = match?.tc?.description || match?.['zh-hant']?.description || item.description || "";

    const locRegex = /(?:地點|Location)\s*[:：]\s*(.+)/i;
    const locMatch = tcDesc.match(locRegex);

    if (locMatch) {
      // 這是我們抓到的原始句子
      let locString = locMatch[1]; 

      // 🌟 第一階段：優先攔截九重天資源
      for (const [proximaKey, keywords] of Object.entries(PROXIMA_KEYWORDS)) {
        for (const kw of keywords) {
          if (locString.includes(kw)) {
            addDrop(proximaKey, tcName); // 歸類到 Proxima
            // 【核心防呆】過河拆橋：把「毗鄰星（地球」從句子中徹底刪除
            locString = locString.split(kw).join(''); 
          }
        }
      }

      // 🌟 第二階段：安全核對一般星球
      for (const [planetKey, keywords] of Object.entries(PLANET_KEYWORDS)) {
        if (keywords.some(kw => locString.includes(kw))) {
           addDrop(planetKey, tcName);
        }
      }
    }
  });

  // 3. 🤖 人工補丁區 
  const patches = {
    "Jupiter": ["六醇玻理", "神經傳感器"],
    "Uranus": ["碲"]
  };

  for (const [planetKey, items] of Object.entries(patches)) {
    items.forEach(item => addDrop(planetKey, item));
  }

  const finalData = {
    planetIndex: planetIndex,
    lastUpdated: new Date().toISOString()
  };

  fs.writeFileSync('./data_index.json', JSON.stringify(finalData, null, 2));
  console.log('✅ 成功建立 data_index.json！');
}

build();