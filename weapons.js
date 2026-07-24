const URL_WEAPONS_INDEX = 'data/weaponsIndex.json';

let allWeapons = [];
let currentView = 'normal';
let currentCategory = 'All';

// 🌟 初始化讀取資料庫
async function init() {
  try {
    const response = await fetch(URL_WEAPONS_INDEX);
    if (!response.ok) throw new Error('無法載入武器資料庫');
    allWeapons = await response.json();

    // 依照英文名字排序
    allWeapons.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
    
    setupFilters();
    applyFilters();
  } catch (err) {
    console.error(err);
    document.getElementById('grid').innerHTML = '<div style="color: #ef4444; text-align: center; grid-column: 1/-1;">資料載入失敗，請確認 data/weaponsIndex.json 是否存在。</div>';
  }
}

// 🌟 設定分類按鈕事件
function setupFilters() {
  const categoryBtns = document.querySelectorAll('.primary-filters .filter-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.getAttribute('data-category');
      applyFilters();
    });
  });
}

// 🌟 主畫面過濾器
function applyFilters() {
  const searchInput = document.getElementById('weaponSearch');
  const term = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filtered = allWeapons.filter(w => {
    // 1. 分類過濾
    const matchCategory = (currentCategory === 'All') || (w.category === currentCategory);
    if (!matchCategory) return false;

    // 2. 關鍵字過濾 (名稱、英文名、武器類型)
    if (!term) return true;
    
    const safeTc = (w.nameTc || '').toLowerCase();
    const safeEn = (w.nameEn || '').toLowerCase();
    const safeType = (w.type || '').toLowerCase();

    return safeTc.includes(term) || safeEn.includes(term) || safeType.includes(term);
  });

  renderGrid(filtered);
}

// 🌟 渲染武器卡片
function renderGrid(weaponsToRender) {
  const grid = document.getElementById('grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (weaponsToRender.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #a0aec0;">找不到符合條件的武器。</div>';
    return;
  }

  weaponsToRender.forEach(w => {
    const card = document.createElement('div');
    card.className = 'card';

    // 依照大分類設定主題色
    let themeColor = '#94a3b8';
    if (w.category === '主武器') themeColor = '#38bdf8';
    else if (w.category === '次要武器') themeColor = '#10b981';
    else if (w.category === '近戰武器') themeColor = '#fbbf24';

    // 處理圖片名稱防呆 (把空白換成底線等)
    const safeImgName = w.nameEn.replace(/ /g, '_');

    card.innerHTML = `
      <!-- 卡片正面 -->
      <div class="card-front">
        <img src="https://cdn.warframestat.us/img/${w.imageName}" alt="${w.nameEn}" class="weapon-img" onerror="this.onerror=null; this.style.display='none';">
        <div class="card-title" style="color: ${themeColor}; margin-top: 10px;">${w.nameTc}</div>
        <div class="card-subtitle" style="font-size: 0.85em; color: #64748b;">${w.nameEn}</div>
      </div>

      <!-- 懸停資訊層 -->
      <div class="card-info-overlay">
        <div style="color: #fff; font-size: 1.1em; letter-spacing: 2px; margin-bottom: 15px; border-bottom: 1px solid ${themeColor}55; padding-bottom: 5px;">
          ${w.category}
        </div>
        <div style="color: #cbd5e1; margin-bottom: 8px;">類型：<span style="color: #fff;">${w.type}</span></div>
        <div style="color: #cbd5e1;">段位限制：<span style="color: #fbbf24; font-weight: bold;">專精 ${w.mr} 段</span></div>
      </div>
    `;

    card.onclick = () => openWeaponDetail(w, themeColor);
    grid.appendChild(card);
  });
}

