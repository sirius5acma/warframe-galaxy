const URL_SOL_NODES = 'https://raw.githubusercontent.com/wfcd/warframe-worldstate-data/master/data/solNodes.json';
const URL_I18N = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/i18n.json';

let currentView = 'normal';
let previousView = 'normal';

let normalPlanets = {}; 
let proximaPlanets = {};
let normalPlanetsArray = []; 
let proximaPlanetsArray = [];

const planetImages = {
  "Earth": "images/Earth.png", "Venus": "images/Venus.png", "Mars": "images/Mars.png",
  "Jupiter": "images/Jupiter.png", "Saturn": "images/Saturn.png", "Uranus": "images/Uranus.png",
  "Neptune": "images/Neptune.png", "Pluto": "images/Pluto.png", "Sedna": "images/Sedna.png",
  "Ceres": "images/Ceres.png", "Eris": "images/Eris.png", "Phobos": "images/Phobos.png",
  "Europa": "images/Europa.png", "Mercury": "images/Mercury.png", "Void": "images/Void.png",
  "Derelict": "images/Derelict.png", "Lua": "images/Lua.png", "Kuva Fortress": "images/KuvaFortress.png",
  "Deimos": "images/Deimos.png", "Zariman": "images/Zariman.png", "Duviri": "images/Duviri.png",
  "Veil": "images/Void.png"
};

const planetOrder = {
  "earth": 1, "venus": 2, "mercury": 3, "mars": 4, "phobos": 5,
  "deimos": 6, "ceres": 7, "jupiter": 8, "europa": 9, "saturn": 10,
  "uranus": 11, "neptune": 12, "pluto": 13, "sedna": 14, "eris": 15,
  "void": 16, "lua": 17, "kuva fortress": 18, "zariman": 19,
  "derelict": 20, "duviri": 100, "veil": 101
};

