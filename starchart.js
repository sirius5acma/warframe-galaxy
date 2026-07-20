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
    // 🌟 1. 拋棄遠端連線，直接讀取本地算好的極輕量化 Index
    const response = await fetch(URL_PLANET_INDEX);
    if (!response.ok) throw new Error('無法載入星球資料，請確認 data 資料夾是否存在。');
    const planetData = await response.json();

    document.getElementById('loader').style.display = 'none';

    // 🌟 2. 輕鬆將處理好的星球分類
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

    // 排序邏輯保持不變
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

    // 初始渲染
    renderGrid(normalPlanetsArray);

  } catch (err) {
    console.error(err);
    document.getElementById('loader').innerText = '載入失敗，請檢查檔案路徑。';
  }
}

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

  // 🌟 3. 常規資源現在已經內建在星球資料裡，直接拿來用
  const dropsContainer = document.getElementById('detail-drops');
  dropsContainer.innerHTML = '';
  
  if (planet.drops && planet.drops.length > 0) {
    planet.drops.forEach(dropName => {
      dropsContainer.innerHTML += `<div class="drop-item">${dropName}</div>`;
    });
  } else {
    dropsContainer.innerHTML = `<div style="color: #a0aec0; font-style: italic;">本星域無常規資源紀錄。</div>`;
  }
  
  // 🌟 4. 渲染節點：現在自帶怪物等級與唯一 ID！
  const nodesContainer = document.getElementById('detail-nodes');
  nodesContainer.innerHTML = '';
  
  planet.nodes.sort((a, b) => a.nameTc.localeCompare(b.nameTc)).forEach(node => {
    nodesContainer.innerHTML += `
      <div class="node-card" data-id="${node.id}">
        <div class="node-name">
          <span>${node.nameTc}</span>
          <!-- 加上 translateUI 處理任務類型 -->
          <span class="node-type">${translateUI(node.type)}</span>
        </div>
        <div class="node-faction">
          <!-- 加上 translateUI 處理派系 -->
          <span style="color: #ef4444;">派系：${translateUI(node.faction)}</span>
          <!-- 這裡會正確顯示腳本抓到的怪物等級 -->
          <span style="color: #a0aec0; font-size: 0.9em; float: right;">等級: ${node.levels.normal}</span>
        </div>
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
      node.nameTc.toLowerCase().includes(term) || 
      node.nameEn.toLowerCase().includes(term) ||
      node.type.toLowerCase().includes(term) || 
      node.faction.toLowerCase().includes(term)
    );
  });
  renderGrid(filtered);
});

// 執行初始化
init();