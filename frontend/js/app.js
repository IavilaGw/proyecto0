const taskListEl = document.getElementById('taskList');
const catListEl  = document.getElementById('catList');
const taskCatSel = document.getElementById('taskCat');
const tabs = document.querySelectorAll('.tab');
const menuBtns = document.querySelectorAll('.menu .menu-item');
let CATEGORIES = [];

let ALL_TASKS = [];
let CURRENT_FILTER = 'all';

// ---- User bar ----
const unameEl  = document.getElementById('uname');
const avatarEl = document.getElementById('avatar');
const changeAvatarBtn = document.getElementById('changeAvatarBtn');
const setAvatarUrlBtn = document.getElementById('setAvatarUrlBtn');
const avatarFile = document.getElementById('avatarFile');
const removeAvatarBtn = document.getElementById('removeAvatarBtn'); // (opcional si agregas el botón)

function currentUsername() {
  return localStorage.getItem('username') || '';
}
function avatarKeyFor(user) {
  return user ? `u:${user}:avatarUrl` : 'avatarUrl';
}

function loadUserbar(){
  const name = currentUsername() || 'User';

  // 1) avatar elegido por el usuario (local, por-usuario)
  const localAvatar = localStorage.getItem(avatarKeyFor(name));

  // 2) avatar que pudo guardarse al registrarse (si el usuario puso URL allí)
  const serverAvatar = localStorage.getItem(`u:${name}:serverAvatar`);

  // 3) placeholder si no hay nada
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E5E7EB&color=111827`;

  const img = localAvatar || serverAvatar || fallback;

  if (unameEl)  unameEl.textContent = name;
  if (avatarEl) avatarEl.src = img;
}

// Subir archivo (lo guarda por-usuario)
if (changeAvatarBtn) changeAvatarBtn.onclick = () => avatarFile?.click();
if (avatarFile) avatarFile.onchange = (e)=>{
  const file = e.target.files?.[0];
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    const name = currentUsername();
    localStorage.setItem(avatarKeyFor(name), rd.result);
    loadUserbar();
  };
  rd.readAsDataURL(file);
};

// Pegar URL (lo guarda por-usuario)
if (setAvatarUrlBtn) setAvatarUrlBtn.onclick = ()=>{
  const url = prompt('Paste image URL');
  if (!url) return;
  const name = currentUsername();
  localStorage.setItem(avatarKeyFor(name), url);
  loadUserbar();
};

// Quitar foto personalizada (vuelve a server/placeholder)
if (removeAvatarBtn) removeAvatarBtn.onclick = ()=>{
  const name = currentUsername();
  localStorage.removeItem(avatarKeyFor(name));
  loadUserbar();
};


// ---- Auth/logout ----
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.onclick = () => { auth.logout(); location.href = 'index.html'; };

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
const searchEl = document.getElementById('search');
if (searchEl) searchEl.addEventListener('input', (e)=>{
  renderTasks(ALL_TASKS, e.target.value.trim().toLowerCase());
});

// ---- Init ----
init();
async function init(){
  if (!auth.isLogged()) { location.href = 'login.html'; return; }
  loadUserbar();
  await loadCategories();  // Load categories first
  await loadMyTasks();     // Then load tasks
}

// ========== Helpers ==========
function normalizeStatus(s){ return /final/i.test(s||'') ? 'Finalizada' : 'En progreso'; }
function toDateInputValue(s){
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d)) return '';
  return d.toISOString().slice(0,10);
}
function formatDue(s){
  const v = toDateInputValue(s);
  return v || '—';
}

function show401Redirect(res){
  if (res.status === 401) {
    alert('Sesión expirada. Vuelve a iniciar sesión.');
    auth.logout(); location.href = 'login.html';
    return true;
  }
  return false;
}

// ========== Categorías ==========
async function loadCategories(){
  console.log('CARGANDO CATEGORIAS')
  catListEl.innerHTML = '<li class="muted">Loading…</li>';
  const res = await api.get('/categorias');
  console.log(res);
  if (show401Redirect(res)) return;
  const data = await res.json().catch(()=>[]);
  if (!res.ok) { catListEl.innerHTML = `<li class="muted">Error: ${data?.message||res.status}</li>`; return; }

  CATEGORIES = data || [];             // <--- guarda todas las categorías

  catListEl.innerHTML = '';
  taskCatSel.innerHTML = '<option value="">Select category</option>';

  CATEGORIES.forEach(c => {
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
        <small class="muted">${desc}</small>
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
  if (show401Redirect(res)) return;
  if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
}
async function deleteCategory(id){
  const res = await api.del(`/categorias/${id}`);
  if (show401Redirect(res)) return;
  if (!res.ok) { alert(await res.text() || `Error ${res.status}`); return; }
  await loadCategories();
}

document.getElementById('newCatForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const nombre = document.getElementById('catName').value.trim();
  const descripcion = document.getElementById('catDesc').value.trim();
  try{
    await createCategory(nombre, descripcion);
    e.target.reset();
    await loadCategories();
  }catch(err){ alert(err.message); }
});

// ========== Tareas ==========
async function loadMyTasks(){
  // Wait for categories to be loaded first
  if (!CATEGORIES.length) {
    console.log("No categories loaded, loading them first...");
    await loadCategories();
  }
  
  console.log("Starting to load tasks...");
  taskListEl.innerHTML = '<li class="muted">Loading…</li>';
  
  const res = await api.get('/tareas/usuario');
  console.log("API response status:", res.status);
  
  if (show401Redirect(res)) return;
  const data = await res.json().catch(()=>[]);
  console.log("Parsed response data:", data);
  
  if (!res.ok) { 
    console.log("API error:", res.status, data);
    taskListEl.innerHTML = `<li class="muted">Error: ${data?.message||res.status}</li>`; 
    return; 
  }
   
  // Debug: log the first task to see its structure
  if (data && data.length > 0) {
    console.log('First task data:', data[0]);
    console.log('Categories array:', CATEGORIES);
  } else {
    console.log("No data received");
  }
   
  ALL_TASKS = data || [];
  renderTasks(ALL_TASKS);
}

// Resuelve id y nombre de categoría aunque venga solo el id
function getCategoryId(t){
  return t.IdCategoria ?? t.idCategoria ?? t.id_categoria ??
         t.CategoriaID ?? t.categoriaId ?? t.categoria_id ??
         t.Categoria?.ID ?? t.categoria?.id ?? null;
}
function getCategoryName(t){
  // si viene anidada, úsala
  const nested = t.Categoria?.nombre ?? t.categoria?.nombre;

  if (nested) return nested;
  // si vino solo el id, búscalo en el arreglo global CATEGORIES
  const cid = getCategoryId(t);
  if (!cid) return '—';
  const list = CATEGORIES || [];
  const found = list.find(c => (c.ID ?? c.id ?? c.Id) == cid);
  return found ? (found.Nombre ?? found.nombre ?? '—') : '—';
}

function renderTasks(tasks, q=''){
  taskListEl.innerHTML = '';

  const filtered = tasks.filter(t=>{
    const estado = normalizeStatus(t.Estado ?? t.estado);
    if (CURRENT_FILTER === 'inprogress' && estado !== 'En progreso') return false;
    if (CURRENT_FILTER === 'finalizada' && estado !== 'Finalizada') return false;
    if (q && !(t.Texto ?? t.texto ?? '').toLowerCase().includes(q)) return false;
    return true;
  });

  if (!filtered.length){
    taskListEl.innerHTML = '<li class="muted">No tasks</li>';
    return;
  }

  filtered.forEach(t=>{
    const id     = t.ID ?? t.id ?? t.Id;
    const texto  = t.Texto ?? t.texto ?? '';
    const estado = normalizeStatus(t.Estado ?? t.estado);
    const fecha  = (t.FechaTentativaFin ?? t.fechaTentativaFin) || '';

    const catId  = getCategoryId(t) || '';
    const catNm  = getCategoryName(t);

    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <div class="meta">
        <!-- Vista normal -->
        <div class="meta-line" data-view-row="${id}">
          <div>
            <strong data-view-text="${id}">${texto}</strong>
            <div><small class="muted">Category: <span class="badge">${catNm}</span></small></div>
          </div>
          <small class="muted">Due: ${formatDue(fecha)}</small>
        </div>

        <!-- Panel de edición (oculto por defecto) -->
        <div class="row hidden" data-edit-panel="${id}">
          <input class="inline" type="text" value="${texto}" data-edit-text="${id}" />
          <input class="inline" type="date" value="${toDateInputValue(fecha)}" data-edit-date="${id}" />
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
        <button class="btn btn-primary" data-finish="${id}" ${estado==='Finalizada'?'disabled':''}>Complete</button>
        <button class="btn btn-danger" data-del="${id}">Delete</button>
      </div>`;

    taskListEl.appendChild(li);

    // posiciona el select de categoría en el panel de edición
    const sel = li.querySelector(`[data-edit-cat="${id}"]`);
    if (sel && catId) sel.value = String(catId);
  });

  // vuelve a enlazar acciones (Edit/Save/Cancel/Finalize/Delete)
  bindTaskActions();
}

