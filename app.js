// --- 動態注入「返回秘典大廳」按鈕 ---
const backBtn = document.createElement('div');
backBtn.innerHTML = '&#8592; 返回大廳';
backBtn.style.cssText = `
  position: fixed; 
  top: 20px; 
  left: 20px; 
  background: rgba(12,14,18,0.9); 
  border: 1px solid #c5a059; 
  color: #ffdf73; 
  padding: 10px 20px; 
  border-radius: 6px; 
  cursor: pointer; 
  z-index: 9999; 
  font-weight: bold;
  letter-spacing: 1px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.8);
  transition: all 0.3s ease;
`;
backBtn.onmouseover = () => {
  backBtn.style.background = 'rgba(212,175,55,0.2)';
  backBtn.style.transform = 'translateX(-3px)';
};
backBtn.onmouseout = () => {
  backBtn.style.background = 'rgba(12,14,18,0.9)';
  backBtn.style.transform = 'translateX(0)';
};
backBtn.onclick = () => window.location.href = 'warframes.html';
document.body.appendChild(backBtn);
// -------------------------------------

const urlParams = new URLSearchParams(window.location.search);
const TARGET_ITEM_NAME = urlParams.get('frame') || 'Volt';

const URL_WARFRAMES = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/Warframes.json';
const URL_I18N = 'https://raw.githubusercontent.com/wfcd/warframe-items/master/data/json/i18n.json';
const URL_EXPORT_RECIPES = 'https://raw.githubusercontent.com/calamity-inc/warframe-public-export-plus/master/ExportRecipes.json';

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

// 🌟 核心升級：專屬快取引擎 (Cache API)
async function fetchWithCache(url) {
  const cache = await caches.open('warframe-data-cache-v1');
  const cachedResponse = await cache.match(url);
  
  if (cachedResponse) {
    return cachedResponse.json();
  }
  
  const response = await fetch(url);
  if (response.ok) {
    cache.put(url, response.clone());
    return response.json();
  }
  throw new Error(`網路請求失敗: ${response.status}`);
}

