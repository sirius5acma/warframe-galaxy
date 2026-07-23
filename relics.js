// 🌟 確保這兩個變數在最外層（全局變數），這樣 handleBack 才讀得到！
let allRelics = [];
let currentView = 'normal'; 

async function init() {
  try {
    const response = await fetch(`data/relicIndex.json?v=${new Date().getTime()}`);
    if (!response.ok) throw new Error('無法載入遺物資料');
    
    let rawData = await response.json();
    
    const validEras = ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem'];
    allRelics = rawData.filter(r => validEras.includes(r.eraEn));
    
    renderRelics(allRelics);
    setupFilters();
  } catch (err) {
    console.error(err);
    const grid = document.getElementById('grid');
    if (grid) grid.innerHTML = '<div style="color:red; text-align:center; grid-column:1/-1;">資料載入失敗，請檢查 data/relicIndex.json 是否存在。</div>';
  }
}

function renderRelics(relicsToRender) {
  const grid = document.getElementById('grid');
  if (!grid) return;
  grid.innerHTML = '';
  
  if (relicsToRender.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #a0aec0;">找不到符合條件的遺物。</div>';
    return;
  }

  relicsToRender.forEach(relic => {
    const card = document.createElement('div');
    card.className = 'card'; 
    
    let eraColor;
    switch(relic.eraEn) {
      case 'Lith': eraColor = '#f3e2c9'; break;
      case 'Meso': eraColor = '#44eeb2'; break;
      case 'Neo':  eraColor = '#c1d6ba'; break;
      case 'Axi':  eraColor = '#fbbf24'; break;
      case 'Requiem': eraColor = '#ef4444'; break;
      default: eraColor = '#94a3b8';
    }

    const statusColor = relic.status === '入庫' ? '#64748b' : '#10b981';
    
    card.innerHTML = `
      <img src="images/relics/${relic.eraEn}.png" 
           alt="${relic.eraEn} ${relic.name}" 
           class="relic-img" 
           style="filter: drop-shadow(0 0 15px ${eraColor}88);"
           onerror="this.onerror=null; this.style.display='none';">
           
      <div class="card-title" style="color: ${eraColor}; margin-top: 5px;">
        ${relic.era} ${relic.name}
      </div>
      <div class="card-subtitle">
        ${relic.era}遺物
      </div>
      <div style="margin-top: 15px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 12px; width: 100%;">
        <span style="background: rgba(12, 14, 18, 0.8); padding: 4px 12px; border-radius: 12px; font-size: 12px; color: ${statusColor}; border: 1px solid ${statusColor}55;">
          ${relic.status}
        </span>
      </div>
    `;
    
    // 🌟 點擊卡片時，呼叫展開詳細資訊的函數
    card.onclick = () => openRelicDetail(relic, eraColor, statusColor);
    grid.appendChild(card);
  });
}

