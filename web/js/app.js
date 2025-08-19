const taskListEl = document.getElementById('taskList');
const catListEl  = document.getElementById('catList');
const taskCatSel = document.getElementById('taskCat');
const tabs = document.querySelectorAll('.tab');
const menuBtns = document.querySelectorAll('.menu .menu-item');

let ALL_TASKS = [];
let CURRENT_FILTER = 'all';

// ---- User bar ----
const unameEl  = document.getElementById('uname');
const avatarEl = document.getElementById('avatar');
const changeAvatarBtn = document.getElementById('changeAvatarBtn');
const setAvatarUrlBtn = document.getElementById('setAvatarUrlBtn');
const avatarFile = document.getElementById('avatarFile');

function loadUserbar(){
  const name = localStorage.getItem('username') || 'User';
  const stored = localStorage.getItem('avatarUrl');
  const avatar = stored || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E5E7EB&color=111827`;
  unameEl.textContent = name;
  avatarEl.src = avatar;
}
changeAvatarBtn.onclick = ()=> avatarFile.click();
avatarFile.onchange = (e)=>{
  const file = e.target.files?.[0];
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => { localStorage.setItem('avatarUrl', rd.result); loadUserbar(); };
  rd.readAsDataURL(file);
};
setAvatarUrlBtn.onclick = ()=>{
  const url = prompt('Paste image URL');
  if (!url) return;
  localStorage.setItem('avatarUrl', url);
  loadUserbar();
};

// ---- Auth/logout ----
document.getElementById('logoutBtn').onclick = () => { auth.logout(); location.href = 'index.html'; };

// ---- Menu switching ----
menuBtns.forEach(btn=>{
  btn.addEventListener('click', () => {
    menuBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    document.getElementById('categoriesSection').classList.toggle('hidden', view!=='categories');
    document.getElementById('tasksSection').classList.toggle('hidden', view==='categories');
    document.getElementById('viewTitle').textContent = view==='categories' ? 'Categories' : 'My Tasks';
  });
});

// ---- Tabs / filters ----
tabs.forEach(t => t.addEventListener('click', ()=>{
  tabs.forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  CURRENT_FILTER = t.dataset.filter;
  renderTasks(ALL_TASKS);
}));

// ---- Search ----
document.getElementById('search').addEventListener('input', (e)=>{
  renderTasks(ALL_TASKS, e.target.value.trim().toLowerCase());
});

// ---- Init ----
init();
async function init(){
  loadUserbar();
  await Promise.all([loadCategories(), loadMyTasks()]);
}

// ---------- Categorías ----------
async function loadCategories(){
  catListEl.innerHTML = '<li class="muted">Loading…</li>';
  const res = await api.get('/categorias');
  const data = await res.json();
  if (!res.ok) { catListEl.innerHTML = `<li class="muted">Error: ${data.message||res.status}</li>`; return; }

  catListEl.innerHTML = '';
  taskCatSel.innerHTML = '<option value="">Select category</option>';

  (data || []).forEach(c => {
    const id   = c.ID ?? c.id ?? c.Id;
    const name = c.Nombre ?? c.nombre ?? '';
    const desc = c.Descripcion ?? c.descripcion ?? '';

    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = name;
    taskCatSel.appendChild(opt);

    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <div class="meta">
        <strong>${name}</strong>
        <small>${desc}</small>
      </div>
      <div class="actions">
        <button class="btn btn-danger" data-del-cat="${id}">Delete</button>
      </div>`;
    catListEl.appendChild(li);
  });

  catListEl.querySelectorAll('[data-del-cat]').forEach(btn=>{
    btn.onclick = () => deleteCategory(btn.dataset.delCat);
  });
}

async function createCategory(name, desc){
  const res = await api.post('/categorias', { nombre: name, descripcion: desc });
  if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
}
async function deleteCategory(id){
  const res = await api.del(`/categorias/${id}`);
  if (!res.ok) { alert(await res.text() || `Error ${res.status}`); return; }
  await loadCategories();
}

document.getElementById('newCatForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const nombre = document.getElementById('catName').value.trim();
  const descripcion = document.getElementById('catDesc').value.trim();
  try{
    await createCategory(nombre, descripcion);
    e.target.reset();
    await loadCategories();
  }catch(err){ alert(err.message); }
});

// ---------- Tareas ----------
async function loadMyTasks(){
  taskListEl.innerHTML = '<li class="muted">Loading…</li>';
  const res = await api.get('/tareas/usuario');
  const data = await res.json();
  if (!res.ok) { taskListEl.innerHTML = `<li class="muted">Error: ${data.message||res.status}</li>`; return; }
  ALL_TASKS = data || [];
  renderTasks(ALL_TASKS);
}

function normalizeStatus(s){ return /final/i.test(s||'') ? 'Finalizada' : 'En progreso'; }

