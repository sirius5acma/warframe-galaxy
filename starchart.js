const URL_PLANET_INDEX = 'data/planetIndex.json';

let currentView = 'normal';
let previousView = 'normal';

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

async function init() {
  try {
    const response = await fetch(URL_PLANET_INDEX);
    if (!response.ok) throw new Error('無法載入星球資料，請確認 data 資料夾是否存在。');
    const planetData = await response.json();

    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';

    Object.values(planetData).forEach(planet => {
      let baseName = planet.nameEn.replace(' Proxima', '');
      let imgKey = baseName === 'Veil' ? 'Veil' : baseName;
      planet.imgUrl = planetImages[imgKey] || '';

      if (planet.nameEn.includes('Proxima') || planet.nameEn === 'Veil') {
        proximaPlanetsArray.push(planet);
      } else {
        normalPlanetsArray.push(planet);
      }
    });

    const sortFn = (a, b) => {
      let aBase = a.nameEn.toLowerCase().replace(' proxima', '');
      let bBase = b.nameEn.toLowerCase().replace(' proxima', '');
      let aWeight = planetOrder[aBase] || 50; 
      let bWeight = planetOrder[bBase] || 50;
      if (aWeight !== bWeight) return aWeight - bWeight;
      return a.nameEn.localeCompare(b.nameEn);
    };

    normalPlanetsArray.sort(sortFn);
    proximaPlanetsArray.sort(sortFn);

    renderGrid(normalPlanetsArray);

  } catch (err) {
    console.error(err);
    const loader = document.getElementById('loader');
    if (loader) loader.innerText = '載入失敗，請檢查檔案路徑。';
  }
}

function handleBack() {
  if (currentView === 'detail') {
      currentView = previousView;
      
      // 🌟 已修正為 starSearch
      const searchInput = document.getElementById('starSearch');
      if (searchInput) {
          searchInput.value = '';
      }

      const detailView = document.getElementById('planet-detail-view');
      const grid = document.getElementById('grid');
      const searchBoxContainer = document.getElementById('searchBoxContainer');
      const searchContainer = document.getElementById('search-container'); 
      
      if (detailView) detailView.style.display = 'none';
      if (grid) grid.style.display = 'grid';
      if (searchBoxContainer) searchBoxContainer.style.display = 'block';
      if (searchContainer) searchContainer.style.display = 'block';
      
      const backBtn = document.getElementById('backBtn');
      const subTitle = document.getElementById('sub-title');

      if (currentView === 'normal') {
          if (backBtn) backBtn.innerHTML = '&#8592; 返回樞紐';
          if (subTitle) subTitle.innerText = '一般星圖';
      } else {
          if (backBtn) backBtn.innerHTML = '&#8592; 返回一般星圖';
          if (subTitle) subTitle.innerText = '九重天 (銳捷號星圖)';
      }
      
      const activeArray = currentView === 'normal' ? normalPlanetsArray : proximaPlanetsArray;
      renderGrid(activeArray);
      
  } else if (currentView === 'proxima') {
      currentView = 'normal';
      
      const backBtn = document.getElementById('backBtn');
      const subTitle = document.getElementById('sub-title');
      // 🌟 已修正為 starSearch
      const searchInput = document.getElementById('starSearch');

      if (backBtn) backBtn.innerHTML = '&#8592; 返回樞紐';
      if (subTitle) subTitle.innerText = '一般星圖';
      if (searchInput) searchInput.value = '';
      
      renderGrid(normalPlanetsArray);
  } else {
      window.location.href = 'index.html'; 
  }
}

function renderGrid(planetsToRender) {
  const grid = document.getElementById('grid');
  if (!grid) return;
  
  grid.innerHTML = ''; 
  
  if (planetsToRender.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #a0aec0;">找不到符合條件的星球或節點。</div>';
    return;
  }

  planetsToRender.forEach(planet => {
    // 🌟 自動分類守門員：一般星圖不顯示毗鄰星，九重天只顯示毗鄰星
    const isProxima = planet.nameEn.includes('Proxima');
    if (currentView === 'normal' && isProxima) return;
    if (currentView === 'proxima' && !isProxima) return;

    const card = document.createElement('div');
    card.className = 'card';
    
    // 直接使用編譯好的 nameEn 抓圖，完全不用再取代空白！
    const imgHtml = `<img src="images/planets/${planet.nameEn}.png" class="planet-img" onerror="this.outerHTML='<div class=\\'planet-placeholder\\'>無圖片</div>';">`;
    
    card.innerHTML = `
      ${imgHtml}
      <div class="card-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; box-sizing: border-box; padding: 0 10px;">${planet.nameTc}</div>
      <div class="card-subtitle" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; box-sizing: border-box; padding: 0 10px;">${planet.nameEn}</div>
      <div class="card-subtitle" style="color: #10b981; margin-top: 15px;">${planet.nodes ? planet.nodes.length : 0} 個節點</div>
    `;
    
    card.onclick = () => openPlanetDetail(planet);
    grid.appendChild(card);
  });

  if (currentView === 'normal') {
      const rjCard = document.createElement('div');
      rjCard.className = 'card empyrean-card';
      rjCard.innerHTML = `
        <img src="images/planets/Empyrean.png" class="planet-img" onerror="this.outerHTML='<div class=\\'planet-placeholder\\'>無圖片</div>';">
        <div class="card-title">九重天</div>
        <div class="card-subtitle">Empyrean</div>
        <div class="card-subtitle" style="color: #38bdf8; margin-top: 15px; font-weight:bold;">點擊進入銳捷號星圖</div>
      `;
      
      rjCard.onclick = () => {
          currentView = 'proxima';
          
          const backBtn = document.getElementById('backBtn');
          const subTitle = document.getElementById('sub-title');
          const searchInput = document.getElementById('starSearch');

          if (backBtn) backBtn.innerHTML = '&#8592; 返回一般星圖';
          if (subTitle) subTitle.innerText = '九重天 (銳捷號星圖)';
          if (searchInput) searchInput.value = '';
          
          // 直接把所有資料丟進去，守門員會自動濾出九重天
          renderGrid(planetData); 
      };
      grid.appendChild(rjCard);
  }
}

