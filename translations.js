// translations.js - Warframe 本機翻譯資料庫

const basicPlanets = { 
  "earth": "地球", 
  "venus": "金星", 
  "mars": "火星", 
  "jupiter": "木星", 
  "saturn": "土星", 
  "uranus": "天王星", 
  "neptune": "海王星", 
  "pluto": "冥王星", 
  "ceres": "穀神星", 
  "eris": "鬩神星", 
  "sedna": "賽德娜", 
  "europa": "歐羅巴", 
  "lua": "月球", 
  "kuva fortress": "赤毒要塞", 
  "void": "虛空", 
  "deimos": "火衛二", 
  "zariman": "扎日曼", 
  "phobos": "火衛一", 
  "mercury": "水星", 
  "veil": "面紗毗鄰星",
  "dojo": "道場", 
  "duviri": "渡域" 
};

const missionTypes = {
  "Survival": "生存", 
  "Defense": "防禦",
  "Mirror Defense": "鏡像防禦",
  "Capture": "捕獲", 
  "Extermination": "殲滅", 
  "Interception": "攔截", 
  "Assassination": "刺殺",
  "Excavation": "挖掘", 
  "Spy": "間諜", 
  "Mobile Defense": "移動防禦",
  "Sabotage": "破壞", 
  "Rescue": "救援", 
  "Hijack": "劫持",
  "Free Roam": "開放世界", 
  "Assault": "突擊", 
  "Pursuit": "追擊",
  "Rush": "突襲", 
  "Arena": "競技場", 
  "Defection": "叛逃",
  "Disruption": "中斷", 
  "Void Armageddon": "虛空決戰", 
  "Void Cascade": "虛空連崩", 
  "Void Flood": "虛空洪潮",
  "Alchemy": "轉化", 
  "Netracells": "龜甲庫", 
  "Assassination (VIP)": "刺殺",
  "Skirmish": "前哨戰", 
  "Orphix": "奧菲斯"
};

const enemyTypes = {
  "Grineer": "Grineer", "Corpus": "Corpus", "Infested": "Infested",
  "Corrupted": "Corrupted", "Orokin": "Orokin", "Sentient": "Sentient",
  "Narmer": "Narmer", "Murmur": "Murmur"
};

// 🌟 新增：專門用來處理那些 API 沒有，但你需要手動硬改的「特殊節點名稱」
const customNodes = {
  // 可以在這裡自由新增你看到的奇怪節點，例如：
  // "Earth Proxima": "地球毗鄰星",
};