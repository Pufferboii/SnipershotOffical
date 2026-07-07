const bg = "https://i.postimg.cc/PfvN6szG/red.jpg";

export function gamesPage(source = "lumin") {
  const label = source === "gnmath" ? "GN-Math Games" : source === "nikehub" ? "NikeHub Games" : "Lumin Games";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${label}</title>
<script src="https://cdn.jsdelivr.net/gh/luminsdk/script@latest/lumin.min.js"></script>
<style>
*{box-sizing:border-box;font-family:Inter,system-ui,sans-serif}
body{margin:0;padding:20px;color:white;min-height:100vh;overflow-x:hidden;background:#060608}
.bg{position:fixed;inset:0;z-index:-2;background:radial-gradient(circle at 20% 20%,rgba(255,0,0,.14),transparent 40%),radial-gradient(circle at 80% 70%,rgba(255,0,0,.10),transparent 45%),url("${bg}") center/cover no-repeat;filter:brightness(.3)}
#particles{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:-1}.particle{position:absolute;width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.35);animation:float linear infinite}@keyframes float{from{transform:translateY(100vh);opacity:0}20%{opacity:1}to{transform:translateY(-120vh);opacity:0}}
.top{display:flex;gap:12px;align-items:center;justify-content:space-between;margin-bottom:18px}.home{color:white;text-decoration:none;font-weight:900;padding:12px 18px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}h1{margin:0 0 18px;font-size:42px;text-shadow:0 0 18px rgba(255,70,70,.35)}
.search{width:100%;padding:14px 16px;border:none;border-radius:12px;margin-bottom:16px;background:#1a1a22;color:white;font-size:16px;outline:none}.meta{opacity:.75;margin-bottom:16px;font-weight:700}.pageControls{display:flex;justify-content:center;gap:16px;margin-bottom:24px;flex-wrap:wrap}.pageBtn{padding:12px 22px;border:none;border-radius:14px;background:linear-gradient(135deg,rgba(255,40,40,.9),rgba(180,0,0,.9));color:white;font-weight:800;cursor:pointer}.pageBtn:disabled{opacity:.45;cursor:not-allowed}.pageIndicator{padding:12px 18px;border-radius:14px;background:rgba(255,255,255,.05)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px}.card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:18px;overflow:hidden;cursor:pointer;transition:.2s;padding:12px}.card:hover{transform:translateY(-3px);border-color:rgba(255,60,60,.42);background:rgba(255,255,255,.07)}.thumbWrap{position:relative;width:100%;height:140px;overflow:hidden;border-radius:14px;margin-bottom:14px;background:#111}.thumb{width:100%;height:100%;object-fit:cover}.gameTitle{text-align:center;font-size:16px;font-weight:900;line-height:1.25}.gamePreview{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);opacity:0;transform:translateY(10px);transition:.25s ease;font-weight:900}.card:hover .gamePreview{opacity:1;transform:translateY(0)}
#player{position:fixed;inset:0;width:100vw;height:100vh;border:0;background:white;z-index:10000;display:none}.closePlayer{position:fixed;top:12px;right:12px;z-index:10001;display:none;border:2px solid white;background:#050507;color:white;border-radius:12px;padding:10px 14px;font-weight:900;cursor:pointer}
</style>
</head>
<body>
<div class="bg"></div><div id="particles"></div>
<div class="top"><h1>🎮 ${label}</h1><a class="home" href="/">Home</a></div>
<input id="search" class="search" placeholder="Search games...">
<div id="meta" class="meta">Loading games...</div>
<div class="pageControls"><button id="prevPage" class="pageBtn">⬅ Previous</button><div id="pageNum" class="pageIndicator">Page 1</div><button id="nextPage" class="pageBtn">Next ➡</button></div>
<div id="grid" class="grid"></div>
<button id="closePlayer" class="closePlayer">Close</button><iframe id="player" allow="autoplay; fullscreen; pointer-lock; gamepad; clipboard-read; clipboard-write" allowfullscreen></iframe>
<script src="/bootstrap-init.js"></script>
<script>
const PAGE_SOURCE = ${JSON.stringify(source)};
const PAGE_SIZE = 48;
const gnMathZonesUrls = [
  "https://raw.githubusercontent.com/gn-math/assets/main/zones.json",
  "https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json"
];
const gnMathCoverUrl = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const gnMathHtmlUrl = "https://cdn.jsdelivr.net/gh/gn-math/html@main";
let allGames = [];
let shownGames = [];
let currentPage = 1;
let totalPages = 1;
let luminReady = false;
let frame = null;

const grid = document.getElementById("grid");
const meta = document.getElementById("meta");
const search = document.getElementById("search");
const pageNum = document.getElementById("pageNum");
const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const player = document.getElementById("player");
const closePlayer = document.getElementById("closePlayer");

function fallbackThumb(game){
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#111"/><text x="160" y="96" fill="white" font-family="Arial" font-size="24" text-anchor="middle">' + String(game.name || "Game").replace(/[&<>]/g, "") + '</text></svg>');
}

function normalizeGnMathZone(zone){
  const url = String(zone.url || "").replaceAll("{COVER_URL}", gnMathCoverUrl).replaceAll("{HTML_URL}", gnMathHtmlUrl);
  const cover = String(zone.cover || "").replaceAll("{COVER_URL}", gnMathCoverUrl).replaceAll("{HTML_URL}", gnMathHtmlUrl);
  return { id:"gn-" + zone.id, name:zone.name || ("GN Math " + zone.id), cover_url:cover, html_url:url, source:"gn-math" };
}

async function startScramjet(){
  try{
    const controller = await initBootstrap();
    await controller.wait();
    frame = controller.createFrame(player);
  }catch(err){
    console.error("Scramjet failed", err);
  }
}

async function fetchJsonFromAny(urls){
  let lastError;
  for(const url of urls){
    try{
      const response = await fetch(url + (url.includes("?") ? "&" : "?") + "t=" + Date.now());
      if(!response.ok) throw new Error(response.status + " " + response.statusText);
      return await response.json();
    }catch(err){ lastError = err; }
  }
  throw lastError || new Error("Catalog failed");
}

async function getThumb(game){
  if(game.cover_url) return game.cover_url;
  if(game.image_token && window.Lumin) return await Lumin.getImageUrl(game.image_token);
  return fallbackThumb(game);
}

function setList(list){
  shownGames = list;
  totalPages = Math.max(1, Math.ceil(shownGames.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);
  renderPage();
}

async function renderPage(){
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageGames = shownGames.slice(start, start + PAGE_SIZE);
  pageNum.textContent = "Page " + currentPage + " / " + totalPages;
  prevPage.disabled = currentPage <= 1;
  nextPage.disabled = currentPage >= totalPages;
  grid.innerHTML = "";
  const images = await Promise.all(pageGames.map(g => getThumb(g).catch(() => fallbackThumb(g))));
  pageGames.forEach((game, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = '<div class="thumbWrap"><img class="thumb" loading="lazy" src="' + images[index] + '"><div class="gamePreview">▶ PLAY NOW</div></div><div class="gameTitle">🎮 ' + game.name + '</div>';
    card.onclick = () => openGame(game);
    grid.appendChild(card);
  });
}

async function openGame(game){
  if(game.html_url){
    if(!frame) await startScramjet();
    player.style.display = "block";
    closePlayer.style.display = "block";
    frame.go(game.html_url);
    return;
  }
  try{ await Lumin.loadGame(game.id); }catch(err){ console.error("Failed to load game", game.name, err); }
}

async function loadGnMathGames(){
  const zones = await fetchJsonFromAny(gnMathZonesUrls);
  return zones.filter(zone => zone && zone.id !== undefined && zone.name && zone.url).map(normalizeGnMathZone);
}

async function loadNikeHubGames(){
  return [{ id:"nikehub-home", name:"NikeHub", html_url:"https://nikehub.xyz", cover_url:fallbackThumb({ name:"NikeHub" }) }];
}

async function loadLuminGames(){
  await Lumin.init({ headless:true });
  luminReady = true;
  const first = await Lumin.getGames({ page:1, limit:96 });
  allGames = first.games || [];
  meta.textContent = (first.total || allGames.length) + " Lumin games";
  setList(allGames);
  const pages = first.pages || 1;
  const jobs = [];
  for(let page = 2; page <= pages; page++){
    jobs.push(async () => {
      const result = await Lumin.getGames({ page, limit:96 });
      allGames = allGames.concat(result.games || []);
      meta.textContent = allGames.length + " / " + (first.total || 1169) + " Lumin games loaded";
      if(!search.value.trim()) setList(allGames);
    });
  }
  for(let i = 0; i < jobs.length; i += 4){
    await Promise.all(jobs.slice(i, i + 4).map(job => job().catch(console.error)));
  }
  meta.textContent = allGames.length + " Lumin games loaded";
}

async function runSearch(query){
  const q = query.trim().toLowerCase();
  if(!q){ currentPage = 1; setList(allGames); return; }
  if(PAGE_SOURCE === "lumin" && luminReady && window.Lumin?.search){
    try{
      const result = await Lumin.search(q);
      const games = Array.isArray(result) ? result : (result.games || []);
      if(games.length){ currentPage = 1; setList(games); return; }
    }catch(err){ console.warn("Lumin search fell back to local list", err); }
  }
  currentPage = 1;
  setList(allGames.filter(game => game.name && game.name.toLowerCase().includes(q)));
}

prevPage.onclick = () => { if(currentPage > 1){ currentPage--; renderPage(); } };
nextPage.onclick = () => { if(currentPage < totalPages){ currentPage++; renderPage(); } };
search.addEventListener("input", event => runSearch(event.target.value));
closePlayer.onclick = () => { player.style.display = "none"; closePlayer.style.display = "none"; player.src = "about:blank"; };

for(let i = 0; i < 80; i++){
  const particle = document.createElement("div");
  particle.className = "particle";
  particle.style.left = Math.random() * 100 + "%";
  particle.style.top = Math.random() * 100 + "%";
  particle.style.animationDuration = 4 + Math.random() * 12 + "s";
  particle.style.animationDelay = Math.random() * 5 + "s";
  particle.style.opacity = Math.random();
  document.getElementById("particles").appendChild(particle);
}

(async () => {
  startScramjet();
  try{
    if(PAGE_SOURCE === "gnmath") allGames = await loadGnMathGames();
    else if(PAGE_SOURCE === "nikehub") allGames = await loadNikeHubGames();
    else return await loadLuminGames();
    meta.textContent = allGames.length + " games loaded";
    setList(allGames);
  }catch(err){
    console.error(err);
    meta.textContent = "Games failed to load.";
  }
})();
</script>
</body>
</html>`;
}