function bindTaskActions(){
  taskListEl.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.edit;
      const panel = taskListEl.querySelector(`[data-edit-panel="${id}"]`);
      const view  = taskListEl.querySelector(`[data-view-row="${id}"]`);
      const save  = taskListEl.querySelector(`[data-save="${id}"]`);
      const cancel= taskListEl.querySelector(`[data-cancel="${id}"]`);
      panel.classList.remove('hidden');
      view.classList.add('hidden');
      save.classList.remove('hidden');
      cancel.classList.remove('hidden');
      btn.classList.add('hidden');
    };
  });

  taskListEl.querySelectorAll('[data-cancel]').forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.cancel;
      const panel = taskListEl.querySelector(`[data-edit-panel="${id}"]`);
      const view  = taskListEl.querySelector(`[data-view-row="${id}"]`);
      const edit  = taskListEl.querySelector(`[data-edit="${id}"]`);
      const save  = taskListEl.querySelector(`[data-save="${id}"]`);
      panel.classList.add('hidden'); view.classList.remove('hidden');
      save.classList.add('hidden'); btn.classList.add('hidden'); edit.classList.remove('hidden');
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
      if (dateInp && dateInp.value) body.fechaTentativaFin = dateInp.value; // yyyy-mm-dd
      if (catSel && catSel.value) body.id_categoria = Number(catSel.value);
      if (stSel && stSel.value) body.estado = stSel.value;

      try{
        const res = await api.put(`/tareas/${id}`, body);
        if (show401Redirect(res)) return;
        if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
        await loadMyTasks();
      }catch(err){ alert(err.message); }
    };
  });

  taskListEl.querySelectorAll('[data-finish]').forEach(btn=>{
    btn.onclick = async ()=>{
      const id = btn.dataset.finish;
      try{
        const res = await api.put(`/tareas/${id}`, { estado: 'Finalizada' });
        if (show401Redirect(res)) return;
        if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
        await loadMyTasks();
      }catch(err){ alert(err.message); }
    };
  });

  taskListEl.querySelectorAll('[data-del]').forEach(btn=>{
    btn.onclick = async ()=>{
      try{
        const res = await api.del(`/tareas/${btn.dataset.del}`);
        if (show401Redirect(res)) return;
        if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
        await loadMyTasks();
      }catch(err){ alert(err.message); }
    };
  });
}

// Crear tarea
document.getElementById('newTaskForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const msgEl = document.getElementById('newTaskMsg');
  msgEl.textContent = ''; msgEl.classList.remove('error');

  const texto = document.getElementById('taskText').value.trim();
  const fechaTentativaFin = document.getElementById('taskDate').value; // yyyy-mm-dd
  const id_categoria = document.getElementById('taskCat').value;

  if (!id_categoria) { msgEl.textContent = 'Please select a category.'; msgEl.classList.add('error'); return; }

  const body = { texto, id_categoria: Number(id_categoria) };
  if (fechaTentativaFin) body.fechaTentativaFin = fechaTentativaFin;

  try{
    const res = await api.post('/tareas', body);
    if (show401Redirect(res)) return;
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text || 'error'}`);
    e.target.reset();
    await loadMyTasks();
  }catch(err){
    msgEl.textContent = err.message || 'Failed to create task';
    msgEl.classList.add('error');
    console.error(err);
  }
});