function renderTasks(tasks, q=''){
  taskListEl.innerHTML = '';
  const filtered = tasks.filter(t=>{
    const estado = normalizeStatus(t.Estado ?? t.estado);
    if (CURRENT_FILTER === 'inprogress' && estado !== 'En progreso') return false;
    if (CURRENT_FILTER === 'finalizada' && estado !== 'Finalizada') return false;
    if (q && !(t.Texto ?? t.texto ?? '').toLowerCase().includes(q)) return false;
    return true;
  });

  if (!filtered.length){ taskListEl.innerHTML = '<li class="muted">No tasks</li>'; return; }

  filtered.forEach(t=>{
    const id     = t.ID ?? t.id ?? t.Id;
    const texto  = t.Texto ?? t.texto ?? '';
    const estado = normalizeStatus(t.Estado ?? t.estado);
    const fecha  = (t.FechaTentativaFin ?? t.fechaTentativaFin) || '';
    const catId  = t.Categoria?.ID ?? t.categoria?.id ?? '';
    const catNm  = t.Categoria?.Nombre ?? t.categoria?.nombre ?? '—';

    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <div class="meta">
        <strong data-view-text="${id}">${texto}</strong>
        <div class="row">
          <small>Due: ${fecha || '—'} · <span class="badge">${catNm}</span> · <span class="pill ${estado==='Finalizada'?'done':''}">${estado}</span></small>
        </div>

        <!-- Panel de edición (oculto por defecto) -->
        <div class="row hidden" data-edit-panel="${id}">
          <input class="inline" type="text" value="${texto}" data-edit-text="${id}" />
          <input class="inline" type="date" value="${fecha}" data-edit-date="${id}" />
          <select class="inline" data-edit-cat="${id}">${taskCatSel.innerHTML}</select>
          <select class="inline" data-edit-status="${id}">
            <option ${estado==='En progreso'?'selected':''}>En progreso</option>
            <option ${estado==='Finalizada'?'selected':''}>Finalizada</option>
          </select>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-light" data-edit="${id}">Edit</button>
        <button class="btn btn-success hidden" data-save="${id}">Save</button>
        <button class="btn btn-light hidden" data-cancel="${id}">Cancel</button>
        <button class="btn btn-primary" data-finish="${id}" ${estado==='Finalizada'?'disabled':''}>Finalize</button>
        <button class="btn btn-danger" data-del="${id}">Delete</button>
      </div>`;
    taskListEl.appendChild(li);

    // set select category to current
    const sel = li.querySelector(`[data-edit-cat="${id}"]`);
    if (sel && catId) sel.value = String(catId);
  });

  bindTaskActions();
}

function bindTaskActions(){
  taskListEl.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.edit;
      const panel = taskListEl.querySelector(`[data-edit-panel="${id}"]`);
      const save  = taskListEl.querySelector(`[data-save="${id}"]`);
      const cancel= taskListEl.querySelector(`[data-cancel="${id}"]`);
      panel.classList.remove('hidden');
      save.classList.remove('hidden');
      cancel.classList.remove('hidden');
      btn.classList.add('hidden');
    };
  });

  taskListEl.querySelectorAll('[data-cancel]').forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.cancel;
      const panel = taskListEl.querySelector(`[data-edit-panel="${id}"]`);
      const edit  = taskListEl.querySelector(`[data-edit="${id}"]`);
      const save  = taskListEl.querySelector(`[data-save="${id}"]`);
      panel.classList.add('hidden'); save.classList.add('hidden'); btn.classList.add('hidden'); edit.classList.remove('hidden');
    };
  });

  taskListEl.querySelectorAll('[data-save]').forEach(btn=>{
    btn.onclick = async ()=>{
      const id = btn.dataset.save;
      const textInp = taskListEl.querySelector(`[data-edit-text="${id}"]`);
      const dateInp = taskListEl.querySelector(`[data-edit-date="${id}"]`);
      const catSel  = taskListEl.querySelector(`[data-edit-cat="${id}"]`);
      const stSel   = taskListEl.querySelector(`[data-edit-status="${id}"]`);

      const body = {};
      if (textInp && textInp.value.trim()) body.texto = textInp.value.trim();
      if (dateInp && dateInp.value) body.fechaTentativaFin = dateInp.value;
      if (catSel && catSel.value) body.id_categoria = Number(catSel.value);
      if (stSel && stSel.value) body.estado = stSel.value;

      try{
        await updateTask(id, body);
        await loadMyTasks();
      }catch(err){ alert(err.message); }
    };
  });

  taskListEl.querySelectorAll('[data-finish]').forEach(btn=>{
    btn.onclick = async ()=>{
      const id = btn.dataset.finish;
      try{
        await updateTask(id, { estado: 'Finalizada' });
        await loadMyTasks();
      }catch(err){ alert(err.message); }
    };
  });

  taskListEl.querySelectorAll('[data-del]').forEach(btn=>{
    btn.onclick = async ()=>{
      try{
        await deleteTask(btn.dataset.del);
        await loadMyTasks();
      }catch(err){ alert(err.message); }
    };
  });
}

async function createTask({ texto, fechaTentativaFin, id_categoria }){
  const body = { texto };
  if (fechaTentativaFin) body.fechaTentativaFin = fechaTentativaFin;
  if (id_categoria) body.id_categoria = Number(id_categoria);
  const res = await api.post('/tareas', body);
  if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
}
async function updateTask(id, body){
  const res = await api.put(`/tareas/${id}`, body);
  if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
}
async function deleteTask(id){
  const res = await api.del(`/tareas/${id}`);
  if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
}

document.getElementById('newTaskForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const texto = document.getElementById('taskText').value.trim();
  const fechaTentativaFin = document.getElementById('taskDate').value;
  const id_categoria = document.getElementById('taskCat').value;

  try{
    await createTask({ texto, fechaTentativaFin, id_categoria });
    e.target.reset();
    await loadMyTasks();
  }catch(err){ alert(err.message); }
});
