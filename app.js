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

  // 🌟 終極殺招：全自動反向字典 (English -> TC / SC)
  const enToTcMap = {};
  const enToScMap = {};

  // 在一開始就把整個 i18n 掃過一遍，建立英文對應中文的翻譯網
  Object.values(i18nData).forEach(langs => {
    if (langs.en && langs.en.name) {
      const enName = langs.en.name.toLowerCase();
      if (langs.tc && langs.tc.name) enToTcMap[enName] = langs.tc.name;
      else if (langs['zh-hant'] && langs['zh-hant'].name) enToTcMap[enName] = langs['zh-hant'].name;

      if (langs.zh && langs.zh.name) enToScMap[enName] = langs.zh.name;
      else if (langs['zh-hans'] && langs['zh-hans'].name) enToScMap[enName] = langs['zh-hans'].name;
    }
  });

  const nodes = [];
  const links = [];
  const nodeSet = new Set();

  const warframes = rawData.filter(item => item.category === 'Warframes' && !item.name.includes('Specter'));

  warframes.forEach(wf => {
    const wfI18n = i18nData[wf.uniqueName] || {};
    const tcInfo = wfI18n.tc || wfI18n['zh-hant'] || {};
    const scInfo = wfI18n.zh || wfI18n['zh-hans'] || {};
    
    const finalWfName = tcInfo.name || scInfo.name || wf.name;
    const finalDesc = tcInfo.description || scInfo.description || wf.description;
    const searchKeywords = `${finalWfName} ${scInfo.name || ''} ${wf.name}`.toLowerCase();

    // A. 建立「主戰甲」節點
    if (!nodeSet.has(wf.uniqueName)) {
      nodes.push({
        id: wf.uniqueName,
        name: finalWfName,
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

        // 🌟 破解 DE 的 ID 迷宮：直接還原英文全名來反查！
        const exactEn = comp.name.toLowerCase(); // 例如："orokin cell"
        const fullEn = `${wf.name} ${comp.name}`.toLowerCase(); // 例如："volt chassis"

        let tcNameRaw = comp.name;
        let scNameRaw = comp.name;

        // 優先找全名 (Volt Chassis)，找不到再找單字 (Orokin Cell)，最後再用 ID 查
        if (enToTcMap[fullEn]) tcNameRaw = enToTcMap[fullEn];
        else if (enToTcMap[exactEn]) tcNameRaw = enToTcMap[exactEn];
        else {
          const compI18n = i18nData[comp.uniqueName] || {};
          if (compI18n.tc && compI18n.tc.name) tcNameRaw = compI18n.tc.name;
        }

        if (enToScMap[fullEn]) scNameRaw = enToScMap[fullEn];
        else if (enToScMap[exactEn]) scNameRaw = enToScMap[exactEn];
        else {
          const compI18n = i18nData[comp.uniqueName] || {};
          if (compI18n.zh && compI18n.zh.name) scNameRaw = compI18n.zh.name;
        }

        // 🌟 淨化名稱：把翻譯好的 "Limbo 頭部神經光元" 前面的 "Limbo " 拔掉，讓星圖保持乾淨
        const cleanTcName = tcNameRaw.replace(new RegExp(finalWfName, 'ig'), '').replace(new RegExp(wf.name, 'ig'), '').trim();
        const cleanScName = scNameRaw.replace(new RegExp(scInfo.name || finalWfName, 'ig'), '').replace(new RegExp(wf.name, 'ig'), '').trim();

        const compSearchKeywords = `${cleanTcName} ${cleanScName} ${comp.name}`.toLowerCase();

        if (!nodeSet.has(compId)) {
          nodes.push({
            id: compId,
            name: cleanTcName,
            searchKeywords: compSearchKeywords,
            type: 'component',
            description: comp.description || '戰甲製造所需的核心組件。',
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
