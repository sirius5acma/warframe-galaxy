import fs from 'fs';
import crypto from 'crypto';

// 🌟 核心資料庫
const URL_SOL_NODES = 'https://raw.githubusercontent.com/wfcd/warframe-worldstate-data/master/data/solNodes.json'; // 降級為輔助 (補派系用)
const URL_DROPS = 'https://raw.githubusercontent.com/wfcd/warframe-drop-data/master/data/all.json';
const URL_I18N = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/i18n.json';
const URL_REGIONS = 'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/senpai/ExportRegions.json'; // 🌟 晉升為核心
const URL_DICT_TC = 'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/senpai/dict.tc.json';
const URL_DICT_EN = 'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/senpai/dict.en.json';

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
  "Duviri": ["哀悲標置", "龍焏", "肉葉結節", "密聲冷石"], //這個還不確定要再改
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
  hash.update(regionsRes.text); // 改用 Regions 當主要指紋
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
  
  let regionsObj = regionsRes.data.ExportRegions || regionsRes.data || {};

  // 🌟 建立輔助：從 solNodes 提取「派系」與「Archwing 標籤」
  const factionMap = {};
  const archwingMap = {}; // 新增 Archwing 探測器
  
  Object.values(solNodes).forEach(node => {
    if (node && node.value) {
      const match = node.value.match(/(.+?)\s*\(/);
      if (match) {
        const nodeKey = match[1].trim().toUpperCase();
        factionMap[nodeKey] = node.enemy || "無";
        
        // 只要 WFCD 資料庫有標示，或描述裡含有 Archwing 字眼，就標記起來
        if (node.isArchwing || (node.desc && node.desc.includes('Archwing'))) {
          archwingMap[nodeKey] = true;
        }
      }
    }
  });

  // WFCD 物品翻譯 (給掉落表用)
  const i18nNameMap = {};
  Object.keys(i18n).forEach(key => {
    if (i18n[key].en && i18n[key].en.name) {
      i18nNameMap[i18n[key].en.name.toLowerCase()] = i18n[key].tc?.name || i18n[key]['zh-hant']?.name || i18n[key].zh?.name || i18n[key].en.name;
    }
  });
  const translateItem = (enText) => i18nNameMap[(enText || "").toLowerCase()] || enText;

  const planetIndex = {};
  const nodeIndex = {};
  const itemIndex = {};
  const relicIndex = {};

  console.log('⚙️ [3/4] 正在以 ExportRegions 為核心，精準重建星圖矩陣...');
  
  Object.entries(regionsObj).forEach(([regionId, region]) => {
    // 🛡️ 官方無敵過濾網：直接濾掉所有隱藏、廢棄、測試節點 (完美消滅舊版 Vesper)
    if (region.hidden === true) return;
    if (!region.name || !region.systemName || !region.missionName) return;

    // 🌟 1. 精準雙語對接：直接從字典開鎖！
    const enNodeName = dictEn[region.name];
    const tcNodeName = dictTc[region.name];
    
    const enPlanetName = dictEn[region.systemName];
    const tcPlanetName = dictTc[region.systemName];
    
    const enMissionType = dictEn[region.missionName];
    const tcMissionType = dictTc[region.missionName];

    // 如果連英文官方字典都沒有這個節點，代表是非常底層的無用代碼，跳過
    if (!enNodeName || !enPlanetName || !enMissionType) return;

    if (enPlanetName === "Veil") {
      enPlanetName = "Veil Proxima";
      tcPlanetName = "面紗毗鄰星";
    }

    // 🌟 2. 獲取派系 (從剛才建立的輔助表拿)
    const faction = factionMap[enNodeName.toUpperCase()] || "無";

    // 🌟 3. 處理等級與和平區域判斷
    const minLvl = region.minEnemyLevel || 0;
    const maxLvl = region.maxEnemyLevel || 0;
    // 如果等級是 0，且任務類型包含中繼站/城鎮 (Hub)，則標記為和平區域
    const isPeaceful = (minLvl === 0 && maxLvl === 0);

    const isArchwing = [
      region.name,
      region.tileset,
      region.levelOverride
    ].some(attr => attr && (attr.includes('Archwing') || attr.includes('SpaceBattles')));

    // 🛡️ 任務類型後製處理
    let finalTypeTc = tcMissionType || enMissionType;
    if (isPeaceful) {
      finalTypeTc = "中繼站 / 城鎮";
    } else if (isArchwing) {
      finalTypeTc = `${finalTypeTc} (Archwing)`; // 只要掃描到關鍵字，就強制掛上牌子！
    }

    const nodeData = {
      id: regionId,              // e.g. "EarthNodeC", "CrewBattleNode559"
      nameEn: enNodeName,        // e.g. "Coba"
      nameTc: tcNodeName || enNodeName, // 萬一沒中文，退回英文
      type: enMissionType,       // e.g. "Defense", "Railjack Assassinate"
      typeTc: finalTypeTc, // 🌟 附上官方中文任務名稱！(e.g. "防禦")
      faction: faction,
      levels: {
        normal: isPeaceful ? "和平區域" : `${minLvl} - ${maxLvl}`,
        steelPath: isPeaceful ? "和平區域" : `${minLvl + 100} - ${maxLvl + 100}`
      }
    };

    // 🌟 4. 歸類到正確的星球 (再也不用自己判斷 Proxima 了！)
    if (!planetIndex[enPlanetName]) {
      planetIndex[enPlanetName] = {
        nameEn: enPlanetName,
        nameTc: tcPlanetName || enPlanetName,
        drops: PLANET_DROPS[enPlanetName] || [],
        nodes: []
      };
    }
    planetIndex[enPlanetName].nodes.push(nodeData);

    // 🌟 5. 精準對接掉落表
    // Drops API 的路徑通常是 "Earth/Coba" 或 "Earth Proxima/R-9 Cloud"
    const dropPath = `${enPlanetName}/${enNodeName}`;
    let nodeDrops = null;
    if (drops.missionRewards && drops.missionRewards[dropPath]) {
      nodeDrops = drops.missionRewards[dropPath];
    }
    
    nodeIndex[regionId] = {
      ...nodeData,
      planet: enPlanetName,
      drops: nodeDrops
    };
  });
  
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

  console.log('🎉 系統 2.0 升級完成！資料庫淨化完畢，幽靈節點與錯位問題已徹底根除！');
}

build();