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

    // A. 建立「主戰甲」節點
    if (!nodeSet.has(wf.uniqueName)) {
      nodes.push({
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

        // 🌟 關鍵修改：強制讓 ID 綁定父節點 (parentId)，這樣電池就不會共用，會變成獨立的小衛星！
        const depId = parentId + '_' + (dep.uniqueName || dep.name); 
        
        const isPart = /(Chassis|Systems|Neuroptics|Blueprint)/i.test(dep.name);
        const nodeType = isPart ? 'component' : 'resource';

        const depI18n = resolveI18n(dep);
        let finalDepName = depI18n.tc.name || depI18n.sc.name || dep.name;

        // 修復英文漏網之魚
        if (finalDepName === dep.name && isPart) {
          finalDepName = finalDepName
            .replace(/Neuroptics/ig, '頭部神經光元')
            .replace(/Chassis/ig, '機體')
            .replace(/Systems/ig, '系統')
            .replace(/Blueprint/ig, '藍圖');
        }

        // 修正 Chroma 命名 Bug
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
          nodes.push({
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

        links.push({
          source: parentId,
          target: depId,
          distance: nodeType === 'component' ? 45 : 25 // 稍微拉開一點距離，讓大字體不會擠在一起
        });

        if (isLayer2) {
          processDependencies(dep, depId, false);
        }
      });
    }

    processDependencies(wf, wf.uniqueName, true);
  });

  // ========== UI, 圖表與聚光燈邏輯 ==========
  let highlightNodes = new Set();
  let highlightLinks = new Set();

  function focusAndShowPanel(node) {
    Graph.centerAt(node.x, node.y, 1000);
    // 把畫面稍微拉遠一點，讓整朵花都能進到視線裡
    Graph.zoom(3.0, 1000);

    document.getElementById('item-name').innerText = node.name;
    // 因為 ID 變長了，面板上我們只顯示最乾淨的原始物品 ID
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

    // 🌟 全新聚光燈邏輯：因為變回獨立花朵了，查找邏輯變得非常乾淨
    highlightNodes.clear();
    highlightLinks.clear();
    
    if (node) {
      highlightNodes.add(node);
      
      // 步驟 1：找直系親屬
      links.forEach(l => {
        const sId = typeof l.source === 'object' ? l.source.id : l.source;
        const tId = typeof l.target === 'object' ? l.target.id : l.target;
        if (sId === node.id || tId === node.id) {
          highlightLinks.add(l);
          highlightNodes.add(typeof l.source === 'object' ? l.source : nodes.find(n => n.id === sId));
          highlightNodes.add(typeof l.target === 'object' ? l.target : nodes.find(n => n.id === tId));
        }
      });

      // 步驟 2：如果是主戰甲，把孫子（材料）也抓進來點亮
      if (node.type === 'warframe') {
        const componentIds = Array.from(highlightNodes).filter(n => n.type === 'component').map(n => n.id);
        links.forEach(l => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          if (componentIds.includes(sId) || componentIds.includes(tId)) {
            highlightLinks.add(l);
            highlightNodes.add(typeof l.source === 'object' ? l.source : nodes.find(n => n.id === sId));
            highlightNodes.add(typeof l.target === 'object' ? l.target : nodes.find(n => n.id === tId));
          }
        });
      }
    }
  }

  const Graph = ForceGraph()(document.getElementById('graph'))
    .graphData({ nodes, links })
    .nodeId('id')
    .nodeLabel('name')
    .linkColor(link => {
      if (highlightNodes.size === 0) return 'rgba(255, 255, 255, 0.08)'; 
      return highlightLinks.has(link) ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.01)'; 
    })
    .linkWidth(link => highlightLinks.has(link) ? 2 : 1) 
    .onNodeClick(node => focusAndShowPanel(node))
    .onBackgroundClick(() => {
      highlightNodes.clear();
      highlightLinks.clear();
      document.getElementById('info-panel').style.display = 'none';
    })
    .nodeCanvasObject((node, ctx, globalScale) => {
      const isHighlighted = highlightNodes.has(node);
      const opacity = highlightNodes.size === 0 ? 1 : (isHighlighted ? 1 : 0.02); 

      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.color;
      ctx.fill();

      // 🌟 字體全面加大並新增黑框：戰甲 18px，部件/資源 13px (會隨滾輪縮放)
      if (globalScale > 0.8 || isHighlighted) {
        const label = node.name;
        const fontSize = node.type === 'warframe' ? 18 / globalScale : 13 / globalScale;
        
        ctx.save(); // 🌟 儲存畫筆狀態（把畫筆先收好，避免黑色沾到別的地方）
        
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        const textY = node.y + node.size + (8 / globalScale);

        // 畫上黑色邊框 (Stroke)
        ctx.lineWidth = 3 / globalScale; 
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'; 
        ctx.strokeText(label, node.x, textY);
        
        // 畫上原本的字體顏色 (Fill)
        ctx.fillStyle = node.type === 'warframe' ? '#ffffff' : '#cbd5e1';
        ctx.fillText(label, node.x, textY);
        
        ctx.restore(); // 🌟 恢復畫筆狀態（把畫筆洗乾淨，還給連線引擎）
      }
    });

  // 引力調回舒適的距離
  Graph.d3Force('charge').strength(-100);

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
        
        let typeLabel = '[未知]';
        if (node.type === 'warframe') typeLabel = '[戰甲]';
        else if (node.type === 'component') typeLabel = '[部件]';
        else if (node.type === 'resource') typeLabel = '[資源]';
        
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