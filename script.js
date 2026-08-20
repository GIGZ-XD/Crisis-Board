const URGENCY_WEIGHT = { low: 25, medium: 55, high: 78, critical: 100 };
const TYPE_BOOST = { Medical: 6, Rescue: 6, Shelter: 2, Food: 0, Transport: 0 };

let requests = [];
let counter = 100;
let currentTab = 'active';
let selectedUrgency = 'high';

function calcPriority(req){
  const uScore = URGENCY_WEIGHT[req.urgency];
  const peopleScore = Math.min(req.people, 60) / 60 * 100;
  let score = uScore * 0.62 + peopleScore * 0.32 + (TYPE_BOOST[req.type] || 0);
  score = Math.min(100, Math.round(score));
  return score;
}

function fmtTime(d){
  return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
}

function updateClock(){
  document.getElementById('clockTime').textContent = fmtTime(new Date());
}
updateClock();
setInterval(updateClock, 1000);

document.getElementById('urgencyRow').addEventListener('click', (e)=>{
  const opt = e.target.closest('.urgency-opt');
  if(!opt) return;
  document.querySelectorAll('.urgency-opt').forEach(o=>o.classList.remove('sel'));
  opt.classList.add('sel');
  selectedUrgency = opt.dataset.level;
});

document.querySelectorAll('.tab').forEach(t=>{
  t.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    currentTab = t.dataset.tab;
    render();
  });
});

document.getElementById('reqForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const location = document.getElementById('location').value.trim();
  const people = parseInt(document.getElementById('people').value, 10) || 1;
  const type = document.getElementById('type').value;

  const req = {
    id: counter++,
    location: location || 'Unspecified location',
    people, type, urgency: selectedUrgency,
    resolved:false, createdAt:new Date()
  };
  req.score = calcPriority(req);
  requests.push(req);

  e.target.reset();
  document.getElementById('people').value = 1;
  render();
});

function resolveReq(id){
  const r = requests.find(r=>r.id===id);
  if(r) r.resolved = true;
  render();
}

function render(){
  const active = requests.filter(r=>!r.resolved).sort((a,b)=>b.score-a.score);
  const resolved = requests.filter(r=>r.resolved).sort((a,b)=>b.id-a.id);

  document.getElementById('statActive').textContent = active.length;
  document.getElementById('statResolved').textContent = resolved.length;
  document.getElementById('statPeople').textContent = active.reduce((s,r)=>s+r.people,0);
  document.getElementById('statTop').textContent = active.length ? '#'+active[0].id : '—';

  const list = currentTab === 'active' ? active : resolved;
  const container = document.getElementById('cards');
  container.innerHTML = '';

  if(list.length === 0){
    container.innerHTML = `<div class="empty">${currentTab === 'active' ? 'No active requests. The board is clear.' : 'No resolved requests yet.'}</div>`;
    return;
  }

  list.forEach((r, i)=>{
    const card = document.createElement('div');
    card.className = 'card' + (r.resolved ? ' resolved' : '');
    card.dataset.level = r.urgency;
    card.innerHTML = `
      <div class="rank"><span class="num">#${r.resolved ? '—' : (i+1)}</span>${r.resolved ? '' : `<span class="of">of ${active.length}</span>`}</div>
      <div class="card-body">
        <div class="title-row">
          <span class="req-id">REQ #${r.id}</span>
          <span class="req-type">${r.type} Assistance</span>
          <span class="badge">${r.urgency}</span>
        </div>
        <div class="meta">
          <span>📍 ${escapeHtml(r.location)}</span>
          <span>👥 ${r.people} people affected</span>
          <span>🕒 ${fmtTime(r.createdAt)}</span>
        </div>
      </div>
      <div class="card-right">
        <div class="score-wrap">
          <div class="score">${r.score}<span style="font-size:12px;color:var(--muted-2);">/100</span></div>
          <div class="score-label">Priority Score</div>
          <div class="meter"><div class="meter-fill" style="width:${r.score}%;"></div></div>
        </div>
        <button class="resolve-btn" onclick="resolveReq(${r.id})">Mark Resolved</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// seed a couple of example requests so the board isn't empty on load
[
  {location:'Riverside Colony, Block 4', people:8, type:'Medical', urgency:'critical'},
  {location:'Hilltop Shelter Camp', people:35, type:'Shelter', urgency:'high'},
  {location:'Old Bridge Road', people:3, type:'Rescue', urgency:'critical'},
  {location:'Sector 7 Community Hall', people:60, type:'Food', urgency:'medium'},
].forEach(d=>{
  const req = {id:counter++, resolved:false, createdAt:new Date(), ...d};
  req.score = calcPriority(req);
  requests.push(req);
});

render();