function setupFilters() {
  const searchInput = document.getElementById('relicSearch');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const statusBtns = document.querySelectorAll('.status-btn'); 
  
  let currentEra = 'All';
  let currentStatus = 'All'; 

  function applyFilters() {
    const term = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let filtered = allRelics;

    if (currentEra !== 'All') {
      filtered = filtered.filter(r => r.eraEn === currentEra);
    }

    if (currentStatus !== 'All') {
      filtered = filtered.filter(r => r.status === currentStatus);
    }

    if (term) {
      filtered = filtered.filter(r => {
        // 1. 原本的核桃名稱與紀元搜尋
        const safeName = (r.name || '').toLowerCase();
        const safeEraEn = (r.eraEn || '').toLowerCase();
        const safeEra = (r.era || '').toLowerCase();
        const matchName = safeName.includes(term) || safeEraEn.includes(term) || safeEra.includes(term);

        // 2. 新增的掉落物搜尋 (利用 .some 檢查陣列裡有沒有符合的 Prime 零件)
        // 加上 (r.rewards || []) 是為了保護程式，萬一有核桃資料剛好沒有 rewards 屬性才不會報錯
        const matchDrop = (r.rewards || []).some(drop => {
            const safeItemName = (drop.itemName || '').toLowerCase();
            return safeItemName.includes(term);
        });

        // 3. 只要「名稱有中」或「掉落物有中」，這顆核桃就過關！
        return matchName || matchDrop;
      });
    }
    
    renderRelics(filtered);
  }

  // 🌟 加入下拉選單的邏輯
  // 🌟 進化版下拉選單邏輯
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      applyFilters(); // 每次打字都觸發畫面更新

      if (!suggestionsBox) return; 

      if (!term) {
        suggestionsBox.style.display = 'none';
        searchInput.style.borderRadius = '25px';
        return;
      }

      // 準備兩個陣列，一個裝「掉落物」，一個裝「核桃」
      const matchedRewards = new Set(); // 用 Set 可以避免掉落物重複出現
      const matchedRelics = [];

      // 遍歷所有核桃，找出符合的資料
      allRelics.forEach(r => {
        const safeName = (r.name || '').toLowerCase(); // 例如 "v1"
        const safeEraEn = (r.eraEn || '').toLowerCase(); // 例如 "lith"
        const safeEra = (r.era || '').toLowerCase(); // 例如 "古紀"
        const fullRelicName = `${safeEra} ${safeName}`; // 組合起來 "古紀 v1"

        // 1. 檢查「核桃本身」有沒有符合
        if (safeName.includes(term) || safeEraEn.includes(term) || safeEra.includes(term) || fullRelicName.includes(term)) {
            matchedRelics.push(r);
        }

        // 2. 檢查「掉落物」有沒有符合
        (r.rewards || []).forEach(drop => {
            const safeItemName = (drop.itemName || '').toLowerCase();
            if (safeItemName.includes(term)) {
                matchedRewards.add(drop.itemName); // 只要符合，就加入 Set (自動去重複)
            }
        });
      });

      // 把資料整理成選單要顯示的格式
      let rewardSuggestions = Array.from(matchedRewards).map(itemName => ({
          type: 'reward',
          title: itemName,
          subTitle: '掉落物'
      }));

      let relicSuggestions = matchedRelics.map(r => ({
          type: 'relic',
          title: `${r.era} ${r.name}`,
          subTitle: `${r.eraEn} 遺物`,
          originalData: r // 把原始資料存起來，等等點擊跳轉詳細頁面會用到
      }));

      // 限制顯示數量（例如掉落物最多顯示 5 個，核桃最多 5 個）
      rewardSuggestions = rewardSuggestions.slice(0, 5);
      relicSuggestions = relicSuggestions.slice(0, 5);
      
      // 合併清單 (掉落物排上面，核桃排下面)
      const finalMatches = [...rewardSuggestions, ...relicSuggestions];

      if (finalMatches.length === 0) {
        suggestionsBox.style.display = 'none';
        searchInput.style.borderRadius = '25px';
        return;
      }

      // 繪製選單
      suggestionsBox.innerHTML = '';
      finalMatches.forEach(match => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        
        // 如果是掉落物，右邊會顯示灰色的「掉落物」，如果是核桃，會顯示「Lith 遺物」
        item.innerHTML = `
          <strong style="color: #ffdf73; letter-spacing: 1px;">${match.title}</strong>
          <span style="color: #a0aec0; font-size: 0.85em;">${match.subTitle}</span>
        `;
        
        item.onclick = () => {
          if (match.type === 'reward') {
              // 情況 A：點擊「掉落物」
              // 填入搜尋框，觸發過濾，畫面會剩下有掉這個物品的核桃
              searchInput.value = match.title; 
              applyFilters(); 
              suggestionsBox.style.display = 'none';
              searchInput.style.borderRadius = '25px';
          } else {
              // 情況 B：點擊「核桃」
              // 收起選單，並直接「跳轉」展開該核桃的詳細頁面
              searchInput.value = match.title;
              suggestionsBox.style.display = 'none';
              searchInput.style.borderRadius = '25px';

              // 因為 openRelicDetail 需要顏色，我們幫它算一下
              const r = match.originalData;
              let eraColor;
              switch(r.eraEn) {
                case 'Lith': eraColor = '#f3e2c9'; break;
                case 'Meso': eraColor = '#44eeb2'; break;
                case 'Neo':  eraColor = '#c1d6ba'; break;
                case 'Axi':  eraColor = '#fbbf24'; break;
                case 'Requiem': eraColor = '#ef4444'; break;
                default: eraColor = '#94a3b8';
              }
              const statusColor = r.status === '入庫' ? '#64748b' : '#10b981';

              // 啟動詳細頁面！
              openRelicDetail(r, eraColor, statusColor);
          }
        };
        
        suggestionsBox.appendChild(item);
      });

      suggestionsBox.style.display = 'block';
      searchInput.style.borderRadius = '15px 15px 0 0';
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentEra = e.currentTarget.getAttribute('data-era'); 
      applyFilters();
    });
  });

  statusBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      statusBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentStatus = e.currentTarget.getAttribute('data-status'); 
      applyFilters();
    });
  });
}

