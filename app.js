// 1. 直連 wfcd 原始資料庫與 i18n 多國語言包
const URL_WARFRAMES = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/Warframes.json';
const URL_I18N = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/i18n.json';

document.getElementById('loader').innerText = '正在下載底層數據庫與 i18n 多國語言包...';

Promise.all([
  fetch(URL_WARFRAMES).then(res => res.json()),
  fetch(URL_I18N).then(res => res.json())
])
.then(([rawData, i18nData]) => {
  document.getElementById('loader').style.display = 'none';

  const nodes = [];
  const links = [];
  const nodeSet = new Set();

  // 🌟 1. 建立名稱反查字典 (Name -> i18nEntry)
  const i18nNameMap = {};
  Object.keys(i18nData).forEach(key => {
    const entry = i18nData[key];
    if (entry.en && entry.en.name) {
      i18nNameMap[entry.en.name.toLowerCase()] = entry;
    }
  });

  // 🌟 2. 獨立封裝：多層級 i18n 解析器
  function resolveI18n(comp) {
    // 優先順序：Recipe ID -> Item ID -> 英文名稱反查
    let match = i18nData[comp.uniqueName];
    
    if (!match && comp.itemUniqueName) {
      match = i18nData[comp.itemUniqueName];
    }
    
    if (!match && comp.name) {
      match = i18nNameMap[comp.name.toLowerCase()];
    }

    const tc = (match && (match.tc || match['zh-hant'])) || {};
    const sc = (match && (match.zh || match['zh-hans'])) || {};

    return { tc, sc };
  }

  const warframes = rawData.filter(item => item.category === 'Warframes' && !item.name.includes('Specter'));

  warframes.forEach(wf => {
    // 處理主戰甲
    const wfI18n = resolveI18n(wf);
    const finalName = wfI18n.tc.name || wfI18n.sc.name || wf.name;
    const finalDesc = wfI18n.tc.description || wfI18n.sc.description || wf.description;
    const searchKeywords = `${finalName} ${wfI18n.sc.name || ''} ${wf.name}`.toLowerCase();

    // A. 建立「主戰甲」節點
    if (!nodeSet.has(wf.uniqueName)) {
      nodes.push({
        id: wf.uniqueName,
        name: finalName,
        searchKeywords: searchKeywords,
        type: 'warframe',
        mr: wf.masteryReq || 0,
        description: finalDesc,
        stats: `血量: ${wf.health} | 護甲: ${wf.armor} | 護盾: ${wf.shield}`,
        size: wf.name.includes('Prime') ? 9 : 7, 
        color: wf.name.includes('Prime') ? '#f59e0b' : '#38bdf8' 
      });
      nodeSet.add(wf.uniqueName);
    }

    // B. 建立「部件」節點
    if (wf.components && wf.components.length > 0) {
      wf.components.forEach(comp => {
        if (comp.name === wf.name) return; 

        const compId = wf.uniqueName + '_' + comp.name;

        // 🌟 3. 呼叫解析器，自動搞定複雜的三層結構查找
        const compI18n = resolveI18n(comp);
        
        let finalCompName = compI18n.tc.name || compI18n.sc.name || comp.name;
        
        // 防呆機制：如果遇到官方真的連中文都沒給的漏網之魚（例如特殊 Prime 藍圖）
        if (finalCompName === comp.name) {
          finalCompName = finalCompName
            .replace(/Neuroptics/ig, '頭部神經光元')
            .replace(/Chassis/ig, '機體')
            .replace(/Systems/ig, '系統')
            .replace(/Blueprint/ig, '藍圖');
        }

        // 處理描述：藍圖繼承戰甲，無描述則給預設
        let finalCompDesc = compI18n.tc.description || compI18n.sc.description;
        if (!finalCompDesc) {
          if (comp.description === wf.description) {
            finalCompDesc = finalDesc; 
          } else {
            finalCompDesc = '戰甲製造所需的核心組件。';
          }
        }

        const compSearchKeywords = `${finalCompName} ${compI18n.sc.name || ''} ${comp.name}`.toLowerCase();

        if (!nodeSet.has(compId)) {
          nodes.push({
            id: compId,
            name: finalCompName,
            searchKeywords: compSearchKeywords,
            type: 'component',
            description: finalCompDesc,
            size: 4,
            color: '#e2e8f0'
          });
          nodeSet.add(compId);
        }

        links.push({
          source: wf.uniqueName,
          target: compId,
          distance: 30 
        });
      });
    }
  });

  // ========== UI 與圖表邏輯 ==========

  function focusAndShowPanel(node) {
    Graph.centerAt(node.x, node.y, 1000);
    Graph.zoom(3.5, 1000);

    document.getElementById('item-name').innerText = node.name;
    document.getElementById('item-unique').innerText = node.id.split('_')[0]; 
    
    const isPrime = node.id.includes('Prime');

    if (node.type === 'warframe') {
      document.getElementById('item-type').innerText = isPrime ? 'Prime 戰甲' : '普版戰甲';
      document.getElementById('item-mr').innerText = node.mr + ' 段';
      document.getElementById('item-stats').innerText = node.stats;
      document.getElementById('item-desc').innerText = node.description || '暫無簡介';
      document.getElementById('info-panel').style.borderTopColor = isPrime ? '#f59e0b' : '#38bdf8';
    } else {
      document.getElementById('item-type').innerText = '製造材料 / 部件';
      document.getElementById('item-mr').innerText = '無限制';
      document.getElementById('item-stats').innerText = 'N/A';
      document.getElementById('item-desc').innerText = node.description;
      document.getElementById('info-panel').style.borderTopColor = '#e2e8f0';
    }
    document.getElementById('info-panel').style.display = 'block';
  }

  const Graph = ForceGraph()(document.getElementById('graph'))
    .graphData({ nodes, links })
    .nodeId('id')
    .nodeLabel('name')
    .nodeColor(node => node.color)
    .linkWidth(1)
    .linkColor(() => 'rgba(255, 255, 255, 0.08)')
    .onNodeClick(node => focusAndShowPanel(node))
    .nodeCanvasObject((node, ctx, globalScale) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.color;
      ctx.fill();

      if (globalScale > 1.2) {
        const label = node.name;
        const fontSize = node.type === 'warframe' ? 12 / globalScale : 9 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.fillStyle = node.type === 'warframe' ? '#fff' : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(label, node.x, node.y - node.size - 4);
      }
    });

  Graph.d3Force('charge').strength(-80);

  // ========== 搜尋引擎 ==========
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  let currentTopMatch = null; 

  searchInput.addEventListener('input', e => {
    const value = e.target.value.toLowerCase().trim();
    searchResults.innerHTML = ''; 
    currentTopMatch = null;
    
    if (!value) {
      searchResults.style.display = 'none';
      return;
    }

    const matchedNodes = nodes
      .filter(n => n.searchKeywords.includes(value))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))
      .slice(0, 5);

    if (matchedNodes.length > 0) {
      searchResults.style.display = 'flex';
      currentTopMatch = matchedNodes[0]; 

      matchedNodes.forEach(node => {
        const div = document.createElement('div');
        div.className = 'search-item';
        const typeLabel = node.type === 'warframe' ? '[戰甲]' : '[部件]';
        div.innerText = `${typeLabel} ${node.name}`; 
        
        div.addEventListener('click', () => {
          focusAndShowPanel(node); 
          searchResults.style.display = 'none'; 
          searchInput.value = ''; 
        });
        
        searchResults.appendChild(div);
      });
    } else {
      searchResults.style.display = 'none';
    }
  });

  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && currentTopMatch) {
      focusAndShowPanel(currentTopMatch);
      searchResults.style.display = 'none'; 
      searchInput.value = ''; 
      searchInput.blur(); 
    }
  });

})
.catch(err => {
  document.getElementById('loader').innerText = '資源庫讀取失敗，請檢查網路。';
  console.error(err);
});