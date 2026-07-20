import fs from 'fs';
import crypto from 'crypto';

// 🌟 資料來源：四大金剛集合
const URL_SOL_NODES = 'https://raw.githubusercontent.com/wfcd/warframe-worldstate-data/master/data/solNodes.json';
const URL_DROPS = 'https://raw.githubusercontent.com/wfcd/warframe-drop-data/master/data/all.json';
const URL_I18N = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/i18n.json'; // 留給掉落物品用
const URL_REGIONS = 'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/senpai/ExportRegions.json';
const URL_DICT_TC = 'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/senpai/dict.tc.json';
const URL_DICT_EN = 'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/senpai/dict.en.json'; // 🌟 新增英文橋樑

// 🗑️ 垃圾過濾名單
const JUNK_FILTER = [
  "Endo", "Credits", "Void Traces", "Rubedo", "Ferrite", "Alloy Plate", 
  "Nano Spores", "Plastids", "Polymer Bundle", "Salvage", "Credit Cache",
  "Detonite Ampule", "Fieldron Sample", "Mutagen Sample", "Circuits", "Control Module"
];

// 🌟 常規掉落物字典
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
  "Duviri": ["哀悲標置", "龍焏", "肉葉結節", "密聲冷石"], //這個還不確定要再改
  "Earth Proxima": ["鈦金屬", "鈦核船板", "碳化物", "立方二極體", "星彩藍寶石", "加落斯反物質燃料棒", "愛索斯修複液", "奧核電容", "Komms", "虛能石", "碲"],
  "Venus Proxima": ["鈦金屬", "鈦核船板", "碳化物", "立方二極體", "星彩藍寶石", "加落斯反物質燃料棒", "愛索斯修複液", "奧核電容", "Komms", "虛能石", "碲"],
  "Saturn Proxima": ["鈦金屬", "鈦核船板", "碳化物", "立方二極體", "星彩藍寶石", "加落斯反物質燃料棒", "愛索斯修複液", "奧核電容", "Komms", "虛能石", "碲"],
  "Neptune Proxima": ["鈦金屬", "鈦核船板", "碳化物", "立方二極體", "星彩藍寶石", "加落斯反物質燃料棒", "愛索斯修複液", "奧核電容", "Komms", "虛能石", "碲"],
  "Pluto Proxima": ["鈦金屬", "鈦核船板", "碳化物", "立方二極體", "星彩藍寶石", "加落斯反物質燃料棒", "愛索斯修複液", "奧核電容", "Komms", "虛能石", "碲"],
  "Veil Proxima": ["鈦金屬", "鈦核船板", "碳化物", "立方二極體", "星彩藍寶石", "加落斯反物質燃料棒", "愛索斯修複液", "奧核電容", "Komms", "虛能石", "碲"]
};