// 🌟 寫死的完美常規掉落物字典
const planetDrops = {
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

async function fetchWithCache(url) {
  const cache = await caches.open('warframe-data-cache-v1');
  const cachedResponse = await cache.match(url);
  if (cachedResponse) return cachedResponse.json();
  
  const response = await fetch(url);
  if (response.ok) {
    cache.put(url, response.clone());
    return response.json();
  }
  throw new Error(`網路請求失敗: ${response.status}`);
}

Promise.all([
  fetchWithCache(URL_SOL_NODES),
  fetchWithCache(URL_I18N) // 移除了 URL_RESOURCES，速度大幅提升！
]).then(([nodesData, i18nData]) => {
  document.getElementById('loader').style.display = 'none';

  const i18nNameMap = {};
  Object.keys(i18nData).forEach(key => {
    if (i18nData[key].en && i18nData[key].en.name) {
      i18nNameMap[i18nData[key].en.name.toLowerCase()] = i18nData[key];
    }
  });

  function getTcTranslation(englishName, type) {
    if (!englishName) return "未知";
    let lower = englishName.toLowerCase();
    
    let match = i18nNameMap[lower];
    if (match) {
      return match.tc?.name || match['zh-hant']?.name || match.zh?.name || englishName;
    }

    if (type === 'planet') {
       if (lower.includes('proxima')) {
           let baseName = lower.replace(' proxima', '');
           if (baseName === 'veil') return "面紗毗鄰星";
           return (basicPlanets[baseName] || englishName.split(' ')[0]) + "毗鄰星";
       }
       return basicPlanets[lower] || englishName;
    }
    
    if (type === 'faction') return enemyTypes[englishName] || englishName;
    if (typeof customNodes !== 'undefined' && type === 'node') {
        return customNodes[englishName] || englishName;
    }

    if (type === 'mission') {
      let text = englishName;
      text = text.replace(/Dark Sector/gi, ""); 
      text = text.replace(/Crossfire/gi, "交火");
      
      if(typeof missionTypes !== 'undefined'){
          const sortedKeys = Object.keys(missionTypes).sort((a, b) => b.length - a.length);
          sortedKeys.forEach(key => {
            const regex = new RegExp(key, "gi");
            text = text.replace(regex, missionTypes[key]);
          });
      }
      
      text = text.replace(/^\s+|\s+$/g, ""); 
      text = text.replace(/交火\s+/g, "交火");
      return text || "未知";
    }

    return englishName;
  }

  Object.keys(nodesData).forEach(nodeId => {
    const node = nodesData[nodeId];
    if (!node || !node.value || node.type === 'Relay' || node.type === 'Clan Dojo') return;
    if (node.type === 'Ancient Retribution' || node.enemy === 'Ancient Retribution') return;

    const match = node.value.match(/\(([^)]+)\)/);
    if (!match) return;

    const rawPlanetNameEn = match[1]; 
    const rawNodeName = node.value.replace(/\s*\(.*?\)\s*/g, ''); 

    const rjMissionTypes = ['Skirmish', 'Orphix', 'Volatile']; 
    const isProxima = rawPlanetNameEn === 'Veil' || rjMissionTypes.includes(node.type);

    let targetDict, finalPlanetNameEn, imgKey;

    if (isProxima) {
        targetDict = proximaPlanets;
        finalPlanetNameEn = rawPlanetNameEn === 'Veil' ? 'Veil Proxima' : `${rawPlanetNameEn} Proxima`;
        imgKey = rawPlanetNameEn === 'Veil' ? 'Veil' : rawPlanetNameEn;
    } else {
        targetDict = normalPlanets;
        finalPlanetNameEn = rawPlanetNameEn;
        imgKey = rawPlanetNameEn;
    }

    if (!targetDict[finalPlanetNameEn]) {
        targetDict[finalPlanetNameEn] = {
            nameEn: finalPlanetNameEn,
            nameTc: getTcTranslation(finalPlanetNameEn, 'planet'),
            imgUrl: planetImages[imgKey] || '', 
            nodes: []
        };
    }
    
    targetDict[finalPlanetNameEn].nodes.push({
      id: nodeId,
      name: getTcTranslation(rawNodeName, 'node'),
      type: getTcTranslation(node.type, 'mission'),
      enemy: getTcTranslation(node.enemy, 'faction')
    });
  });

  normalPlanetsArray = Object.values(normalPlanets);
  normalPlanetsArray.sort((a, b) => {
    let aBase = a.nameEn.toLowerCase();
    let bBase = b.nameEn.toLowerCase();
    let aWeight = planetOrder[aBase] || 50; 
    let bWeight = planetOrder[bBase] || 50;
    if (aWeight !== bWeight) return aWeight - bWeight;
    return a.nameEn.localeCompare(b.nameEn);
  });

  proximaPlanetsArray = Object.values(proximaPlanets);
  proximaPlanetsArray.sort((a, b) => {
    let aBase = a.nameEn.toLowerCase().replace(' proxima', '');
    let bBase = b.nameEn.toLowerCase().replace(' proxima', '');
    let aWeight = planetOrder[aBase] || 50; 
    let bWeight = planetOrder[bBase] || 50;
    if (aWeight !== bWeight) return aWeight - bWeight;
    return a.nameEn.localeCompare(b.nameEn);
  });
  
  renderGrid(normalPlanetsArray);

  const urlParams = new URLSearchParams(window.location.search);
  const resourceName = urlParams.get('resource'); 
  const targetLocations = urlParams.get('targets'); 
  
  if (resourceName && targetLocations) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = `📍 尋找素材：${resourceName}`;
    
    const filteredPlanets = normalPlanetsArray.filter(planet => {
        return targetLocations.toLowerCase().includes(planet.nameEn.toLowerCase()) || 
               targetLocations.includes(planet.nameTc);
    });
    
    renderGrid(filteredPlanets);
  }

}).catch(err => {
  console.error(err);
  document.getElementById('loader').innerText = '載入失敗，請檢查網路連線。';
});

function handleBack() {
  if (currentView === 'detail') {
      currentView = previousView;
      document.getElementById('planet-detail-view').style.display = 'none';
      document.getElementById('grid').style.display = 'grid';
      document.getElementById('searchBoxContainer').style.display = 'block';
      
      if (currentView === 'normal') {
          document.getElementById('backBtn').innerHTML = '&#8592; 返回樞紐';
          document.getElementById('sub-title').innerText = '一般星圖';
      } else {
          document.getElementById('backBtn').innerHTML = '&#8592; 返回一般星圖';
          document.getElementById('sub-title').innerText = '九重天 (銳捷號星圖)';
      }
  } else if (currentView === 'proxima') {
      currentView = 'normal';
      document.getElementById('backBtn').innerHTML = '&#8592; 返回樞紐';
      document.getElementById('sub-title').innerText = '一般星圖';
      document.getElementById('searchInput').value = '';
      renderGrid(normalPlanetsArray);
  } else {
      window.location.href = 'index.html'; 
  }
}

