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

  const warframes = rawData.filter(item => item.category === 'Warframes' && !item.name.includes('Specter'));

  warframes.forEach(wf => {
    // 🌟 正確的 i18n 讀取邏輯：先找物品 ID，再找語言 tc
    const wfI18n = i18nData[wf.uniqueName] || {};
    const tcInfo = wfI18n.tc || wfI18n['zh-hant'] || {};
    const scInfo = wfI18n.zh || wfI18n['zh-hans'] || {};
    
    // 優先用正中，沒有才用簡中，再沒有用英文
    const finalName = tcInfo.name || scInfo.name || wf.name;
    const finalDesc = tcInfo.description || scInfo.description || wf.description;
    const searchKeywords = `${finalName} ${scInfo.name || ''} ${wf.name}`.toLowerCase();

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

        // 🌟 直接拿部件專屬的 uniqueName 去 i18n 裡面找官方翻譯
        const compI18n = i18nData[comp.uniqueName] || {};
        const compTc = compI18n.tc || compI18n['zh-hant'] || {};
        const compSc = compI18n.zh || compI18n['zh-hans'] || {};
        
        const finalCompName = compTc.name || compSc.name || comp.name;
        const finalCompDesc = compTc.description || compSc.description || comp.description || '戰甲製造所需的核心組件。';
        const compSearchKeywords = `${finalCompName} ${compSc.name || ''} ${comp.name}`.toLowerCase();

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
