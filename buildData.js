import fs from 'fs';

const URL_RESOURCES = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/Resources.json';
const URL_I18N = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/i18n.json';

async function build() {
  console.log('🚀 開始從 WFCD 獲取最新資料...');
  
  // 透過原生 fetch 抓取遠端資料
  const [resReq, i18nReq] = await Promise.all([
    fetch(URL_RESOURCES),
    fetch(URL_I18N)
  ]);

  const resources = await resReq.json();
  const i18n = await i18nReq.json();

  // 準備我們的主索引
  const planetIndex = {};

  // 幫助我們把素材加入索引的小工具
  const addDrop = (planetName, itemName) => {
    if (!planetName) return;
    if (!planetIndex[planetName]) {
      planetIndex[planetName] = [];
    }
    if (!planetIndex[planetName].includes(itemName)) {
      planetIndex[planetName].push(itemName);
    }
  };

  // 建立 i18n 快速查詢表
  const i18nMap = {};
  for (const key in i18n) {
    if (i18n[key].en && i18n[key].en.name) {
      i18nMap[i18n[key].en.name.toLowerCase()] = i18n[key];
    }
  }

  console.log('🔍 開始建立 Planet -> Drop 索引...');
  
  // 1. 自動掃描所有資源
  resources.forEach(item => {
    let match = i18n[item.uniqueName] || (item.name && i18nMap[item.name.toLowerCase()]);
    let tcName = match?.tc?.name || match?.['zh-hant']?.name || item.name;
    let tcDesc = match?.tc?.description || match?.['zh-hant']?.description || item.description || "";

    const locRegex = /(?:地點|Location)\s*[:：]\s*(.+)/i;
    const locMatch = tcDesc.match(locRegex);

    if (locMatch) {
      const locString = locMatch[1];
      const planets = locString.split(/[、,，]/).map(p => p.trim());
      planets.forEach(p => {
        addDrop(p, tcName);
      });
    }
  });

  // 2. 🤖 人工補丁區 (解決官方資料庫描述殘缺的問題)
  // 如果未來官方出了新特產但沒寫在描述裡，直接加在這裡就好
  const patches = {
    "木星": ["六醇玻理", "神經傳感器"],
    "Jupiter": ["六醇玻理", "神經傳感器"],
    "天王星": ["碲"],
    "Uranus": ["碲"]
  };

  for (const [planet, items] of Object.entries(patches)) {
    items.forEach(item => addDrop(planet, item));
  }

  // 3. 匯出最終的 JSON 檔案
  const finalData = {
    planetIndex: planetIndex,
    lastUpdated: new Date().toISOString()
  };

  // 將結果寫入 data_index.json
  fs.writeFileSync('./data_index.json', JSON.stringify(finalData, null, 2));
  console.log('✅ 成功建立 data_index.json！資料已準備就緒。');
}

build();