function openPlanetDetail(planet) {
  previousView = currentView;
  currentView = 'detail';
  
  const grid = document.getElementById('grid');
  const searchBoxContainer = document.getElementById('searchBoxContainer');
  const searchContainer = document.getElementById('search-container'); 
  const planetDetailView = document.getElementById('planet-detail-view');
  
  if (grid) grid.style.display = 'none';
  if (searchBoxContainer) searchBoxContainer.style.display = 'none';
  if (searchContainer) searchContainer.style.display = 'none';
  if (planetDetailView) planetDetailView.style.display = 'block';

  const backBtn = document.getElementById('backBtn');
  const subTitle = document.getElementById('sub-title');
  if (backBtn) backBtn.innerHTML = previousView === 'normal' ? '&#8592; 返回一般星圖' : '&#8592; 返回銳捷號星圖';
  if (subTitle) subTitle.innerText = '星域詳細資訊';

  const detailImg = document.getElementById('detail-img');
  if (detailImg) {
    detailImg.src = `images/planets/${planet.nameEn}.png`; 
    detailImg.style.display = 'block';
  }

  const nameTcEl = document.getElementById('detail-name-tc');
  const nameEnEl = document.getElementById('detail-name-en');
  if (nameTcEl) nameTcEl.innerText = planet.nameTc;
  if (nameEnEl) nameEnEl.innerText = planet.nameEn;

  const dropsContainer = document.getElementById('detail-drops');
  if (dropsContainer) {
    dropsContainer.innerHTML = '';
    if (planet.drops && planet.drops.length > 0) {
      planet.drops.forEach(dropName => {
        dropsContainer.innerHTML += `<div class="drop-item">${dropName}</div>`;
      });
    } else {
      dropsContainer.innerHTML = `<div style="color: #a0aec0; font-style: italic;">本星域無常規資源紀錄。</div>`;
    }
  }
  
  const nodesContainer = document.getElementById('detail-nodes');
  if (!nodesContainer) return; 

  nodesContainer.innerHTML = '';
  
  const NODE_BGS = {
    "希圖斯": "Cetus.png",
    "夜靈平野": "Plains of Eidolon.png", 
    "福爾圖娜": "Fortuna.png",
    "奧布山谷": "Orb Vallis.png",        
    "魔裔禁地": "Cambion Drift.png",
    "亡骸殿": "Necralisk.png",
    "蛹巖": "Chrysalith.png",
    "鋼鐵守望": "Iron Wake.png",
    "解剖聖堂": "Sanctum Anatomica.png",
    "寢區": "Dormizone.png",
    "霍爾瓦尼亞中央購物中心": "Hollvania.png"
  };

  const nodes = planet.nodes || [];
  const nodeCountEl = document.getElementById('detail-node-count');
  if (nodeCountEl) nodeCountEl.innerText = nodes.length;

  nodes.sort((a, b) => {
    const safeNameA = (a.nameTc || a.nameEn || '').trim();
    const safeNameB = (b.nameTc || b.nameEn || '').trim();

    const getPriority = (node, name) => {
      if (NODE_BGS[name]) return 1; 
      if (name.includes('接合點') || (node.typeTc && node.typeTc.includes('接合點'))) return 3; 
      return 2; 
    };

    const priorityA = getPriority(a, safeNameA);
    const priorityB = getPriority(b, safeNameB);

    if (priorityA !== priorityB) return priorityA - priorityB;

    const getLevel = (node) => {
      if (!node.levels || node.levels.normal === "和平區域") return 0;
      const match = node.levels.normal.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 999;
    };

    const lvlA = getLevel(a);
    const lvlB = getLevel(b);

    if (lvlA !== lvlB) return lvlA - lvlB;

    return safeNameA.localeCompare(safeNameB);

  }).forEach(node => {
    
    const isPeaceful = node.levels && node.levels.normal === "和平區域";

    const typeBadgeHtml = isPeaceful 
      ? "" 
      : `<span class="node-type">${node.typeTc || node.type}</span>`;
      
    const levelTextHtml = isPeaceful 
      ? "" 
      : `<span style="color: #a0aec0; font-size: 0.9em; float: right;">等級: ${node.levels ? node.levels.normal : '未知'}</span>`;

    let bgStyle = "";
    const safeNameTc = (node.nameTc || '').trim();
    const bgFileName = NODE_BGS[safeNameTc]; 

    if (bgFileName) {
      bgStyle = `
        background-image: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7)), url('images/nodes/${bgFileName}'); 
        background-size: cover; 
        background-position: center; 
        color: white; 
        border-color: rgba(255, 255, 255, 0.3);
      `;
    }

    nodesContainer.innerHTML += `
      <div class="node-card" data-id="${node.id}" style="${bgStyle}">
        <div class="node-name">
          <span>${node.nameTc || node.nameEn}</span>
          ${typeBadgeHtml}
        </div>
        <div class="node-faction">
          <span style="color: #ef4444;">派系：${node.faction}</span>
          ${levelTextHtml}
        </div>
      </div>
    `;
  });
}

