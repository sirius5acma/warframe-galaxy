import fs from 'fs';
import crypto from 'crypto';

// 🌟 核心資料庫
const URL_SOL_NODES = 'https://raw.githubusercontent.com/wfcd/warframe-worldstate-data/master/data/solNodes.json'; 
const URL_DROPS = 'https://raw.githubusercontent.com/wfcd/warframe-drop-data/master/data/all.json';
const URL_I18N = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/i18n.json';
const URL_REGIONS = 'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/master/ExportRegions.json';
const URL_DICT_TC = 'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/master/dict.tc.json';
const URL_DICT_EN = 'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/master/dict.en.json';
const URL_ITEMS_RELICS = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/Relics.json';
const URL_WEAPONS = 'https://api.warframestat.us/weapons';

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
  console.log('🚀 [1/6] 啟動 2.0 系統：從底層解包資料庫提取世界藍圖...');
  
  const [solNodesRes, dropsRes, i18nRes, regionsRes, tcRes, enRes, itemsRelicsRes, weaponsRes] = await Promise.all([
    fetchJson(URL_SOL_NODES),
    fetchJson(URL_DROPS),
    fetchJson(URL_I18N),
    fetchJson(URL_REGIONS),
    fetchJson(URL_DICT_TC), 
    fetchJson(URL_DICT_EN), 
    fetchJson(URL_ITEMS_RELICS),
    fetchJson(URL_WEAPONS)
  ]);

  console.log('🛡️ [2/6] 執行指紋比對...');
  const hash = crypto.createHash('md5');
  hash.update(regionsRes.text); 
  hash.update(dropsRes.text);
  hash.update(weaponsRes.text); 
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
  const weaponsEnData = weaponsRes.data || [];

  const nodeIndex = {};
  const planetIndex = {};
  const itemIndex = {};
  const relicIndex = {};
  const formattedWeapons = []; 

  // ==========================================
  // 🌟 物品與武器專用翻譯橋樑
  // ==========================================
  const normalizeString = (str) => {
    return str.replace(/['’]/g, "").replace(/[\r\n]+/g, " ").replace(/\s+/g, ' ').trim().toLowerCase();
  };

  const enNameToIdMap = {};
  Object.entries(enData).forEach(([id, enString]) => {
    const safeKey = normalizeString(enString);
    enNameToIdMap[safeKey] = id;
    if (!safeKey.endsWith(' blueprint')) {
      enNameToIdMap[`${safeKey} blueprint`] = id; 
    }
  });

  const translateText = (engText) => {
    if (!engText) return engText;
    const searchKey = normalizeString(engText);
    const targetId = enNameToIdMap[searchKey];
    if (targetId && tcData[targetId]) {
      return tcData[targetId];
    }
    return engText;
  };

  const translateItem = (itemNameEn) => {
    if (!itemNameEn) return itemNameEn;
    const searchKey = normalizeString(itemNameEn);
    const targetId = enNameToIdMap[searchKey];
    if (targetId && tcData[targetId]) {
      let finalTc = tcData[targetId];
      if (searchKey.includes('blueprint') && !finalTc.includes('藍圖')) {
        finalTc += ' 藍圖';
      }
      return finalTc;
    }
    return itemNameEn;
  };

  const factionMap = {};
  Object.values(solNodes).forEach(node => {
    if (node.value && node.enemy) {
      const match = node.value.match(/^(.*?)\s*\(/);
      const n = match ? match[1].trim().toLowerCase() : node.value.toLowerCase();
      factionMap[n] = node.enemy;
    }
  });

  console.log('⚙️ [3/6] 正在以 ExportRegions 為核心，精準重建星圖與 ID 矩陣...');
  let regionsObj = regionsRes.data.ExportRegions || regionsRes.data;
  
  if (Array.isArray(regionsObj)) {
    const tempObj = {};
    regionsObj.forEach(region => {
      const id = region.uniqueName || region.name || "UnknownNode";
      tempObj[id] = region;
    });
    regionsObj = tempObj;
  }
  
  // 🌟 這裡開始就是修復好的星圖 ID 查詢系統
  Object.entries(regionsObj).forEach(([internalId, region]) => {
    if (region.hidden === true) return;
    if (!region.name || !region.systemName || !region.missionName) return;

    // 直接拿 ID 去字典拿翻譯
    const getExactLang = (id, langDict) => {
      let text = langDict[id] || id;
      if (text.includes('/')) text = text.split('/').pop().replace('_SPACE', ' Proxima');
      return text;
    };

    let enNodeName = getExactLang(region.name, enData);
    let tcNodeName = getExactLang(region.name, tcData);
    
    let enPlanetName = getExactLang(region.systemName, enData);
    let tcPlanetName = getExactLang(region.systemName, tcData);
    
    let enMissionType = getExactLang(region.missionName, enData);
    let tcMissionType = getExactLang(region.missionName, tcData);

    // 終極覆寫字典 (相容舊版圖片名稱)
    const planetOverrides = {
      "KuvaFortress": { en: "Kuva Fortress", tc: "赤毒要塞" },
      "Fortress": { en: "Kuva Fortress", tc: "赤毒要塞" },
      "SolarMapDeimosName": { en: "Dark Refractory, Deimos", tc: "憶夢池 (火衛二)" },
      "Deimos": { en: "Deimos", tc: "火衛二" }, 
      "1999MapName": { en: "Höllvania", tc: "霍爾瓦尼亞" },
      "Zariman": { en: "Zariman", tc: "扎日曼" },
      "Duviri": { en: "Duviri", tc: "渡域" },
      "DeepSpace Proxima": { en: "Veil Proxima", tc: "面紗毗鄰星" },
      "Veil": { en: "Veil Proxima", tc: "面紗毗鄰星" },
      "Moon": { en: "Lua", tc: "月球" }
    };

    if (planetOverrides[enPlanetName]) {
      tcPlanetName = planetOverrides[enPlanetName].tc;
      enPlanetName = planetOverrides[enPlanetName].en;
    }

    if (enPlanetName.includes('Proxima')) {
       if (!tcPlanetName.includes('毗鄰星')) {
         tcPlanetName = tcPlanetName.replace(' Proxima', '') + '毗鄰星';
       }
    }

    const faction = factionMap[enNodeName.toLowerCase()] || "未知";
    const minLvl = region.minEnemyLevel || 0;
    const maxLvl = region.maxEnemyLevel || 0;
    const isPeaceful = (minLvl === 0 && maxLvl === 0);

    const isArchwing = [region.name, region.tileset, region.levelOverride]
      .some(attr => attr && (attr.includes('Archwing') || attr.includes('SpaceBattles')));

    let finalTypeTc = tcMissionType || enMissionType;
    if (isPeaceful) finalTypeTc = "中繼站 / 城鎮";
    else if (isArchwing) finalTypeTc = `${finalTypeTc} (Archwing)`; 

    // ✅ 這裡就是剛剛撞名的 nodeData，現在已經是唯一且正確的版本了
    const nodeData = {
      id: internalId, 
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
      drops: null 
    };

    nodeIndex[internalId] = nodeData;

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

  console.log('⚙️ [4/6] 重建掉落物與遺物索引...');
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
        if (tier === 'Requiem') realStatus = '可掉落'; 

        let displayName = name;
        if (name.toUpperCase() === 'ETERNA') displayName = '永恆';

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

  console.log('⚔️ [5/6] 正在以「本地字典」提取並精準翻譯武器資料庫...');
  const validWeaponCategories = ["Primary", "Secondary", "Melee"];
  
  const WEAPON_TYPE_MAP = {
    "Rifle": "步槍", "Sniper Rifle": "狙擊槍", "Bow": "弓", "Shotgun": "霰彈槍",
    "Launcher": "發射器", "Crossbow": "弩", "Speargun": "標槍", "Pistol": "手槍",
    "Dual Pistols": "雙手槍", "Shotgun Sidearm": "副手霰彈槍", "Throwing": "投擲武器",
    "Sword": "劍", "Dual Swords": "雙劍", "Nikana": "侍刃", "Two-Handed Nikana": "雙手侍刃",
    "Scythe": "鐮刀", "Polearm": "長柄武器", "Staff": "棍", "Heavy Blade": "巨刃",
    "Hammer": "錘", "Dagger": "匕首", "Dual Daggers": "雙匕首", "Fist": "拳套",
    "Sparring": "搏擊", "Glaive": "戰刃", "Gunblade": "槍刃", "Whip": "鞭",
    "Sword and Shield": "劍與盾", "Tonfa": "拐刃", "Nunchaku": "雙截棍", "Rapier": "細劍",
    "Claws": "爪", "Blade and Whip": "劍鞭", "Warfan": "戰扇", "Assault Saw": "突擊鋸",
    "Arm Cannon": "手臂加農砲"
  };

  weaponsEnData.forEach(enWeapon => {
    if (!validWeaponCategories.includes(enWeapon.category)) return;

    const tcName = translateText(enWeapon.name);
    const tcType = WEAPON_TYPE_MAP[enWeapon.type] || translateText(enWeapon.type) || enWeapon.type;
    const tcDesc = translateText(enWeapon.description);

    let categoryTc = "";
    if (enWeapon.category === "Primary") categoryTc = "主武器";
    else if (enWeapon.category === "Secondary") categoryTc = "次要武器";
    else if (enWeapon.category === "Melee") categoryTc = "近戰武器";

    const stats = {
      critChance: enWeapon.criticalChance ? parseFloat((enWeapon.criticalChance * 100).toFixed(1)) : 0,
      critMultiplier: enWeapon.criticalMultiplier || 0,
      statusChance: enWeapon.procChance ? parseFloat((enWeapon.procChance * 100).toFixed(1)) : 0,
      totalDamage: enWeapon.totalDamage || 0
    };

    formattedWeapons.push({
      id: enWeapon.name.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_'),
      nameTc: tcName,
      nameEn: enWeapon.name,
      category: categoryTc,
      type: tcType,      
      mr: enWeapon.masteryReq || 0,
      description: tcDesc, 
      stats: stats,
      imageName: enWeapon.imageName,
      relics: [] 
    });
  });

  console.log('📦 [6/6] 封裝並寫入本地資料庫...');
  const dataDir = './data';
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  fs.writeFileSync(`${dataDir}/planetIndex.json`, JSON.stringify(planetIndex, null, 2));
  fs.writeFileSync(`${dataDir}/nodeIndex.json`, JSON.stringify(nodeIndex, null, 2));
  fs.writeFileSync(`${dataDir}/itemIndex.json`, JSON.stringify(itemIndex, null, 2));
  fs.writeFileSync(`${dataDir}/relicIndex.json`, JSON.stringify(Object.values(relicIndex), null, 2));
  fs.writeFileSync(`${dataDir}/weaponsIndex.json`, JSON.stringify(formattedWeapons, null, 2)); 
  fs.writeFileSync('last_hash.txt', currentHash);

  console.log('🎉 系統 2.0 升級完成！資料庫淨化完畢，純 ID 架構已正式啟動！');
}

build();