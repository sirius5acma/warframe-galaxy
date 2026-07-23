import fs from 'fs';
import crypto from 'crypto';

// 🌟 核心資料庫
const URL_SOL_NODES = 'https://raw.githubusercontent.com/wfcd/warframe-worldstate-data/master/data/solNodes.json'; // 降級為輔助 (補派系用)
const URL_DROPS = 'https://raw.githubusercontent.com/wfcd/warframe-drop-data/master/data/all.json';
const URL_I18N = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/i18n.json';
const URL_REGIONS = 'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/master/ExportRegions.json';
const URL_DICT_TC = 'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/master/dict.tc.json';
const URL_DICT_EN = 'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/master/dict.en.json';
const URL_ITEMS_RELICS = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/Relics.json';

// 🗑️ 垃圾過濾名單
const JUNK_FILTER = [
  "Endo", "Credits", "Void Traces", "Rubedo", "Ferrite", "Alloy Plate", 
  "Nano Spores", "Plastids", "Polymer Bundle", "Salvage", "Credit Cache",
  "Detonite Ampule", "Fieldron Sample", "Mutagen Sample", "Circuits", "Control Module"
];

const PLANET_DROPS = {
  "Earth": ["鐵氧體", "紅化結晶", "神經元", "爆燃安瓿"],
  "Venus": ["合金板", "聚合物束", "電路", "電磁力場裝置樣本"],
  "Mercury": ["非晶態合金", "鐵氧體", "聚合物束", "爆燃安瓿"],
  "Mars": ["鎵", "非晶態合金", "回收金屬", "電磁力場裝置樣本"],
  "Phobos": ["紅化結晶", "非晶態合金", "生物質", "合金板"],
  "Ceres": ["合金板", "電路", "Orokin電池", "爆燃安瓿"],
  "Jupiter": ["回收金屬", "神經傳感器", "合金板", "六醇燃劑"],
  "Europa": ["非晶態合金", "紅化結晶", "控制模塊", "電磁力場裝置樣本"],
  "Saturn": ["奈米孢子", "生物質", "Orokin電池", "爆燃安瓿"],
  "Uranus": ["聚合物束", "生物質", "鎵", "爆燃安瓿"],
  "Neptune": ["奈米孢子", "鐵氧體", "控制模塊", "電磁力場裝置樣本"],
  "Pluto": ["紅化結晶", "非晶態合金", "生物質", "合金板", "電磁力場裝置樣本"],
  "Sedna": ["紅化結晶", "合金板", "回收金屬", "爆燃安瓿"],
  "Eris": ["奈米孢子", "生物質", "神經元", "突變原樣本"],
  "Void": ["氬結晶", "控制模塊", "紅化結晶", "鐵氧體"],
  "Kuva Fortress": ["回收金屬", "電路", "神經傳感器", "碲", "爆燃安瓿"],
  "Lua": ["鐵氧體", "紅化結晶", "神經元", "爆燃安瓿"],
  "Deimos": ["奈米孢子", "突變原樣本", "神經元", "Orokin電池"],
  "Zariman": ["虛空膠球", "源拓氏燈籠", "合金板", "鐵氧體"],
  "Duviri": ["哀悲標置", "龍焏", "肉葉結節", "密聲冷石"], 
  "Earth Proxima": ["鈦金屬", "鈦核船板", "碳化物", "立方二極體", "星彩藍寶石", "加落斯反物質燃料棒", "愛索斯修複液", "奧核電容", "Komms", "虛能石", "碲"],
  "Venus Proxima": ["鈦金屬", "鈦核船板", "碳化物", "立方二極體", "星彩藍寶石", "加落斯反物質燃料棒", "愛索斯修複液", "奧核電容", "Komms", "虛能石", "碲"],
  "Saturn Proxima": ["鈦金屬", "鈦核船板", "碳化物", "立方二極體", "星彩藍寶石", "加落斯反物質燃料棒", "愛索斯修複液", "奧核電容", "Komms", "虛能石", "碲"],
  "Neptune Proxima": ["鈦金屬", "鈦核船板", "碳化物", "立方二極體", "星彩藍寶石", "加落斯反物質燃料棒", "愛索斯修複液", "奧核電容", "Komms", "虛能石", "碲"],
  "Pluto Proxima": ["鈦金屬", "鈦核船板", "碳化物", "立方二極體", "星彩藍寶石", "加落斯反物質燃料棒", "愛索斯修複液", "奧核電容", "Komms", "虛能石", "碲"],
  "Veil Proxima": ["鈦金屬", "鈦核船板", "碳化物", "立方二極體", "星彩藍寶石", "加落斯反物質燃料棒", "愛索斯修複液", "奧核電容", "Komms", "虛能石", "碲"]
};