// 🌟 安全切換：返回邏輯
function handleBack() {
  if (currentView === 'detail') {
    currentView = 'normal';
    
    // 👇 新增：先把搜尋框清空 👇
    const searchInput = document.getElementById('relicSearch');
    if (searchInput) {
        searchInput.value = ''; // 將輸入框的值設為空字串
    }
    // 👆 👆 👆

    // 安全地恢復顯示主清單
    const grid = document.getElementById('grid');
    const controls = document.getElementById('controlsArea');
    const detailView = document.getElementById('relic-detail-view');
    const backBtn = document.getElementById('backBtn');
    const subTitle = document.getElementById('sub-title');
    const allEraBtn = document.querySelector('.primary-filters .filter-btn'); 
    
    if (allEraBtn) {
        // 🌟 因為搜尋框已經被我們清空了，這裡點擊「全部」時，就會自動渲染出完整乾淨的列表！
        allEraBtn.click(); 
    }

    if (detailView) detailView.style.display = 'none';
    if (grid) grid.style.display = 'grid'; 
    if (controls) controls.style.display = ''; 
    
    if (backBtn) backBtn.innerHTML = '&#8592; 返回樞紐';
    if (subTitle) subTitle.innerText = '一般遺物';
  } else {
    window.location.href = 'index.html'; 
  }
}

