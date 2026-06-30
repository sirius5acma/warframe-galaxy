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

  const allNodes = [];
  const allLinks = [];
  const nodeSet = new Set();

  const i18nNameMap = {};
  Object.keys(i18nData).forEach(key => {
    const entry = i18nData[key];
    if (entry.en && entry.en.name) {
      i18nNameMap[entry.en.name.toLowerCase()] = entry;
    }
  });

  function resolveI18n(item) {
    let match = i18nData[item.uniqueName];
    if (!match && item.itemUniqueName) match = i18nData[item.itemUniqueName];
    if (!match && item.name) match = i18nNameMap[item.name.toLowerCase()];
    
    const tc = (match && (match.tc || match['zh-hant'])) || {};
    const sc = (match && (match.zh || match['zh-hans'])) || {};
    return { tc, sc };
  }

  const warframes = rawData.filter(item => item.category === 'Warframes' && !item.name.includes('Specter'));

  warframes.forEach(wf => {
    const wfI18n = resolveI18n(wf);
    const finalWfName = wfI18n.tc.name || wfI18n.sc.name || wf.name;
    const finalWfDesc = wfI18n.tc.description || wfI18n.sc.description || wf.description;
    const searchKeywords = `${finalWfName} ${wfI18n.sc.name || ''} ${wf.name}`.toLowerCase();

    if (!nodeSet.has(wf.uniqueName)) {
      allNodes.push({
        id: wf.uniqueName,
        name: finalWfName,
        searchKeywords: searchKeywords,
        type: 'warframe',
        mr: wf.masteryReq || 0,
        description: finalWfDesc,
        stats: `血量: ${wf.health} | 護甲: ${wf.armor} | 護盾: ${wf.shield}`,
        size: wf.name.includes('Prime') ? 10 : 8, 
        color: wf.name.includes('Prime') ? '#f59e0b' : '#38bdf8' 
      });
      nodeSet.add(wf.uniqueName);
    }

    function processDependencies(parentItem, parentId, isLayer2) {
      if (!parentItem.components || parentItem.components.length === 0) return;

      const parentI18n = resolveI18n(parentItem);
      const pName = parentI18n.tc.name || parentI18n.sc.name || parentItem.name;

      parentItem.components.forEach(dep => {
        if (dep.name === parentItem.name) return;

        const depId = dep.uniqueName || dep.name; 
        
        const isPart = /(Chassis|Systems|Neuroptics|Blueprint)/i.test(dep.name);
        const nodeType = isPart ? 'component' : 'resource';

        const depI18n = resolveI18n(dep);
        let finalDepName = depI18n.tc.name || depI18n.sc.name || dep.name;

        if (finalDepName === dep.name && isPart) {
          finalDepName = finalDepName
            .replace(/Neuroptics/ig, '頭部神經光元')
            .replace(/Chassis/ig, '機體')
            .replace(/Systems/ig, '系統')
            .replace(/Blueprint/ig, '藍圖');
        }

        if (finalDepName === 'Blueprint' || finalDepName === '藍圖') {
          finalDepName = `${pName} 藍圖`;
        }

        let finalDepDesc = depI18n.tc.description || depI18n.sc.description;
        if (!finalDepDesc) {
          if (isPart && dep.description === wf.description) {
            finalDepDesc = finalWfDesc; 
          } else if (isPart) {
            finalDepDesc = '戰甲製造所需的核心組件。';
          } else {
            finalDepDesc = '用於製造裝備的基礎資源。';
          }
        }

        const compSearchKeywords = `${finalDepName} ${depI18n.sc.name || ''} ${dep.name}`.toLowerCase();

        if (!nodeSet.has(depId)) {
          allNodes.push({
            id: depId,
            name: finalDepName,
            searchKeywords: compSearchKeywords,
            type: nodeType,
            description: finalDepDesc,
            size: nodeType === 'component' ? 4 : 2.5,
            color: nodeType === 'component' ? '#e2e8f0' : '#10b981'
          });
          nodeSet.add(depId);
        }

        allLinks.push({
          source: parentId,
          target: depId,
          distance: nodeType === 'component' ? 40 : 20 
        });

        if (isLayer2) {
          processDependencies(dep, depId, false);
        }
      });
    }

    processDependencies(wf, wf.uniqueName, true);
  });

  // ========== UI, 圖表與兩階段點擊邏輯 ==========
  
  let currentPreviewNode = null; 

  function updatePanelInfo(node) {
    document.getElementById('item-name').innerText = node.name;
    document.getElementById('item-unique').innerText = node.id.split('_').pop(); 
    const isPrime = node.id.includes('Prime');

    if (node.type === 'warframe') {
      document.getElementById('item-type').innerText = isPrime ? 'Prime 戰甲' : '普版戰甲';
      document.getElementById('item-mr').innerText = node.mr + ' 段';
      document.getElementById('item-stats').innerText = node.stats;
      document.getElementById('item-desc').innerText = node.description || '暫無簡介';
      document.getElementById('info-panel').style.borderTopColor = isPrime ? '#f59e0b' : '#38bdf8';
    } else if (node.type === 'component') {
      document.getElementById('item-type').innerText = '戰甲部件';
      document.getElementById('item-mr').innerText = '無限制';
      document.getElementById('item-stats').innerText = 'N/A';
      document.getElementById('item-desc').innerText = node.description;
      document.getElementById('info-panel').style.borderTopColor = '#e2e8f0';
    } else if (node.type === 'resource') { 
      document.getElementById('item-type').innerText = '基礎資源 / 材料';
      document.getElementById('item-mr').innerText = '無限制';
      document.getElementById('item-stats').innerText = 'N/A';
      document.getElementById('item-desc').innerText = node.description;
      document.getElementById('info-panel').style.borderTopColor = '#10b981'; 
    }
    document.getElementById('info-panel').style.display = 'block';
  }

  function isolateSubGraph(node) {
    const subNodes = new Set([node]);
    const subLinks = new Set();

    function getChildren(targetNodeId) {
      allLinks.forEach(l => {
        const sId = typeof l.source === 'object' ? l.source.id : l.source;
        const tId = typeof l.target === 'object' ? l.target.id : l.target;
        if (sId === targetNodeId) {
          subLinks.add(l);
          subNodes.add(typeof l.source === 'object' ? l.source : allNodes.find(n => n.id === sId));
          subNodes.add(typeof l.target === 'object' ? l.target : allNodes.find(n => n.id === tId));
        }
      });
    }

    function getParents(targetNodeId) {
      allLinks.forEach(l => {
        const sId = typeof l.source === 'object' ? l.source.id : l.source;
        const tId = typeof l.target === 'object' ? l.target.id : l.target;
        if (tId === targetNodeId) {
          subLinks.add(l);
          subNodes.add(typeof l.source === 'object' ? l.source : allNodes.find(n => n.id === sId));
          subNodes.add(typeof l.target === 'object' ? l.target : allNodes.find(n => n.id === tId));
        }
      });
    }

    if (node.type === 'warframe') {
      getChildren(node.id);
      const comps = Array.from(subNodes).filter(n => n.type === 'component');
      comps.forEach(c => getChildren(c.id));
    } else if (node.type === 'component') {
      getParents(node.id);
      getChildren(node.id);
    } else if (node.type === 'resource') {
      getParents(node.id);
      const comps = Array.from(subNodes).filter(n => n.type === 'component');
      comps.forEach(c => getParents(c.id));
    }

    Graph.graphData({ 
      nodes: Array.from(subNodes), 
      links: Array.from(subLinks) 
    });

    setTimeout(() => {
      Graph.centerAt(node.x, node.y, 1000);
      Graph.zoom(3.5, 1000);
    }, 100); 
  }

  // 初始化圖表
  const Graph = ForceGraph()(document.getElementById('graph'))
    .graphData({ nodes: allNodes, links: allLinks })
    .nodeId('id')
    .nodeLabel('name')
    .linkColor(() => 'rgba(255, 255, 255, 0.4)')
    .linkWidth(2) 
    .minZoom(0.2) // 🌟 限制縮小極限，保護你不掉進宇宙邊緣
    .maxZoom(6)   // 🌟 限制放大極限
    .onNodeClick(node => {
      if (currentPreviewNode === node) {
        isolateSubGraph(node);
      } else {
        currentPreviewNode = node;
        updatePanelInfo(node);
        Graph.centerAt(node.x, node.y, 1000);
      }
    })
    .onBackgroundClick(() => {
      currentPreviewNode = null;
      Graph.graphData({ nodes: allNodes, links: allLinks });
      document.getElementById('info-panel').style.display = 'none';
      Graph.zoomToFit(1000, 50); 
    })
    .nodeCanvasObject((node, ctx, globalScale) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.color;
      ctx.fill();

      if (globalScale > 0.6 || (currentPreviewNode && currentPreviewNode.id === node.id)) {
        const label = node.name;
        const fontSize = node.type === 'warframe' ? 26 / globalScale : 18 / globalScale;
        ctx.font = `bold ${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        
        const textY = node.y + node.size + (12 / globalScale);

        ctx.lineWidth = 6 / globalScale; 
        ctx.strokeStyle = 'rgba(0, 0, 0, 1)'; 
        ctx.strokeText(label, node.x, textY);
        
        ctx.fillStyle = node.type === 'warframe' ? '#ffffff' : '#cbd5e1';
        ctx.fillText(label, node.x, textY);
      }
    });

  Graph.d3Force('charge').strength(-120);

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

    const matchedNodes = allNodes
      .filter(n => n.searchKeywords.includes(value))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))
      .slice(0, 5);

    if (matchedNodes.length > 0) {
      searchResults.style.display = 'flex';
      currentTopMatch = matchedNodes[0]; 

      matchedNodes.forEach(node => {
        const div = document.createElement('div');
        div.className = 'search-item';
        
        let typeLabel = '[未知]';
        if (node.type === 'warframe') typeLabel = '[戰甲]';
        else if (node.type === 'component') typeLabel = '[部件]';
        else if (node.type === 'resource') typeLabel = '[資源]';
        
        div.innerText = `${typeLabel} ${node.name}`; 
        
        div.addEventListener('click', () => {
          currentPreviewNode = node;
          updatePanelInfo(node);
          isolateSubGraph(node); 
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
      currentPreviewNode = currentTopMatch;
      updatePanelInfo(currentTopMatch);
      isolateSubGraph(currentTopMatch);
      searchResults.style.display = 'none'; 
      searchInput.value = ''; 
      searchInput.blur(); 
    }
  });

})
.catch(err => {
  document.getElementById('loader').innerText = `資源庫讀取失敗：${err.message}`;
  console.error(err);
});

// ========== 視窗縮放自動適應 ==========
window.addEventListener('resize', () => {
  const graphElement = document.getElementById('graph');
  if (graphElement) {
    Graph.width(graphElement.clientWidth);
    Graph.height(graphElement.clientHeight);
  }
});