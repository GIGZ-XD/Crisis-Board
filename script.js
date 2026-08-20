const URGENCY_WEIGHT = { low: 25, medium: 55, high: 78, critical: 100 };
const TYPE_BOOST = { Medical: 6, Rescue: 6, Shelter: 2, Food: 0, Transport: 0 };

let requests = [];
let counter = 100;
let currentTab = 'active';
let selectedUrgency = 'high';
let currentNames = [];
let editingChipIndex = null;
let editingCardId = null;

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'];
function bloodOptionsHtml(selected){
  return BLOOD_TYPES.map(bt => `<option value="${bt}" ${bt===selected ? 'selected' : ''}>${bt}</option>`).join('');
}

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

function renderNameChips(){
  const wrap = document.getElementById('nameChips');
  wrap.innerHTML = '';
  currentNames.forEach((person, idx)=>{
    const chip = document.createElement('span');

    if(editingChipIndex === idx){
      chip.className = 'chip-edit';
      chip.innerHTML = `
        <input type="text" value="${escapeHtml(person.name)}" data-edit-idx="${idx}" class="chip-edit-name">
        <select data-edit-idx="${idx}" class="chip-edit-blood">${bloodOptionsHtml(person.blood)}</select>
        <button type="button" class="chip-done" data-done-idx="${idx}" aria-label="Done editing">✓</button>
      `;
    } else {
      chip.className = 'name-chip';
      chip.innerHTML = `<button type="button" class="chip-label" data-edit-open="${idx}">${escapeHtml(person.name)} <span class="blood-tag">${escapeHtml(person.blood)}</span></button> <button type="button" aria-label="Remove ${escapeHtml(person.name)}" data-idx="${idx}">&times;</button>`;
    }
    wrap.appendChild(chip);
  });

  const hint = document.getElementById('nameCountHint');
  const peopleVal = parseInt(document.getElementById('people').value, 10) || 0;
  const atLimit = currentNames.length >= peopleVal;

  const nameInput = document.getElementById('nameInput');
  const bloodInput = document.getElementById('bloodInput');
  const addBtn = document.getElementById('addNameBtn');
  nameInput.disabled = atLimit;
  bloodInput.disabled = atLimit;
  addBtn.disabled = atLimit;

  if(peopleVal === 0){
    hint.textContent = 'Set "People Affected" to at least 1 before naming anyone.';
  } else if(currentNames.length === 0){
    hint.textContent = `You can name up to ${peopleVal} ${peopleVal === 1 ? 'person' : 'people'}.`;
  } else if(atLimit){
    hint.textContent = `Limit reached — all ${peopleVal} affected ${peopleVal === 1 ? 'person is' : 'people are'} named.`;
  } else {
    hint.textContent = `${currentNames.length} of ${peopleVal} named.`;
  }
}

function addName(){
  const input = document.getElementById('nameInput');
  const bloodSelect = document.getElementById('bloodInput');
  const peopleVal = parseInt(document.getElementById('people').value, 10) || 0;
  if(currentNames.length >= peopleVal) { renderNameChips(); return; }
  const val = input.value.trim();
  if(!val) return;
  currentNames.push({ name: val, blood: bloodSelect.value || 'Unknown' });
  input.value = '';
  bloodSelect.value = '';
  renderNameChips();
  input.focus();
}

document.getElementById('addNameBtn').addEventListener('click', addName);
document.getElementById('nameInput').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter'){
    e.preventDefault();
    addName();
  }
});
document.getElementById('nameChips').addEventListener('click', (e)=>{
  const openBtn = e.target.closest('button[data-edit-open]');
  if(openBtn){
    editingChipIndex = parseInt(openBtn.dataset.editOpen, 10);
    renderNameChips();
    return;
  }
  const doneBtn = e.target.closest('button[data-done-idx]');
  if(doneBtn){
    editingChipIndex = null;
    renderNameChips();
    return;
  }
  const removeBtn = e.target.closest('button[data-idx]');
  if(removeBtn){
    currentNames.splice(parseInt(removeBtn.dataset.idx, 10), 1);
    if(editingChipIndex !== null) editingChipIndex = null;
    renderNameChips();
  }
});
document.getElementById('nameChips').addEventListener('input', (e)=>{
  const input = e.target.closest('.chip-edit-name');
  if(!input) return;
  currentNames[parseInt(input.dataset.editIdx, 10)].name = input.value;
});
document.getElementById('nameChips').addEventListener('change', (e)=>{
  const select = e.target.closest('.chip-edit-blood');
  if(!select) return;
  currentNames[parseInt(select.dataset.editIdx, 10)].blood = select.value;
});
document.getElementById('nameChips').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' && e.target.closest('.chip-edit-name')){
    e.preventDefault();
    editingChipIndex = null;
    renderNameChips();
  }
});
document.getElementById('people').addEventListener('input', ()=>{
  const peopleVal = parseInt(document.getElementById('people').value, 10) || 0;
  if(currentNames.length > peopleVal){
    currentNames = currentNames.slice(0, peopleVal);
    editingChipIndex = null;
  }
  renderNameChips();
});
renderNameChips();

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
    names: [...currentNames],
    resolved:false, createdAt:new Date()
  };
  req.score = calcPriority(req);
  requests.push(req);

  e.target.reset();
  document.getElementById('people').value = 1;
  currentNames = [];
  renderNameChips();
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
        ${namesLine(r)}
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

