/* js/app.js
 - Fetches GitHub repo listing from /.netlify/functions/list?path=...
 - Renders UI and handles search
 - Adds lightweight particle background canvas
*/

// CONFIG: excluded names (website files & folders)
const EXCLUDED = ["index.html", "styles.css", "js", "netlify", ".github", ".gitkeep"];

// ------------------ small particle background ------------------
(function particleBG(){
  try {
    // Respect prefers-reduced-motion and low-power devices
    const prm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowPower = navigator.deviceMemory && navigator.deviceMemory < 1.5;
    if (prm || lowPower) return; // don't run

    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.style.position = 'fixed';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let W = canvas.width = innerWidth;
    let H = canvas.height = innerHeight;

    const particles = [];
    const count = Math.round(Math.min(80, Math.max(20, (W*H) / 80000)));

    function rand(a,b){ return a + Math.random()*(b-a); }

    for (let i=0;i<count;i++){
      particles.push({
        x: rand(0,W),
        y: rand(0,H),
        r: rand(0.8,2.4),
        vx: rand(-0.25,0.25),
        vy: rand(-0.15,0.15),
        alpha: rand(0.08,0.45)
      });
    }

    function resize(){
      W = canvas.width = innerWidth;
      H = canvas.height = innerHeight;
    }
    addEventListener('resize', resize);

    function draw(){
      ctx.clearRect(0,0,W,H);
      // faint radial vignette
      const g = ctx.createLinearGradient(0,0,W,H);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,W,H);

      particles.forEach(p=>{
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        ctx.beginPath();
        ctx.fillStyle = `rgba(201,31,31,${p.alpha})`; // deep red
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      });

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  } catch (e) {
    // particle background is non-critical
    console.warn('particles failed', e);
  }
})();

// ------------------ GitHub list + render ------------------
async function api(path) {
  const url = '/.netlify/functions/list?path=' + encodeURIComponent(path || '');
  const res = await fetch(url);
  if (!res.ok) throw new Error('API error');
  return res.json();
}

function createItemEl(it, path) {
  const div = document.createElement('div');
  div.className = 'item';
  const left = document.createElement('div');
  left.className = 'left';

  const icon = document.createElement('div');
  icon.className = 'icon';
  icon.textContent = it.type === 'dir' ? 'F' : 'D';

  const nameWrap = document.createElement('div');
  nameWrap.style.minWidth = '0';
  const name = document.createElement('div');
  name.className = 'name';
  name.title = it.name;
  name.textContent = it.name;

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = it.type === 'dir' ? 'Folder' : 'File';

  nameWrap.appendChild(name);
  nameWrap.appendChild(meta);

  left.appendChild(icon);
  left.appendChild(nameWrap);

  const actions = document.createElement('div');
  actions.className = 'action';

  if (it.type === 'dir') {
    const a = document.createElement('a');
    a.href = '?path=' + encodeURIComponent(path ? `${path}/${it.name}` : it.name);
    a.textContent = 'Open';
    actions.appendChild(a);
  } else {
    const a = document.createElement('a');
    a.href = it.download_url || '#';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'Download';
    actions.appendChild(a);
  }

  div.appendChild(left);
  div.appendChild(actions);
  return div;
}

function render(path, items, filter = '') {
  const list = document.getElementById('folder-list');
  const crumbs = document.getElementById('breadcrumbs');
  const nicePath = path ? path : '';
  crumbs.textContent = `Path: /${nicePath}`;

  list.innerHTML = '';

  // filter and exclude website files/folders
  const visible = items
    .filter(it => !EXCLUDED.includes(it.name))
    .filter(it => {
      if (!filter) return true;
      return it.name.toLowerCase().includes(filter.toLowerCase());
    });

  if (visible.length === 0) {
    list.innerHTML = `<p class="muted">No files found${filter ? ' matching "'+filter+'"' : ''}.</p>`;
    return;
  }

  visible.forEach(it => {
    const el = createItemEl(it, path);
    list.appendChild(el);
  });
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const path = params.get('path') || '';
  const searchInput = document.getElementById('search');
  const clearBtn = document.getElementById('clear-search');

  let data = [];
  try {
    data = await api(path);
  } catch (e) {
    document.getElementById('folder-list').innerHTML = '<p class="muted">Failed to load resources.</p>';
    console.error(e);
    return;
  }

  // initial render
  render(path, data);

  // search handler (debounced simple)
  let to = null;
  searchInput.addEventListener('input', (ev) => {
    const q = ev.target.value || '';
    clearTimeout(to);
    to = setTimeout(() => render(path, data, q), 160);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    render(path, data, '');
  });

  // Hide clear button on small screens if empty
  function adjustClear() {
    clearBtn.style.display = searchInput.value.trim() ? 'inline-flex' : 'none';
  }
  searchInput.addEventListener('input', adjustClear);
  adjustClear();
}

document.addEventListener('DOMContentLoaded', init);