async function fetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return { text: '{}', data: {} };
    const text = await res.text();
    return { text, data: JSON.parse(text) };
  } catch (error) {
    return { text: '{}', data: {} };
  }
}

async function build() {
  console.log('🚀 [1/5] 啟動 2.0 系統：從底層解包資料庫提取世界藍圖...');
  
  const [solNodesRes, dropsRes, i18nRes, regionsRes, tcRes, enRes, itemsRelicsRes] = await Promise.all([
    fetchJson(URL_SOL_NODES),
    fetchJson(URL_DROPS),
    fetchJson(URL_I18N),
    fetchJson(URL_REGIONS),
    fetchJson(URL_DICT_TC), 
    fetchJson(URL_DICT_EN), 
    fetchJson(URL_ITEMS_RELICS)
  ]);

  console.log('🛡️ [2/5] 執行指紋比對...');
  const hash = crypto.createHash('md5');
  hash.update(regionsRes.text); 
  hash.update(dropsRes.text);
  const currentHash = hash.digest('hex');

  if (fs.existsSync('last_hash.txt') && currentHash === fs.readFileSync('last_hash.txt', 'utf8')) {
    console.log('✅ 資料無變動，提早下班！');
    return;
  }

  const solNodes = solNodesRes.data || {};
  const drops = dropsRes.data || {};
  const tcData = tcRes.data || {};
  const enData = enRes.data || {};
  const itemsRelicsData = itemsRelicsRes.data || [];

  // 🌟 預先宣告所有圖鑑變數
  const nodeIndex = {};
  const planetIndex = {};
  const itemIndex = {};
  const relicIndex = {};

// ==========================================
  // 🌟 翻譯橋樑核心：建立反向英文字典 (英文名稱 ➡️ 底層 ID)
  // ==========================================
  const enNameToIdMap = {};
  Object.entries(enData).forEach(([id, enString]) => {
    // 為了確保比對精準度，將英文轉全小寫並去掉前後空白當作 Key
    const safeKey = enString.trim().toLowerCase();
    
    // 解決 WFCD 掉落表有時會把 Blueprint 縮寫或加上的問題
    enNameToIdMap[safeKey] = id;
    
    // 額外防護：有些官方英文有包含 " Blueprint"，有些沒有，建立雙重對照
    if (!safeKey.endsWith(' blueprint')) {
      enNameToIdMap[`${safeKey} blueprint`] = id; // WFCD 掉落表很愛自己加上 Blueprint
    }
  });

  // 🛠️ 小工具 1：星圖專用翻譯器 (給 ExportRegions 用的，直接吃 ID)
  const getLang = (key, langData) => {
    if (!key) return null;
    return langData[key] || langData[key.toLowerCase()] || null;
  };
  
  // 🛠️ 小工具 2：物品專用翻譯器 (純 ID 驅動！)
  const translateItem = (itemNameEn) => {
    if (!itemNameEn) return itemNameEn;
    
    const searchKey = itemNameEn.trim().toLowerCase();
    
    // 1. 拿著英文去反向字典找「底層 ID」
    const targetId = enNameToIdMap[searchKey];

    // 2. 如果找到 ID，而且繁中字典裡也有這個 ID，就直接拿中文出來用！
    if (targetId && tcData[targetId]) {
      // 官方的繁中翻譯如果沒有加上藍圖，我們可以視情況補上
      let finalTc = tcData[targetId];
      if (searchKey.includes('blueprint') && !finalTc.includes('藍圖')) {
        finalTc += ' 藍圖';
      }
      return finalTc;
    }

    // 3. 萬一真的找不到 (極少數例外或活動物品)，才退回原本的英文
    return itemNameEn;
  };

  // 🛠️ 小工具 3：從輔助資料庫(solNodes)建立派系對照表
  const factionMap = {};
  Object.values(solNodes).forEach(node => {
    if (node.value && node.enemy) {
      // 提取 "(Earth) Coba" 裡面的 "Coba" 轉小寫來當 Key
      const match = node.value.match(/^(.*?)\s*\(/);
      const n = match ? match[1].trim().toLowerCase() : node.value.toLowerCase();
      factionMap[n] = node.enemy;
    }
  });


  console.log('⚙️ [3/5] 正在以 ExportRegions 為核心，精準重建星圖與 ID 矩陣...');
  
  // 🛡️ 彈性讀取：不管外面有沒有包著 ExportRegions 標籤都能抓到
  let regionsObj = regionsRes.data.ExportRegions || regionsRes.data;
  
  // 🛡️ 終極防呆：如果抓回來的資料是空的，印出明確錯誤並提早下班，絕不當機！
  if (!regionsObj || Object.keys(regionsObj).length === 0) {
    console.error("❌ 嚴重錯誤：星圖資料庫抓取失敗！可能是網址失效或網路問題，請檢查 URL_REGIONS。");
    return;
  }

  // 🛡️ 版本相容：萬一哪天官方把物件改成了陣列 (Array)，自動幫它轉回用 ID 當 Key 的物件
  if (Array.isArray(regionsObj)) {
    const tempObj = {};
    regionsObj.forEach(region => {
      const id = region.uniqueName || region.name || "UnknownNode";
      tempObj[id] = region;
    });
    regionsObj = tempObj;
  }
  
  // 🌟 合併迴圈：一次搞定 ID 主鍵建置、過濾、翻譯與歸類
  Object.entries(regionsObj).forEach(([internalId, region]) => {
    if (region.hidden === true) return;
    if (!region.name || !region.systemName || !region.missionName) return;

    let enNodeName = getLang(region.name, enData) || region.name;
    let tcNodeName = getLang(region.name, tcData) || enNodeName;
    
    let enPlanetName = getLang(region.systemName, enData) || region.systemName;
    let tcPlanetName = getLang(region.systemName, tcData) || enPlanetName;
    
    let enMissionType = getLang(region.missionName, enData) || region.missionName;
    let tcMissionType = getLang(region.missionName, tcData) || enMissionType;

    if (enPlanetName === "Veil") {
      enPlanetName = "Veil Proxima";
      tcPlanetName = "面紗毗鄰星";
    }

    const faction = factionMap[enNodeName.toLowerCase()] || "未知";

    const minLvl = region.minEnemyLevel || 0;
    const maxLvl = region.maxEnemyLevel || 0;
    const isPeaceful = (minLvl === 0 && maxLvl === 0);

    const isArchwing = [region.name, region.tileset, region.levelOverride]
      .some(attr => attr && (attr.includes('Archwing') || attr.includes('SpaceBattles')));

    let finalTypeTc = tcMissionType || enMissionType;
    if (isPeaceful) {
      finalTypeTc = "中繼站 / 城鎮";
    } else if (isArchwing) {
      finalTypeTc = `${finalTypeTc} (Archwing)`; 
    }

    const nodeData = {
      id: internalId, // 🌟 核心 ID 綁定
      nameEn: enNodeName,
      nameTc: tcNodeName,
      type: enMissionType,
      typeTc: finalTypeTc,
      faction: faction,
      levels: {
        normal: isPeaceful ? "和平區域" : `${minLvl} - ${maxLvl}`,
        steelPath: isPeaceful ? "和平區域" : `${minLvl + 100} - ${maxLvl + 100}`
      },
      planetEn: enPlanetName, 
      planetTc: tcPlanetName, 
      drops: null // 先預留空位
    };

    nodeIndex[internalId] = nodeData;

    // 歸類到星球索引
    if (!planetIndex[enPlanetName]) {
      planetIndex[enPlanetName] = {
        nameEn: enPlanetName,
        nameTc: tcPlanetName,
        drops: PLANET_DROPS[enPlanetName] || [],
        nodes: []
      };
    }
    planetIndex[enPlanetName].nodes.push(nodeData);
  });

  // 🌟 建立尋找橋樑，塞入掉落表
  const nameToIdMap = {};
  Object.keys(nodeIndex).forEach(id => {
    const node = nodeIndex[id];
    const baseName = `${node.planetEn}/${node.nameEn}`.toLowerCase();
    nameToIdMap[baseName] = id;
  });

  if (drops.missionRewards) {
    for (const rawMissionName in drops.missionRewards) {
      const rewardData = drops.missionRewards[rawMissionName];
      const cleanMissionName = rawMissionName.replace(/\s*\(.*?\)\s*/g, '').toLowerCase().trim();
      const targetId = nameToIdMap[cleanMissionName];

      if (targetId && nodeIndex[targetId]) {
        nodeIndex[targetId].drops = rewardData; 
      }
    }
  }

  console.log('⚙️ [4/5] 重建掉落物與遺物索引...');
  const addItemSource = (itemNameEn, sourceObj) => {
    if (JUNK_FILTER.some(junk => itemNameEn.includes(junk))) return;
    const itemNameTc = translateItem(itemNameEn);
    if (!itemIndex[itemNameTc]) itemIndex[itemNameTc] = [];
    itemIndex[itemNameTc].push(sourceObj);
  };

  Object.values(nodeIndex).forEach(node => {
    if (!node.drops || !node.drops.rewards) return;
    const r = node.drops.rewards;
    if (r.A || r.B || r.C) {
      ['A', 'B', 'C'].forEach(rot => {
        if (r[rot]) r[rot].forEach(drop => addItemSource(drop.itemName, { type: 'Mission', nodeId: node.id, rotation: rot, chance: drop.chance }));
      });
    } else if (Array.isArray(r)) {
      r.forEach(drop => addItemSource(drop.itemName, { type: 'Mission', nodeId: node.id, chance: drop.chance }));
    }
  });

  if (drops.relics) {
    const vaultedMap = {};
    itemsRelicsData.forEach(item => {
      const match = item.name.match(/(Lith|Meso|Neo|Axi|Requiem)\s+([^\s]+)/i);
      if (match) {
        const relicFullName = `${match[1]} ${match[2]}`;
        vaultedMap[relicFullName] = item.vaulted ? '入庫' : '可掉落'; 
      }
    });

    const eraTcMap = { 
      'Lith': '古紀', 
      'Meso': '前紀', 
      'Neo': '中紀', 
      'Axi': '後紀', 
      'Requiem': '鎮魂' 
    };

    drops.relics.forEach(relic => {
      const tier = relic.tier;
      const name = relic.relicName;
      if (!name) return; 

      const relicFullName = `${tier} ${name}`;

      relic.rewards.forEach(drop => {
        addItemSource(drop.itemName, { type: 'Relic', relicName: relicFullName, state: relic.state, chance: drop.chance });
      });

      if (relic.state === 'Intact') {
        let realStatus = vaultedMap[relicFullName] || '可掉落';
        if (tier === 'Requiem') {
          realStatus = '可掉落'; 
        }

        let displayName = name;
        if (name.toUpperCase() === 'ETERNA') {
          displayName = '永恆';
        }

        relicIndex[relicFullName] = {
          name: displayName, 
          eraEn: tier,
          era: eraTcMap[tier] || tier, 
          status: realStatus, 
          rewards: relic.rewards.map(r => ({
            itemName: translateItem(r.itemName),
            chance: r.chance
          }))
        };
      }
    });
  }

  console.log('📦 [5/5] 封裝並寫入本地資料庫...');
  const dataDir = './data';
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  fs.writeFileSync(`${dataDir}/planetIndex.json`, JSON.stringify(planetIndex, null, 2));
  fs.writeFileSync(`${dataDir}/nodeIndex.json`, JSON.stringify(nodeIndex, null, 2));
  fs.writeFileSync(`${dataDir}/itemIndex.json`, JSON.stringify(itemIndex, null, 2));
  fs.writeFileSync(`${dataDir}/relicIndex.json`, JSON.stringify(Object.values(relicIndex), null, 2));
  fs.writeFileSync('last_hash.txt', currentHash);

  console.log('🎉 系統 2.0 升級完成！資料庫淨化完畢，純 ID 架構已正式啟動！');
}

build();