// 🌟 展開詳細頁面
// 🌟 展開詳細頁面 (戰甲風格版)
function openWeaponDetail(w, themeColor) {
  currentView = 'detail';
  
  const grid = document.getElementById('grid');
  const controls = document.getElementById('controlsArea');
  const detailView = document.getElementById('weapon-detail-view');
  const backBtn = document.getElementById('backBtn');
  
  if (grid) grid.style.display = 'none';
  if (controls) controls.style.display = 'none';
  if (detailView) detailView.style.display = 'block';
  
  if (backBtn) backBtn.innerHTML = '&#8592; 返回軍械庫';

  // 1. 圖片
  document.getElementById('detail-weapon-img').src = `https://cdn.warframestat.us/img/${w.imageName}`;
  document.getElementById('detail-weapon-img').style.display = 'block';

  // 2. 標題與漸層色魔法 (套用武器的主題色)
  const titleTc = document.getElementById('detail-weapon-title-tc');
  titleTc.innerText = w.nameTc;
  // 給標題加上漂亮的漸層，從白色漸層到武器主題色 (藍/綠/金)
  titleTc.style.background = `linear-gradient(to bottom, #ffffff 0%, ${themeColor} 100%)`;
  titleTc.style.webkitBackgroundClip = 'text';
  titleTc.style.webkitTextFillColor = 'transparent';
  titleTc.style.filter = `drop-shadow(0 0 8px ${themeColor}44)`;

  document.getElementById('detail-weapon-title-en').innerText = w.nameEn;
  document.getElementById('detail-weapon-desc').innerText = w.description || '無描述資料。';
  
  // 3. 徽章設定 (加上主題色的邊框)
  const typeBadge = document.getElementById('detail-weapon-type');
  typeBadge.innerText = w.type;
  typeBadge.style.color = themeColor;
  typeBadge.style.borderLeft = `2px solid ${themeColor}`;
  typeBadge.style.borderRight = `2px solid ${themeColor}`;

  const mrBadge = document.getElementById('detail-weapon-mr');
  mrBadge.innerText = `專精 ${w.mr} 段`;
  mrBadge.style.color = themeColor;
  mrBadge.style.borderLeft = `2px solid ${themeColor}`;
  mrBadge.style.borderRight = `2px solid ${themeColor}`;

  // 4. 動態生成高質感的數值方塊 (stat-card)
  const statsGrid = document.getElementById('detail-stats-grid');
  
  // 根據武器類型改變小標題的顏色
  document.getElementById('detail-stats-title').style.borderLeft = `3px solid ${themeColor}`;

  statsGrid.innerHTML = `
    <div class="stat-card" style="border-left-color: ${themeColor}88;" onmouseover="this.style.borderLeftColor='${themeColor}'; this.style.backgroundColor='${themeColor}11'" onmouseout="this.style.borderLeftColor='${themeColor}88'; this.style.backgroundColor='rgba(255,255,255,0.02)'">
      <div class="stat-title">暴擊機率</div>
      <div class="stat-value">${w.stats.critChance}%</div>
    </div>
    <div class="stat-card" style="border-left-color: ${themeColor}88;" onmouseover="this.style.borderLeftColor='${themeColor}'; this.style.backgroundColor='${themeColor}11'" onmouseout="this.style.borderLeftColor='${themeColor}88'; this.style.backgroundColor='rgba(255,255,255,0.02)'">
      <div class="stat-title">暴擊倍率</div>
      <div class="stat-value">${w.stats.critMultiplier}x</div>
    </div>
    <div class="stat-card" style="border-left-color: ${themeColor}88;" onmouseover="this.style.borderLeftColor='${themeColor}'; this.style.backgroundColor='${themeColor}11'" onmouseout="this.style.borderLeftColor='${themeColor}88'; this.style.backgroundColor='rgba(255,255,255,0.02)'">
      <div class="stat-title">觸發機率</div>
      <div class="stat-value">${w.stats.statusChance}%</div>
    </div>
    <div class="stat-card" style="border-left-color: ${themeColor}88;" onmouseover="this.style.borderLeftColor='${themeColor}'; this.style.backgroundColor='${themeColor}11'" onmouseout="this.style.borderLeftColor='${themeColor}88'; this.style.backgroundColor='rgba(255,255,255,0.02)'">
      <div class="stat-title">總傷害</div>
      <div class="stat-value">${w.stats.totalDamage}</div>
    </div>
  `;
}

// 🌟 處理返回邏輯與清空搜尋
function handleBack() {
  if (currentView === 'detail') {
    currentView = 'normal';
    
    const searchInput = document.getElementById('weaponSearch');
    if (searchInput) searchInput.value = '';

    const grid = document.getElementById('grid');
    const controls = document.getElementById('controlsArea');
    const detailView = document.getElementById('weapon-detail-view');
    const backBtn = document.getElementById('backBtn');
    
    if (detailView) detailView.style.display = 'none';
    if (grid) grid.style.display = 'grid';
    if (controls) controls.style.display = 'block';
    if (backBtn) backBtn.innerHTML = '&#8592; 返回樞紐';

    applyFilters();
  } else {
    window.location.href = 'index.html'; 
  }
}

// 🌟 智慧下拉選單
const searchInput = document.getElementById('weaponSearch');
const suggestionsBox = document.getElementById('suggestionsBox');

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    applyFilters();

    if (!suggestionsBox) return;
    if (!term) {
      suggestionsBox.style.display = 'none';
      searchInput.style.borderRadius = '25px';
      return;
    }

    // 在符合當前大分類的武器中搜尋
    let matches = allWeapons.filter(w => {
      const matchCategory = (currentCategory === 'All') || (w.category === currentCategory);
      if (!matchCategory) return false;

      const safeTc = (w.nameTc || '').toLowerCase();
      const safeEn = (w.nameEn || '').toLowerCase();
      const safeType = (w.type || '').toLowerCase();

      return safeTc.includes(term) || safeEn.includes(term) || safeType.includes(term);
    });

    matches = matches.slice(0, 5);

    if (matches.length === 0) {
      suggestionsBox.style.display = 'none';
      searchInput.style.borderRadius = '25px';
      return;
    }

    suggestionsBox.innerHTML = '';
    matches.forEach(w => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';

      let themeColor = '#94a3b8';
      if (w.category === '主武器') themeColor = '#38bdf8';
      else if (w.category === '次要武器') themeColor = '#10b981';
      else if (w.category === '近戰武器') themeColor = '#fbbf24';

      item.innerHTML = `
        <strong style="color: #ffdf73; letter-spacing: 1px;">${w.nameTc}</strong>
        <span style="color: ${themeColor}; font-size: 0.85em;">${w.type}</span>
      `;

      item.onclick = () => {
        searchInput.value = ''; // 直接跳轉，所以清空
        suggestionsBox.style.display = 'none';
        searchInput.style.borderRadius = '25px';
        openWeaponDetail(w, themeColor);
      };

      suggestionsBox.appendChild(item);
    });

    suggestionsBox.style.display = 'block';
    searchInput.style.borderRadius = '15px 15px 0 0';
  });
}

// 🌟 點擊空白處自動收起搜尋選單
document.addEventListener('click', (e) => {
  const searchContainer = document.querySelector('.search-container');
  const suggestionsBox = document.getElementById('suggestionsBox');
  const searchInput = document.querySelector('.search-input'); // 抓取輸入框以恢復圓角

  // 如果點擊的目標不在搜尋區塊內，且選單是打開的，就關閉它
  if (searchContainer && suggestionsBox && !searchContainer.contains(e.target)) {
    suggestionsBox.style.display = 'none';
    if (searchInput) {
      searchInput.style.borderRadius = '25px'; // 恢復原本的膠囊圓角
    }
  }
});

// 執行
init();