function renderGrid(planetsToRender) {
  const grid = document.getElementById('grid');
  grid.innerHTML = ''; 
  
  if (planetsToRender.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #a0aec0;">找不到符合條件的星球或節點。</div>';
    return;
  }

  planetsToRender.forEach(planet => {
    const card = document.createElement('div');
    card.className = 'card';
    
    const imgHtml = planet.imgUrl 
      ? `<img src="${planet.imgUrl}" class="planet-img" onerror="this.outerHTML='<div class=\\'planet-placeholder\\'>無圖片</div>';">`
      : `<div class="planet-placeholder">無圖片</div>`;
    
    card.innerHTML = `
      ${imgHtml}
      <div class="card-title">${planet.nameTc}</div>
      <div class="card-subtitle">${planet.nameEn}</div>
      <div class="card-subtitle" style="color: #10b981; margin-top: 15px;">${planet.nodes.length} 個節點</div>
    `;
    
    card.onclick = () => openPlanetDetail(planet);
    grid.appendChild(card);
  });

  if (currentView === 'normal') {
      const rjCard = document.createElement('div');
      rjCard.className = 'card empyrean-card';
      rjCard.innerHTML = `
        <img src="images/railjack.png" class="planet-img" onerror="this.outerHTML='<div class=\\'planet-placeholder\\'>無圖片</div>';">
        <div class="card-title">九重天</div>
        <div class="card-subtitle">Empyrean</div>
        <div class="card-subtitle" style="color: #38bdf8; margin-top: 15px; font-weight:bold;">點擊進入銳捷號星圖</div>
      `;
      
      rjCard.onclick = () => {
          currentView = 'proxima';
          document.getElementById('backBtn').innerHTML = '&#8592; 返回一般星圖';
          document.getElementById('sub-title').innerText = '九重天 (銳捷號星圖)';
          document.getElementById('searchInput').value = '';
          renderGrid(proximaPlanetsArray);
      };
      grid.appendChild(rjCard);
  }
}

function openPlanetDetail(planet) {
  previousView = currentView;
  currentView = 'detail';
  
  document.getElementById('grid').style.display = 'none';
  document.getElementById('searchBoxContainer').style.display = 'none';
  
  document.getElementById('backBtn').innerHTML = previousView === 'normal' ? '&#8592; 返回一般星圖' : '&#8592; 返回銳捷號星圖';
  document.getElementById('sub-title').innerText = '星域詳細資訊';

  document.getElementById('planet-detail-view').style.display = 'block';

  const detailImg = document.getElementById('detail-img');
  if (planet.imgUrl) {
    detailImg.src = planet.imgUrl;
    detailImg.style.display = 'block';
  } else {
    detailImg.style.display = 'none';
  }
  document.getElementById('detail-name-tc').innerText = planet.nameTc;
  document.getElementById('detail-name-en').innerText = planet.nameEn;
  document.getElementById('detail-node-count').innerText = planet.nodes.length;

  // 🌟 動態渲染常規掉落物 (從寫死的字典抓取)
  const dropsContainer = document.getElementById('detail-drops');
  dropsContainer.innerHTML = '';
  
  const drops = planetDrops[planet.nameEn] || [];
  
  if (drops.length > 0) {
    drops.forEach(dropName => {
      dropsContainer.innerHTML += `<div class="drop-item">${dropName}</div>`;
    });
  } else {
    dropsContainer.innerHTML = `<div style="color: #a0aec0; font-style: italic;">本星域無常規資源紀錄。</div>`;
  }
  
  // 渲染下半部的網格節點
  const nodesContainer = document.getElementById('detail-nodes');
  nodesContainer.innerHTML = '';
  
  planet.nodes.sort((a, b) => a.name.localeCompare(b.name)).forEach(node => {
    nodesContainer.innerHTML += `
      <div class="node-card">
        <div class="node-name">
          <span>${node.name}</span>
          <span class="node-type">${node.type}</span>
        </div>
        <div class="node-faction">派系：${node.enemy}</div>
      </div>
    `;
  });
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase().trim();
  const activeArray = currentView === 'normal' ? normalPlanetsArray : proximaPlanetsArray;

  const filtered = activeArray.filter(planet => {
    if (planet.nameEn.toLowerCase().includes(term) || planet.nameTc.toLowerCase().includes(term)) return true;
    return planet.nodes.some(node => 
      node.name.toLowerCase().includes(term) || 
      node.type.toLowerCase().includes(term) || 
      node.enemy.toLowerCase().includes(term)
    );
  });
  renderGrid(filtered);
});