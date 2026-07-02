const URL_WARFRAMES = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/Warframes.json';
const URL_I18N = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/i18n.json';
const URL_MISC = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/Misc.json';
const URL_RECIPES = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/Recipes.json'; // 🌟 新增配方總表
const TARGET_ITEM_NAME = 'Volt'; 

// 初始化折疊面板互動邏輯
const accordions = document.getElementsByClassName("accordion");
for (let i = 0; i < accordions.length; i++) {
  accordions[i].addEventListener("click", function() {
    this.classList.toggle("active");
    const panel = this.nextElementSibling;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
    } else {
      panel.style.maxHeight = panel.scrollHeight + "px";
    }
  });
}

Promise.all([
  fetch(URL_WARFRAMES).then(res => res.json()),
  fetch(URL_I18N).then(res => res.json()),
  fetch(URL_MISC).then(res => res.json())
])
.then(([rawData, i18nData, miscData]) => {
  document.getElementById('loader').style.display = 'none';

  const i18nNameMap = {};
  Object.keys(i18nData).forEach(key => {
    if (i18nData[key].en && i18nData[key].en.name) {
      i18nNameMap[i18nData[key].en.name.toLowerCase()] = i18nData[key];
    }
  });

  function resolveI18n(item) {
    let match = i18nData[item.uniqueName] || i18nData[item.itemUniqueName] || i18nNameMap[item.name.toLowerCase()];
    return {
      tc: (match && (match.tc || match['zh-hant'])) || {},
      sc: (match && (match.zh || match['zh-hans'])) || {}
    };
  }

  const materialMap = {};
  miscData.forEach(miscItem => {
    if (miscItem.parents) {
      miscItem.parents.forEach(parentName => {
        if (!materialMap[parentName]) materialMap[parentName] = [];
        materialMap[parentName].push(miscItem);
      });
    }
  });

  const targetWf = rawData.find(item => item.name === TARGET_ITEM_NAME);
  if (!targetWf) return alert('找不到該物品！');

  const wfI18n = resolveI18n(targetWf);
  const finalWfName = wfI18n.tc.name || wfI18n.sc.name || targetWf.name;

  // 1. 更新頭部基本資訊與圖片
  const imgElement = document.getElementById('wf-image');
  if (targetWf.imageName) {
    imgElement.src = `https://cdn.warframestat.us/img/${targetWf.imageName}`;
    imgElement.style.display = 'block';
  }
  document.getElementById('item-name').innerText = finalWfName;
  document.getElementById('item-subtitle').innerText = targetWf.uniqueName.split('/').pop();
  document.getElementById('item-type').innerText = targetWf.name.includes('Prime') ? 'Prime 戰甲' : '普版戰甲';
  document.getElementById('item-mr').innerText = `段位限制: ${targetWf.masteryReq || 0} 段`;
  document.getElementById('item-desc').innerText = wfI18n.tc.description || targetWf.description;

  // 2. 🟢 基礎體質：方塊網格 (Card Grid)
  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card">
      <div class="stat-title">基礎血量</div>
      <div class="stat-value">${targetWf.health}</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">護盾容量</div>
      <div class="stat-value">${targetWf.shield}</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">基礎護甲</div>
      <div class="stat-value">${targetWf.armor}</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">能量上限</div>
      <div class="stat-value">${targetWf.power}</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">衝刺速度</div>
      <div class="stat-value">${targetWf.sprintSpeed || 'N/A'}</div>
    </div>
  `;

  // 3. ✨ 戰甲技能：含被動與主動圖文
  let abilitiesHtml = "";
  
  // 處理被動技能 (被動通常沒有專屬圖片，我們給他一個純文字 Placeholder 圓圈)
  const passiveDesc = wfI18n.tc.passiveDescription || targetWf.passiveDescription;
  if (passiveDesc) {
    abilitiesHtml += `
      <div class="ability-card">
        <div class="ability-icon-placeholder">被動</div>
        <div class="ability-info">
          <div class="ability-name">被動能力</div>
          <div class="ability-desc">${passiveDesc}</div>
        </div>
      </div>
    `;
  }

  // 處理主動技能
  if (targetWf.abilities && targetWf.abilities.length > 0) {
    targetWf.abilities.forEach((ability, index) => {
      // 抓取翻譯，如果有對應的繁中翻譯就蓋掉英文
      let tcName = ability.name;
      let tcDesc = ability.description;
      
      // 方法 1: 先從戰甲專屬的翻譯槽找找看
      if (wfI18n.tc.abilities && wfI18n.tc.abilities[index]) {
        tcName = wfI18n.tc.abilities[index].name || tcName;
        tcDesc = wfI18n.tc.abilities[index].description || tcDesc;
      }
      
      // 方法 2: 如果方法 1 沒抓到 (名字還是英文)，直接去翻譯總表暴力配對！
      if (tcName === ability.name) {
        const globalMatch = i18nNameMap[ability.name.toLowerCase()];
        if (globalMatch) {
          // 繁中優先，沒有就拿簡中擋一下，總比英文好
          const trans = globalMatch.tc || globalMatch['zh-hant'] || globalMatch.zh || globalMatch['zh-hans'] || {};
          tcName = trans.name || tcName;
          tcDesc = trans.description || tcDesc;
        }
      }
      
      const iconUrl = ability.imageName ? `https://cdn.warframestat.us/img/${ability.imageName}` : '';
      
      // 如果官方沒有圖標，預防性給他一個破圖防護
      abilitiesHtml += `
        <div class="ability-card">
          ${iconUrl 
            ? `<img src="${iconUrl}" class="ability-icon" onerror="this.style.display='none'">` 
            : `<div class="ability-icon-placeholder">技能</div>`
          }
          <div class="ability-info">
            <div class="ability-name">${tcName}</div>
            <div class="ability-desc">${tcDesc}</div>
          </div>
        </div>
      `;
    });
  } else {
    abilitiesHtml += `<div class="ability-desc">資料庫中暫無技能資料。</div>`;
  }
  document.getElementById('abilities-list').innerHTML = abilitiesHtml;

  // 4. 🔴 進階配卡
  const aura = targetWf.aura || "無";
  const polarities = targetWf.polarities ? targetWf.polarities.join(", ") : "無";
  document.getElementById('panel-advanced').innerHTML = `
    <strong>光環極性槽:</strong> ${aura} <br>
    <strong>自帶極性槽:</strong> ${polarities}
  `;

  // 5. 🛠️ 鑄造與背景
  document.getElementById('panel-crafting').innerHTML = `
    <strong>製造時間:</strong> ${targetWf.buildTime ? targetWf.buildTime / 3600 + " 小時" : "N/A"} <br>
    <strong>製造成本:</strong> ${targetWf.buildPrice ? targetWf.buildPrice.toLocaleString() + " 星幣" : "N/A"} <br>
    <strong>加速花費:</strong> ${targetWf.skipBuildTimePrice ? targetWf.skipBuildTimePrice + " 白金" : "N/A"} <br>
    <strong>性別設定:</strong> ${targetWf.sex || "未公開"} <br>
    <strong>初次登場:</strong> ${targetWf.introduced || "早期版本"}
  `;

  // --- 圖表繪製邏輯 (維持不變) ---
  const nodes = [];
  const links = [];
  nodes.push({ id: targetWf.uniqueName, name: finalWfName, type: 'warframe', size: 12, color: '#38bdf8' });

  if (targetWf.components) {
    targetWf.components.forEach(dep => {
      if (dep.name === targetWf.name) return;
      const depId = dep.uniqueName || dep.name;
      const depI18n = resolveI18n(dep);
      let finalDepName = depI18n.tc.name || depI18n.sc.name || dep.name;

      if (finalDepName === dep.name) {
        finalDepName = finalDepName.replace(/Neuroptics|Helmet/ig, '頭部神經光元').replace(/Chassis/ig, '機體').replace(/Systems/ig, '系統').replace(/Blueprint/ig, '藍圖');
      }
      if (finalDepName === 'Blueprint' || finalDepName === '藍圖') finalDepName = `${finalWfName} 藍圖`;

      nodes.push({ id: depId, name: finalDepName, type: 'component', size: 6, color: '#e2e8f0' });
      links.push({ source: targetWf.uniqueName, target: depId });

      const materials = materialMap[dep.name] || materialMap[`${dep.name} Blueprint`];
      if (materials) {
        materials.forEach(mat => {
          const matId = mat.uniqueName || mat.name;
          const matI18n = resolveI18n(mat);
          let finalMatName = matI18n.tc.name || matI18n.sc.name || mat.name;
          if (finalMatName === mat.name) finalMatName = finalMatName.replace(/([A-Z])/g, ' $1').trim();

          if (!nodes.find(n => n.id === matId)) {
            nodes.push({ id: matId, name: finalMatName, type: 'resource', size: 4, color: '#10b981' });
          }
          links.push({ source: depId, target: matId });
        });
      }
    });
  }

  const graphContainer = document.getElementById('graph-container');
  const Graph = ForceGraph()(document.getElementById('graph'))
    .width(graphContainer.clientWidth)
    .height(600)
    .graphData({ nodes, links })
    .nodeId('id')
    .nodeLabel('name')
    .linkColor(() => 'rgba(255, 255, 255, 0.3)')
    .linkWidth(2)
    .minZoom(1) 
    .maxZoom(5)
    .nodePointerAreaPaint((node, color, ctx) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI, false);
      ctx.fill();
    })
    .nodeCanvasObject((node, ctx, globalScale) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.color;
      ctx.fill();

      if (globalScale > 1.5 || node.type === 'warframe') {
        const fontSize = node.type === 'warframe' ? 18 / globalScale : 14 / globalScale;
        ctx.font = `bold ${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        const textY = node.y + node.size + (8 / globalScale);
        ctx.lineWidth = 4 / globalScale; 
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'; 
        ctx.strokeText(node.name, node.x, textY);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(node.name, node.x, textY);
      }
    });

  Graph.d3Force('charge').strength(-250);

  // 1. 攔截滾輪事件：不讓圖表縮放，讓網頁正常上下滾動
  document.getElementById('graph-container').addEventListener('wheel', e => {
    e.stopPropagation();
  }, { capture: true });

  // 2. 綁定按鈕縮放邏輯 (加上 300 毫秒的平滑動畫)
  document.getElementById('zoom-in').addEventListener('click', () => {
    Graph.zoom(Graph.zoom() * 1.5, 300); 
  });
  document.getElementById('zoom-out').addEventListener('click', () => {
    Graph.zoom(Graph.zoom() / 1.5, 300); 
  });

  window.addEventListener('resize', () => {
    Graph.width(graphContainer.clientWidth);
  });

  for (let i = 0; i < accordions.length; i++) {
    accordions[i].addEventListener('click', function() {
      setTimeout(() => {
        const panels = document.querySelectorAll('.panel');
        panels.forEach(p => {
          if(p.style.maxHeight) {
            p.style.maxHeight = p.scrollHeight + "px";
          }
        });
      }, 310);
    });
  }

})
.catch(err => console.error('錯誤詳情:', err));