// 🌟 安全切換：展開核桃詳細頁面
function openRelicDetail(relic, eraColor, statusColor) {
  currentView = 'detail';
  
  // 1. 安全地隱藏主畫面
  const grid = document.getElementById('grid');
  const controls = document.getElementById('controlsArea');
  const detailView = document.getElementById('relic-detail-view');
  const backBtn = document.getElementById('backBtn');
  const subTitle = document.getElementById('sub-title');
  
  if (grid) grid.style.display = 'none';
  if (controls) controls.style.display = 'none';
  if (detailView) detailView.style.display = 'block';
  
  // 2. 更新頂部導航
  if (backBtn) backBtn.innerHTML = '&#8592; 返回遺物清單';
  if (subTitle) subTitle.innerText = '遺物詳細資訊';
  
  // 3. 填入核桃基本資訊
  const titleEl = document.getElementById('detail-relic-title');
  if (titleEl) {
    titleEl.innerText = `${relic.era} ${relic.name}`;
    titleEl.style.color = eraColor;
  }
  
  const statusEl = document.getElementById('detail-relic-status');
  if (statusEl) {
    statusEl.innerText = relic.status;
    statusEl.style.color = statusColor;
    statusEl.style.border = `1px solid ${statusColor}55`;
    statusEl.style.backgroundColor = 'rgba(12, 14, 18, 0.8)';
  }

  const imgEl = document.getElementById('detail-relic-img');
  if (imgEl) {
    imgEl.src = `images/relics/${relic.eraEn}.png`;
    imgEl.style.filter = `drop-shadow(0 0 15px ${eraColor}aa)`;
  }

  // 4. 渲染內容物清單
  const rewardsContainer = document.getElementById('detail-rewards-list');
  if (!rewardsContainer) return; // 防呆
  
  rewardsContainer.innerHTML = '';

  if (relic.rewards && relic.rewards.length > 0) {
    // 按照機率由高到低排序 (銅 -> 銀 -> 金)
    const sortedRewards = [...relic.rewards].sort((a, b) => b.chance - a.chance);

    sortedRewards.forEach(drop => {
      let rarityColor = '#cd7f32'; 
      let rarityName = '常見';
      
      if (drop.chance <= 2) {
        rarityColor = '#fbbf24'; 
        rarityName = '稀有';
      } else if (drop.chance <= 11) {
        rarityColor = '#94a3b8'; 
        rarityName = '罕見';
      }

      rewardsContainer.innerHTML += `
        <div class="reward-item" style="border-left: 5px solid ${rarityColor};">
          <span class="reward-name" style="color: #f8fafc;">${drop.itemName}</span>
          <span class="reward-chance drop-rate-text" style="color: ${rarityColor};">${rarityName} (${drop.chance}%)</span>
        </div>
      `;
    });

    function showRelicDetail(relicData) {
    const intactBtn = document.querySelector('.refinement-group .filter-btn');

    if (intactBtn) {
        intactBtn.click(); // 模擬點擊「完整」，這樣機率就會自動填入，按鈕也會亮起來！
    }
}
  } else {
    rewardsContainer.innerHTML = '<div style="color: #a0aec0; padding: 10px;">無法取得內容物資料。</div>';
  }
}

// 定義四種精煉級別的固定機率
const dropRatesConfig = {
    intact: { common: 25.33, uncommon: 11, rare: 2 },
    exceptional: { common: 23.33, uncommon: 13, rare: 4 },
    flawless: { common: 20, uncommon: 17, rare: 6 },
    radiant: { common: 16.67, uncommon: 20, rare: 10 }
};

// 切換精煉狀態的主函式
function changeRefinement(level, clickedButton) {
    // 1. 切換外觀
    const buttons = document.querySelectorAll('.filter-btn'); 
    buttons.forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');

    // 2. 呼叫更新文字的函式
    updateDropRatesList(level);
}

// 更新機率數字的函式
function updateDropRatesList(level) {
    const rates = dropRatesConfig[level];
    const rateElements = document.querySelectorAll('.drop-rate-text');

    if (rateElements.length === 6) {
        rateElements[0].innerText = `常見 (${rates.common}%)`;
        rateElements[1].innerText = `常見 (${rates.common}%)`;
        rateElements[2].innerText = `常見 (${rates.common}%)`;
        rateElements[3].innerText = `罕見 (${rates.uncommon}%)`;
        rateElements[4].innerText = `罕見 (${rates.uncommon}%)`;
        rateElements[5].innerText = `稀有 (${rates.rare}%)`;
    } else {
        console.error("找不到機率標籤，請確認 HTML 是否有加上 drop-rate-text class");
    }
}

// 確保整個網頁的 HTML 都載入完畢後再執行
window.addEventListener('DOMContentLoaded', () => {
    // 假設你的「全部」按鈕是第一排篩選器的第一個按鈕
    // 請根據你實際的 class 替換（例如 .primary-filters）
    const allEraBtn = document.querySelector('.filter-row button'); 
    
    if (allEraBtn) {
        allEraBtn.click(); // 模擬點擊「全部」
    }
});

// 啟動程式
init();