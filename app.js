// 直連 wfcd 官方即時更新的 Warframes.json
const WFCD_URL = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/Warframes.json';

fetch(WFCD_URL)
  .then(res => res.json())
  .then(rawData => {
    document.getElementById('loader').style.display = 'none';

    const nodes = [];
    const links = [];
    const nodeSet = new Set();

    const warframes = rawData.filter(item => item.category === 'Warframes' && !item.name.includes('Specter'));

    warframes.forEach(wf => {
      // 1. 建立「主戰甲」大節點
      if (!nodeSet.has(wf.uniqueName)) {
        nodes.push({
          id: wf.uniqueName,
          name: wf.name,
          type: 'warframe',
          mr: wf.masteryReq || 0,
          description: wf.description,
          stats: `血量: ${wf.health} | 護甲: ${wf.armor} | 護盾: ${wf.shield}`,
          size: wf.name.includes('Prime') ? 9 : 7, 
          color: wf.name.includes('Prime') ? '#f59e0b' : '#38bdf8' 
        });
        nodeSet.add(wf.uniqueName);
      }

      // 2. 建立「部件」衛星節點
      if (wf.components && wf.components.length > 0) {
        wf.components.forEach(comp => {
          if (comp.name === wf.name) return; 

          const compId = wf.uniqueName + '_' + comp.name;

          if (!nodeSet.has(compId)) {
            nodes.push({
              id: compId,
              name: comp.name,
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

    // 拉近視角與顯示右側面板的共用邏輯
    function focusAndShowPanel(node) {
      Graph.centerAt(node.x, node.y, 1000);
      Graph.zoom(3.5, 1000);

      document.getElementById('item-name').innerText = node.name;
      document.getElementById('item-unique').innerText = node.id.split('_')[0]; 
      document.getElementById('item-type').innerText = node.type === 'warframe' ? '天之刃戰甲' : '製造部件';
      
      if (node.type === 'warframe') {
        document.getElementById('item-mr').innerText = node.mr + ' 段';
        document.getElementById('item-stats').innerText = node.stats;
        document.getElementById('item-desc').innerText = node.description || '暫無簡介';
        document.getElementById('info-panel').style.borderTopColor = node.name.includes('Prime') ? '#f59e0b' : '#38bdf8';
      } else {
        document.getElementById('item-mr').innerText = '無限制';
        document.getElementById('item-stats').innerText = 'N/A';
        document.getElementById('item-desc').innerText = node.description;
        document.getElementById('info-panel').style.borderTopColor = '#e2e8f0';
      }
      document.getElementById('info-panel').style.display = 'block';
    }

    // 3. 初始化圖表引擎
    const Graph = ForceGraph()(document.getElementById('graph'))
      .graphData({ nodes, links })
      .nodeId('id')
      .nodeLabel('name')
      .nodeColor(node => node.color)
      .linkWidth(1)
      .linkColor(() => 'rgba(255, 255, 255, 0.08)')
      .onNodeClick(node => {
        focusAndShowPanel(node);
      })
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

    // 4. 具備智能下拉選單的搜尋引擎
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

      const matchedNodes = nodes.filter(n => n.name.toLowerCase().includes(value)).slice(0, 5);

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
    document.getElementById('loader').innerText = '無法直連庫存，請檢查網路。';
    console.error(err);
  });