// 防呆 Fetch
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
  console.log('🚀 [1/5] 開始向 WFCD 與解包資料庫下載海量數據 (可能需要幾秒鐘)...');
  
  const [solNodesRes, dropsRes, i18nRes, regionsRes, dictTcRes, dictEnRes] = await Promise.all([
    fetchJson(URL_SOL_NODES),
    fetchJson(URL_DROPS),
    fetchJson(URL_I18N),
    fetchJson(URL_REGIONS),
    fetchJson(URL_DICT_TC),
    fetchJson(URL_DICT_EN)
  ]);

  console.log('🛡️ [2/5] 執行指紋比對...');
  const hash = crypto.createHash('md5');
  hash.update(solNodesRes.text);
  hash.update(dropsRes.text);
  const currentHash = hash.digest('hex');

  if (fs.existsSync('last_hash.txt') && currentHash === fs.readFileSync('last_hash.txt', 'utf8')) {
    console.log('✅ 資料無變動，提早下班！');
    return;
  }

  const solNodes = solNodesRes.data;
  const drops = dropsRes.data;
  const i18n = i18nRes.data;
  const dictTc = dictTcRes.data || {};
  const dictEn = dictEnRes.data || {};

  const enToTcMap = {};
  Object.keys(dictEn).forEach(key => {
    const enText = dictEn[key];
    if (typeof enText === 'string') {
      // 轉大寫，消除大小寫比對的誤差
      enToTcMap[enText.trim().toUpperCase()] = dictTc[key]; 
    }
  });
  
  let rawRegions = regionsRes.data.ExportRegions || regionsRes.data || [];
  const regionsData = Array.isArray(rawRegions) ? rawRegions : Object.values(rawRegions);

  // 🌟 1. 建立「無敵字典」：以英文大寫名稱為 Key，直接包含等級與官方中文！
  const regionMap = {};
  regionsData.forEach(region => {
    if (region.name) {
      const locKey = region.name; // 例如 "/Lotus/Language/Locations/DeepSpaceCrewBattleNode50"
      const enName = dictEn[locKey]; // 透過橋樑拿到 "R-9 Cloud"
      const tcName = dictTc[locKey]; // 拿到 "R-9 星雲"

      if (enName) {
        const cleanKey = enName.trim().toUpperCase();
        regionMap[cleanKey] = {
          min: region.minEnemyLevel || 0,
          max: region.maxEnemyLevel || 0,
          tcName: tcName || enName // 萬一 TC 缺失，退回英文
        };
      }
    }
  });

  // 🌟 2. 星球反查表 (解決毗鄰星問題)
  const realPlanetMap = {};
  if (drops.missionRewards) {
    Object.keys(drops.missionRewards).forEach(path => {
      const parts = path.split('/');
      if (parts.length === 2) {
        realPlanetMap[parts[1].trim()] = parts[0].trim();
      }
    });
  }

  // WFCD 物品翻譯 (用於掉落表)
  const i18nNameMap = {};
  Object.keys(i18n).forEach(key => {
    if (i18n[key].en && i18n[key].en.name) {
      i18nNameMap[i18n[key].en.name.toLowerCase()] = i18n[key].tc?.name || i18n[key]['zh-hant']?.name || i18n[key].zh?.name || i18n[key].en.name;
    }
  });
  const translateItem = (enText) => i18nNameMap[(enText || "").toLowerCase()] || enText;

  // 星球翻譯
  const translatePlanet = (enPlanet) => {
    const searchKey = enPlanet.trim().toUpperCase();
    
    // 直接去全域翻譯蒟蒻裡面查 (例如 "EARTH" -> "地球", "EARTH PROXIMA" -> "地球毗鄰星")
    let tcName = enToTcMap[searchKey];

    // 🛡️ 防呆機制：萬一有特殊情況沒查到 (比如 WFCD 自己亂拼字)，我們把它拆開來查
    if (!tcName) {
      const base = enPlanet.replace(' Proxima', '');
      const baseTc = enToTcMap[base.toUpperCase()] || base;
      tcName = baseTc + (enPlanet.includes('Proxima') ? '毗鄰星' : '');
    }
    
    return tcName;
  };

  const planetIndex = {};
  const nodeIndex = {};
  const itemIndex = {};
  const relicIndex = {};

  console.log('⚙️ [3/4] 正在透過英文橋樑，將節點 UI 與底層資料完美融合...');
  
  Object.keys(solNodes).forEach(nodeId => {
    const node = solNodes[nodeId];
    if (!node || !node.value || node.type === 'Relay' || node.type === 'Clan Dojo' || node.type === 'Ancient Retribution') return;

    const match = node.value.match(/(.+?)\s*\((.+?)\)/);
    if (!match) return;

    const rawNodeName = match[1].trim(); // 這是英文名 (e.g. "R-9 Cloud")
    let planetEn = match[2].trim();

    // 毗鄰星校正
    const realPlanet = realPlanetMap[rawNodeName];
    if (realPlanet && realPlanet.includes(planetEn)) {
      planetEn = realPlanet;
    } else if (!planetEn.includes('Proxima') && ['Skirmish', 'Volatile', 'Orphix'].includes(node.type)) {
      planetEn += ' Proxima';
    }

    // 🌟 在無敵字典中精準查找！
    const searchKey = rawNodeName.toUpperCase();
    const regionInfo = regionMap[searchKey] || { min: 0, max: 0, tcName: null };
    
    const minLvl = regionInfo.min;
    const maxLvl = regionInfo.max;
    const isUnknown = (minLvl === 0 && maxLvl === 0);
    
    // 如果底層找不到官方中文，退回使用 WFCD 的翻譯機作為備案
    const finalTcName = regionInfo.tcName || translateItem(rawNodeName);

    const nodeData = {
      id: nodeId,
      nameEn: rawNodeName,
      nameTc: finalTcName,    // 🌟 原汁原味的官方翻譯！
      type: node.type,        // 前端負責
      faction: node.enemy,    // 前端負責
      levels: {
        normal: isUnknown ? "未知" : `${minLvl} - ${maxLvl}`,
        steelPath: isUnknown ? "未知" : `${minLvl + 100} - ${maxLvl + 100}`
      }
    };

    if (!planetIndex[planetEn]) {
      planetIndex[planetEn] = {
        nameEn: planetEn,
        nameTc: translatePlanet(planetEn),
        drops: PLANET_DROPS[planetEn] || [],
        nodes: []
      };
    }
    planetIndex[planetEn].nodes.push(nodeData);

    const dropPath = `${planetEn}/${rawNodeName}`;
    let nodeDrops = null;
    if (drops.missionRewards && drops.missionRewards[dropPath]) {
      nodeDrops = drops.missionRewards[dropPath];
    }
    
    nodeIndex[nodeId] = {
      ...nodeData,
      planet: planetEn,
      drops: nodeDrops
    };
  });
  
  console.log('⚙️ [4/5] 處理掉落表...');
  const addItemSource = (itemNameEn, sourceObj) => {
    if (JUNK_FILTER.some(junk => itemNameEn.includes(junk))) return;
    const itemNameTc = translateItem(itemNameEn);
    if (!itemIndex[itemNameTc]) itemIndex[itemNameTc] = [];
    itemIndex[itemNameTc].push(sourceObj);
  };

  Object.keys(nodeIndex).forEach(nodeId => {
    const node = nodeIndex[nodeId];
    if (!node.drops || !node.drops.rewards) return;
    const r = node.drops.rewards;
    if (r.A || r.B || r.C) {
      ['A', 'B', 'C'].forEach(rot => {
        if (r[rot]) r[rot].forEach(drop => addItemSource(drop.itemName, { type: 'Mission', nodeId: nodeId, rotation: rot, chance: drop.chance }));
      });
    } else if (Array.isArray(r)) {
      r.forEach(drop => addItemSource(drop.itemName, { type: 'Mission', nodeId: nodeId, chance: drop.chance }));
    }
  });

  if (drops.relics) {
    drops.relics.forEach(relic => {
      relic.rewards.forEach(drop => {
        const relicFullName = `${relic.tier} ${relic.relicName}`;
        addItemSource(drop.itemName, { type: 'Relic', relicName: relicFullName, state: relic.state, chance: drop.chance });
      });
    });
  }

  const dataDir = './data';
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  fs.writeFileSync(`${dataDir}/planetIndex.json`, JSON.stringify(planetIndex, null, 2));
  fs.writeFileSync(`${dataDir}/nodeIndex.json`, JSON.stringify(nodeIndex, null, 2));
  fs.writeFileSync(`${dataDir}/itemIndex.json`, JSON.stringify(itemIndex, null, 2));
  fs.writeFileSync(`${dataDir}/relicIndex.json`, JSON.stringify(relicIndex, null, 2));
  fs.writeFileSync('last_hash.txt', currentHash);

  console.log('🎉 大功告成！完美整合官方中英對照與底層數值，這次真的是系統的完全體了！');
}

build();