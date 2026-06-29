// 1. 定義三種語言的 wfcd 資料庫網址
// 1. 改用 wfcd 官方維護的動態 API，直接透過 language 參數請求不同語言
const URL_TC = 'https://api.warframestat.us/warframes?language=tc'; // 正體中文 (tc)
const URL_SC = 'https://api.warframestat.us/warframes?language=zh'; // 簡體中文 (zh)
const URL_EN = 'https://api.warframestat.us/warframes?language=en'; // 英文原版 (en)

document.getElementById('loader').innerText = '正在同步正中、簡中與英文資料庫...';

// 2. 利用 Promise.all 一口氣平行下載三份資料
Promise.all([
  fetch(URL_TC).then(res => res.json()),
  fetch(URL_SC).then(res => res.json()),
  fetch(URL_EN).then(res => res.json())
])
.then(([tcData, scData, enData]) => {
  document.getElementById('loader').style.display = 'none';

  const nodes = [];
  const links = [];
  const nodeSet = new Set();

  // 為了快速對照，我們把簡中和英文的資料做成「字典」，用 uniqueName 當鑰匙
  const scDict = Object.fromEntries(scData.map(item => [item.uniqueName, item]));
  const enDict = Object.fromEntries(enData.map(item => [item.uniqueName, item]));

  // 過濾正體中文的資料作為主軸
  const warframes = tcData.filter(item => item.category === 'Warframes' && !item.name.includes('Specter'));

  warframes.forEach(wf => {
    // 從字典裡抓出這隻戰甲的簡中與英文名字
    const scName = scDict[wf.uniqueName] ? scDict[wf.uniqueName].name : '';
    const enName = enDict[wf.uniqueName] ? enDict[wf.uniqueName].name : '';
    // 把三個語言拼成一個隱藏的搜尋關鍵字字串
    const searchKeywords = `${wf.name} ${scName} ${enName}`.toLowerCase();

    // A. 建立「主戰甲」節點
    if (!nodeSet.has(wf.uniqueName)) {
      nodes.push({
        id: wf.uniqueName,
        name: wf.name, // 畫面上只顯示正中
        searchKeywords: searchKeywords, // 隱藏屬性，給搜尋引擎用的
        type: 'warframe',
        mr: wf.masteryReq || 0,
        description: wf.description, // 顯示正中簡介
        stats: `血量: ${wf.health} | 護甲: ${wf.armor} | 護盾: ${wf.shield}`,
        size: wf.name.includes('Prime') ? 9 : 7, 
        color: wf.name.includes('Prime') ? '#f59e0b' : '#38bdf8' 
      });
      nodeSet.add(wf.uniqueName);
    }

    // B. 建立「部件」節點
    if (wf.components && wf.components.length > 0) {
      wf.components.forEach((comp, index) => {
        if (comp.name === wf.name) return; 

        const compId = wf.uniqueName + '_' + comp.name;

        // 嘗試去抓同一個位子（index）的簡中和英文部件名稱
        const scCompName = (scDict[wf.uniqueName] && scDict[wf.uniqueName].components) ? scDict[wf.uniqueName].components[index].name : '';
        const enCompName = (enDict[wf.uniqueName] && enDict[wf.uniqueName].components) ? enDict[wf.uniqueName].components[index].name : '';
        const compSearchKeywords = `${comp.name} ${scCompName} ${enCompName}`.toLowerCase();

        if (!nodeSet.has(compId)) {
          nodes.push({
            id: compId,
            name: comp.name, // 正中部件名
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

  // ========== 以下為圖表與 UI 邏輯 (與之前幾乎相同) ==========

  function focusAndShowPanel(node) {
    Graph.centerAt(node.x, node.y, 1000);
    Graph.zoom(3.5, 1000);

    document.getElementById('item-name').innerText = node.name; // 這裡出來的絕對是正中
    document.getElementById('item-unique').innerText = node.id.split('_')[0]; 
    document.getElementById('item-type').innerText = node.type === 'warframe' ? '天之刃戰甲' : '製造部件';
    
    if (node.type === 'warframe') {
      document.getElementById('item-mr').innerText = node.mr + ' 段';
      document.getElementById('item-stats').innerText = node.stats;
      document.getElementById('item-desc').innerText = node.description || '暫無簡介'; // 正中簡介
      document.getElementById('info-panel').style.borderTopColor = node.name.includes('Prime') ? '#f59e0b' : '#38bdf8';
    } else {
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

  // 3. 搜尋引擎強化：現在比對的是「隱藏的三語系字串」
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

    // 🌟 改變在這裡：我們不是比對 node.name，而是比對我們綁上去的 searchKeywords
    const matchedNodes = nodes.filter(n => n.searchKeywords.includes(value)).slice(0, 5);

    if (matchedNodes.length > 0) {
      searchResults.style.display = 'flex';
      currentTopMatch = matchedNodes[0]; 

      matchedNodes.forEach(node => {
        const div = document.createElement('div');
        div.className = 'search-item';
        const typeLabel = node.type === 'warframe' ? '[戰甲]' : '[部件]';
        // 下拉選單顯示依然是正中，確保玩家視覺統一
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
  document.getElementById('loader').innerText = '資料庫同步失敗，請檢查網路。';
  console.error(err);
});