function applyStarChartFilters() {
  // 🌟 已修正為 starSearch
  const searchInput = document.getElementById('starSearch');
  const term = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const activeArray = currentView === 'normal' ? normalPlanetsArray : proximaPlanetsArray;

  const filtered = activeArray.filter(planet => {
    if (planet.nameEn.toLowerCase().includes(term) || (planet.nameTc && planet.nameTc.toLowerCase().includes(term))) return true;
    return (planet.nodes || []).some(node => 
      (node.nameTc && node.nameTc.toLowerCase().includes(term)) || 
      (node.nameEn && node.nameEn.toLowerCase().includes(term)) ||
      (node.type && node.type.toLowerCase().includes(term)) || 
      (node.faction && node.faction.toLowerCase().includes(term))
    );
  });
  renderGrid(filtered);
}

// 🌟 已修正為 starSearch
// 🌟 已修正為 starSearch
const searchInput = document.getElementById('starSearch');
const suggestionsBox = document.getElementById('suggestionsBox');

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    applyStarChartFilters(); 

    if (!suggestionsBox) return;

    if (!term) {
      suggestionsBox.style.display = 'none';
      searchInput.style.borderRadius = '25px';
      return;
    }

    const activeArray = currentView === 'normal' ? normalPlanetsArray : proximaPlanetsArray;
    
    // 🌟 改變作法：用 Map 記錄「節點名稱」對應的「星球資料」
    const matchedNodesMap = new Map(); 
    const matchedPlanets = [];

    activeArray.forEach(planet => {
      const safePlanetEn = (planet.nameEn || '').toLowerCase();
      const safePlanetTc = (planet.nameTc || '').toLowerCase();

      if (safePlanetEn.includes(term) || safePlanetTc.includes(term)) {
        matchedPlanets.push(planet);
      }

      (planet.nodes || []).forEach(node => {
        const safeNodeTc = (node.nameTc || '').toLowerCase();
        const safeNodeEn = (node.nameEn || '').toLowerCase();
        if (safeNodeTc.includes(term) || safeNodeEn.includes(term)) {
          const nodeName = node.nameTc || node.nameEn;
          // 把節點名稱當作 Key，這顆星球的完整資料當作 Value 存起來
          if (!matchedNodesMap.has(nodeName)) {
            matchedNodesMap.set(nodeName, planet);
          }
        }
      });
    });

    // 格式化資料
    let nodeSuggestions = Array.from(matchedNodesMap.entries()).map(([nodeName, planetData]) => ({
      type: 'node',
      title: nodeName,
      // 🌟 貼心小優化：右邊的灰色小字會提示這個節點在哪顆星球
      subTitle: `節點 (${planetData.nameTc || planetData.nameEn})`, 
      originalData: planetData // 🌟 把星球資料帶上！
    }));

    let planetSuggestions = matchedPlanets.map(p => ({
      type: 'planet',
      title: p.nameTc || p.nameEn,
      subTitle: '星域',
      originalData: p
    }));

    nodeSuggestions = nodeSuggestions.slice(0, 5);
    planetSuggestions = planetSuggestions.slice(0, 5);

    const finalMatches = [...nodeSuggestions, ...planetSuggestions];

    if (finalMatches.length === 0) {
      suggestionsBox.style.display = 'none';
      searchInput.style.borderRadius = '25px';
      return;
    }

    suggestionsBox.innerHTML = '';
    finalMatches.forEach(match => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';

      item.innerHTML = `
        <strong style="color: #ffdf73; letter-spacing: 1px;">${match.title}</strong>
        <span style="color: #a0aec0; font-size: 0.85em;">${match.subTitle}</span>
      `;

      item.onclick = () => {
        searchInput.value = match.title;
        suggestionsBox.style.display = 'none';
        searchInput.style.borderRadius = '25px';

        // 🌟 關鍵修改：現在不管是點「節點」還是點「星域」，通通直接跳轉進去該星球的詳細頁面！
        openPlanetDetail(match.originalData);
      };

      suggestionsBox.appendChild(item);
    });

    suggestionsBox.style.display = 'block';
    searchInput.style.borderRadius = '15px 15px 0 0';
  });
}

// 執行初始化
init();