Promise.all([
  fetchWithCache(URL_WARFRAMES),
  fetchWithCache(URL_I18N),
  fetchWithCache(URL_EXPORT_RECIPES)
])
.then(([rawData, i18nData, recipeRawData]) => {
  document.getElementById('loader').style.display = 'none';

  const exportRecipes = recipeRawData.ExportRecipes || recipeRawData;
  const recipesArray = Array.isArray(exportRecipes) ? exportRecipes : Object.values(exportRecipes);

  const i18nNameMap = {};
  Object.keys(i18nData).forEach(key => {
    if (i18nData[key].en && i18nData[key].en.name) {
      const enName = i18nData[key].en.name.toLowerCase();
      i18nNameMap[enName] = i18nData[key];
      i18nNameMap[enName.replace(/\s+/g, '')] = i18nData[key]; 
    }
  });

  function resolveI18n(item) {
    let match = i18nData[item.uniqueName] || i18nData[item.itemUniqueName] || (item.name && i18nNameMap[item.name.toLowerCase()]);
    return {
      tc: (match && (match.tc || match['zh-hant'])) || {},
      sc: (match && (match.zh || match['zh-hans'])) || {}
    };
  }

  const targetWf = rawData.find(item => item.name === TARGET_ITEM_NAME);
  if (!targetWf) return alert('找不到該物品！請回首頁重新選擇。');

  const wfI18n = resolveI18n(targetWf);
  const finalWfName = wfI18n.tc.name || wfI18n.sc.name || targetWf.name;

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

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card"><div class="stat-title">基礎血量</div><div class="stat-value">${targetWf.health}</div></div>
    <div class="stat-card"><div class="stat-title">護盾容量</div><div class="stat-value">${targetWf.shield}</div></div>
    <div class="stat-card"><div class="stat-title">基礎護甲</div><div class="stat-value">${targetWf.armor}</div></div>
    <div class="stat-card"><div class="stat-title">能量上限</div><div class="stat-value">${targetWf.power}</div></div>
    <div class="stat-card"><div class="stat-title">衝刺速度</div><div class="stat-value">${targetWf.sprintSpeed || 'N/A'}</div></div>
  `;

  let abilitiesHtml = "";
  const passiveDesc = wfI18n.tc.passiveDescription || targetWf.passiveDescription;
  if (passiveDesc) {
    abilitiesHtml += `<div class="ability-card"><div class="ability-icon-placeholder">被動</div><div class="ability-info"><div class="ability-name">被動能力</div><div class="ability-desc">${passiveDesc}</div></div></div>`;
  }

  if (targetWf.abilities && targetWf.abilities.length > 0) {
    targetWf.abilities.forEach((ability, index) => {
      let tcName = ability.name;
      let tcDesc = ability.description;
      
      if (wfI18n.tc.abilities && wfI18n.tc.abilities[index]) {
        tcName = wfI18n.tc.abilities[index].name || tcName;
        tcDesc = wfI18n.tc.abilities[index].description || tcDesc;
      }
      if (tcName === ability.name) {
        const globalMatch = i18nNameMap[ability.name.toLowerCase()];
        if (globalMatch) {
          const trans = globalMatch.tc || globalMatch['zh-hant'] || globalMatch.zh || globalMatch['zh-hans'] || {};
          tcName = trans.name || tcName;
          tcDesc = trans.description || tcDesc;
        }
      }
      
      const iconUrl = ability.imageName ? `https://cdn.warframestat.us/img/${ability.imageName}` : '';
      abilitiesHtml += `
        <div class="ability-card">
          ${iconUrl ? `<img src="${iconUrl}" class="ability-icon" onerror="this.style.display='none'">` : `<div class="ability-icon-placeholder">技能</div>`}
          <div class="ability-info"><div class="ability-name">${tcName}</div><div class="ability-desc">${tcDesc}</div></div>
        </div>`;
    });
  } else {
    abilitiesHtml += `<div class="ability-desc">資料庫中暫無技能資料。</div>`;
  }
  document.getElementById('abilities-list').innerHTML = abilitiesHtml;

  const aura = targetWf.aura || "無";
  const polarities = targetWf.polarities ? targetWf.polarities.join(", ") : "無";
  document.getElementById('panel-advanced').innerHTML = `<strong>光環極性槽:</strong> ${aura} <br><strong>自帶極性槽:</strong> ${polarities}`;
  document.getElementById('panel-crafting').innerHTML = `
    <strong>製造時間:</strong> ${targetWf.buildTime ? targetWf.buildTime / 3600 + " 小時" : "N/A"} <br>
    <strong>製造成本:</strong> ${targetWf.buildPrice ? targetWf.buildPrice.toLocaleString() + " 星幣" : "N/A"} <br>
    <strong>加速花費:</strong> ${targetWf.skipBuildTimePrice ? targetWf.skipBuildTimePrice + " 白金" : "N/A"}
  `;

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

      const isPart = /(機體|系統|神經光元|藍圖|Chassis|Systems|Neuroptics|Helmet|Blueprint)/i.test(finalDepName);
      const nodeColor = isPart ? '#e2e8f0' : '#10b981';
      const nodeSize = isPart ? 6 : 4;
      const nodeType = isPart ? 'component' : 'resource';

      const compCount = dep.itemCount || 1;

      nodes.push({ id: depId, name: finalDepName, type: nodeType, size: nodeSize, color: nodeColor, count: compCount, desc: dep.description || '' });
      links.push({ source: targetWf.uniqueName, target: depId });

      if (isPart) {
        const recipe = recipesArray.find(r => r.resultType === dep.uniqueName);
        
        if (recipe && recipe.ingredients) {
          recipe.ingredients.forEach(ing => {
            const matPath = ing.ItemType;
            const itemCount = ing.ItemCount || 1; 

            let rawMatName = matPath.split('/').pop(); 
            let readableName = rawMatName.replace(/([A-Z])/g, ' $1').trim();
            
            let matI18nMatch = i18nData[matPath] || i18nData[matPath + 's'] || i18nData[matPath.replace(/s$/, '')];

            if (!matI18nMatch) {
              let searchKeys = [
                readableName.toLowerCase(),
                readableName.toLowerCase() + 's',
                readableName.toLowerCase().replace(/s$/, ''),
                rawMatName.toLowerCase(),
                rawMatName.toLowerCase() + 's',
                rawMatName.toLowerCase().replace(/s$/, '')
              ];
              for (let k of searchKeys) {
                if (i18nNameMap[k]) {
                  matI18nMatch = i18nNameMap[k];
                  break;
                }
              }
            }

            let finalMatName = readableName;
            let finalMatDesc = "";

            if (matI18nMatch) {
              const trans = matI18nMatch.tc || matI18nMatch['zh-hant'] || matI18nMatch.zh || matI18nMatch['zh-hans'] || {};
              finalMatName = trans.name || finalMatName;
              finalMatDesc = trans.description || (matI18nMatch.en && matI18nMatch.en.description) || "";
            }

            // 🌟 修復核心：把地點抽出來，並把英文原版的 Location 從描述中剃除乾淨
            let extractedLocation = "";
            const locMatch = finalMatDesc ? finalMatDesc.match(/Location:\s*(.+)/i) : null;
            if (locMatch) {
              extractedLocation = locMatch[1].trim();
              // 清理掉描述中混雜的英文 Location 文字
              finalMatDesc = finalMatDesc.replace(/<br>\s*Location:\s*.+/i, '').replace(/Location:\s*.+/i, '').trim();
            }

            const uniqueMatId = `${depId}_${matPath}`;

            if (!nodes.find(n => n.id === uniqueMatId)) {
              // 🌟 這裡把 extractedLocation 存進去 node 裡了
              nodes.push({ id: uniqueMatId, name: finalMatName, desc: finalMatDesc, count: itemCount, type: 'resource', size: 4, color: '#10b981', location: extractedLocation });
            }
            links.push({ source: depId, target: uniqueMatId });
          });
        }
      }
    });
  }

  const graphContainer = document.getElementById('graph-container');
  const Graph = ForceGraph()(document.getElementById('graph'))
    .width(graphContainer.clientWidth)
    .height(600)
    .graphData({ nodes, links })
    .nodeId('id')
    .nodeLabel(node => {
      if (node.type === 'resource') {
        const countHtml = node.count ? `<span style="color: #10b981; font-weight: bold; font-size: 1.1em; margin-left: 15px;">x ${Number(node.count).toLocaleString()}</span>` : '';
        
        // 🌟 獨立出來的地點資訊區塊
        const locationHtml = node.location 
          ? `<div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed rgba(197, 160, 89, 0.5); color: #38bdf8; font-weight: bold; font-size: 1.1em; text-align: center;">
               📍 掉落點：${node.location} <br><span style="font-size: 0.8em; color: #a0aec0;">(點擊節點前往星圖)</span>
             </div>` 
          : '';

        return `
          <div style="max-width: 280px; text-align: left; background: rgba(12, 14, 18, 0.95); padding: 12px; border: 1px solid #c5a059; border-radius: 4px; box-shadow: 0 4px 20px rgba(0,0,0,0.9); color: #fdfbf7; font-family: sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
              <strong style="color: #ffdf73; font-size: 1.1em; letter-spacing: 1px;">${node.name}</strong>
              ${countHtml}
            </div>
            
            <div style="font-size: 1.15em; margin-top: 8px; line-height: 1.6; color: #d1cbbd; font-weight: 300;">
              ${node.desc || '系統庫中暫無詳細資料。'}
            </div>
            
            ${locationHtml}
          </div>
        `;
      }
      
      // 🌟 其他非資源節點 (如戰甲或部件) 的顯示樣式
      return `<div style="background: rgba(12, 14, 18, 0.9); padding: 6px 12px; border: 1px solid #d4af37; border-radius: 4px; color: #ffdf73; letter-spacing: 1px;">${node.name}</div>`;
    })
    .onNodeClick(node => {
      // 🌟 當點擊擁有「掉落點」的資源時，直接帶你去星圖！
      if (node.location) {
        // 小彩蛋：把地點當作參數傳過去，未來可以讓星圖自動搜尋這個地點
        window.location.href = `starchart.html?search=${encodeURIComponent(node.location)}`;
      }
    })
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

  window.addEventListener('resize', () => {
    Graph.width(graphContainer.clientWidth);
  });

  document.getElementById('graph-container').addEventListener('wheel', e => {
    e.stopPropagation();
  }, { capture: true });

  document.getElementById('zoom-in').addEventListener('click', () => {
    Graph.zoom(Graph.zoom() * 1.5, 300); 
  });
  document.getElementById('zoom-out').addEventListener('click', () => {
    Graph.zoom(Graph.zoom() / 1.5, 300); 
  });

})
.catch(err => {
  console.error('資料庫連線或解析錯誤:', err);
  document.getElementById('loader').innerText = `系統核心錯誤，請按 F12 查看主控台資訊。`;
});