function namesLine(r){
  if(editingCardId === r.id){
    const count = (r.names || []).length;
    const atLimit = count >= r.people;
    const rows = (r.names || []).map((p, idx) => `
      <div class="card-name-row">
        <input type="text" value="${escapeHtml(p.name)}" placeholder="Name"
               oninput="updateCardName(${r.id}, ${idx}, 'name', this.value)">
        <select onchange="updateCardName(${r.id}, ${idx}, 'blood', this.value)">${bloodOptionsHtml(p.blood)}</select>
        <button type="button" class="row-remove-btn" aria-label="Remove" onclick="removeCardName(${r.id}, ${idx})">&times;</button>
      </div>
    `).join('');
    return `
      <div class="card-names-edit">
        ${rows || '<span style="color:var(--muted-2); font-size:12.5px;">No one named yet.</span>'}
        <div class="card-names-edit-actions">
          <button type="button" class="card-add-row-btn" onclick="addCardName(${r.id})" ${atLimit ? 'disabled' : ''}>+ Add Person</button>
          <button type="button" class="card-done-btn" onclick="toggleCardEdit(${r.id})">Done</button>
        </div>
        <div class="card-names-limit-hint">${count} of ${r.people} named${atLimit ? ' — limit reached' : ''}</div>
      </div>
    `;
  }

  if(!r.names || r.names.length === 0){
    return `<div class="names-line"><button type="button" class="names-edit-btn" onclick="toggleCardEdit(${r.id})">+ Add names</button></div>`;
  }
  const shown = r.names.slice(0, 4)
    .map(p => `${escapeHtml(p.name)} <span class="blood-tag">${escapeHtml(p.blood)}</span>`)
    .join(', ');
  const extra = r.names.length > 4 ? ` +${r.names.length - 4} more` : '';
  return `<div class="names-line">🏷️ ${shown}${extra} <button type="button" class="names-edit-btn" onclick="toggleCardEdit(${r.id})">Edit</button></div>`;
}

function toggleCardEdit(id){
  editingCardId = editingCardId === id ? null : id;
  render();
}

function updateCardName(id, idx, field, value){
  const r = requests.find(r=>r.id===id);
  if(!r || !r.names[idx]) return;
  r.names[idx][field] = value;
}

function removeCardName(id, idx){
  const r = requests.find(r=>r.id===id);
  if(!r) return;
  r.names.splice(idx, 1);
  render();
}

function addCardName(id){
  const r = requests.find(r=>r.id===id);
  if(!r) return;
  if(!r.names) r.names = [];
  if(r.names.length >= r.people) return;
  r.names.push({ name:'', blood:'Unknown' });
  render();
}

function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// seed a couple of example requests so the board isn't empty on load
[
  {location:'Riverside Colony, Block 4', people:8, type:'Medical', urgency:'critical', names:[
    {name:'Asha Rao', blood:'O-'}, {name:'Vikram Nair', blood:'B+'}, {name:'Fatima Sheikh', blood:'AB+'}
  ]},
  {location:'Hilltop Shelter Camp', people:35, type:'Shelter', urgency:'high', names:[]},
  {location:'Old Bridge Road', people:3, type:'Rescue', urgency:'critical', names:[
    {name:'Rohan Das', blood:'A+'}, {name:'Priya Menon', blood:'Unknown'}, {name:'Arjun Kulkarni', blood:'O+'}
  ]},
  {location:'Sector 7 Community Hall', people:60, type:'Food', urgency:'medium', names:[]},
].forEach(d=>{
  const req = {id:counter++, resolved:false, createdAt:new Date(), ...d};
  req.score = calcPriority(req);
  requests.push(req);
});

render();
