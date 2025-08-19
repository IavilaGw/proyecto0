const taskListEl = document.getElementById('taskList');
const catListEl  = document.getElementById('catList');
const taskCatSel = document.getElementById('taskCat');

document.getElementById('logoutBtn').onclick = () => { auth.logout(); location.href = 'index.html'; };

// Tabs/menus
document.querySelectorAll('.menu .menu-item').forEach(btn=>{
  btn.addEventListener('click', () => switchView(btn.dataset.view, btn));
});
function switchView(view, btn){
  document.querySelectorAll('.menu .menu-item').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');

  document.getElementById('categoriesSection').classList.toggle('hidden', view!=='categories');
  document.getElementById('tasksSection').classList.toggle('hidden', view==='categories');
  document.getElementById('viewTitle').textContent = view==='categories' ? 'Categories' : 'My Tasks';
}

// Cargar datos iniciales
init();
async function init(){
  await Promise.all([loadCategories(), loadMyTasks()]);
}

// ---------- Categorías ----------
async function loadCategories(){
  catListEl.innerHTML = '<li class="muted">Loading…</li>';
  const res = await api.get('/categorias');
  const data = await res.json();
  if (!res.ok) { catListEl.innerHTML = `<li class="muted">Error: ${data.message||res.status}</li>`; return; }

  // data: lista de categorías (se asume {ID, Nombre, Descripcion})
  catListEl.innerHTML = '';
  taskCatSel.innerHTML = '<option value="">Select category</option>';
  (data || []).forEach(c => {
    // Relleno select para crear tareas
    const opt = document.createElement('option');
    opt.value = c.ID ?? c.id ?? c.Id;
    opt.textContent = c.Nombre ?? c.nombre;
    taskCatSel.appendChild(opt);

    // Ítem de lista
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <div class="meta">
        <strong>${c.Nombre ?? c.nombre}</strong>
        <small>${c.Descripcion ?? c.descripcion ?? ''}</small>

      </div>
      <div class="actions">
        <button class="btn btn-danger" data-del-cat="${opt.value}">Delete</button>
      </div>`;
    catListEl.appendChild(li);
  });

  // Bind borrar
  catListEl.querySelectorAll('[data-del-cat]').forEach(btn=>{
    btn.onclick = () => deleteCategory(btn.dataset.delCat);
  });
}

async function createCategory(name, desc){
  const res = await api.post('/categorias', { nombre: name, descripcion: desc });
  if (!res.ok) {
    const e = await res.json().catch(()=>({}));
    throw new Error(e.message || `Error ${res.status}`);
  }
}
async function deleteCategory(id){
  const res = await api.del(`/categorias/${id}`);
  if (!res.ok) {
    const e = await res.json().catch(()=>({}));
    alert(e.message || `Error ${res.status}`);
    return;
  }
  await loadCategories();
}

// Form de nueva categoría
document.getElementById('newCatForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const nombre = document.getElementById('catName').value.trim();
  const descripcion = document.getElementById('catDesc').value.trim();
  try{
    await createCategory(nombre, descripcion);
    e.target.reset();
    await loadCategories();
  }catch(err){
    alert(err.message);
  }
});

// ---------- Tareas ----------
async function loadMyTasks(){
  taskListEl.innerHTML = '<li class="muted">Loading…</li>';
  const res = await api.get('/tareas/usuario');
  const data = await res.json();
  if (!res.ok) { taskListEl.innerHTML = `<li class="muted">Error: ${data.message||res.status}</li>`; return; }

  // Se asume arreglo con {ID, Texto, FechaTentativaFin, Estado, Categoria:{Nombre}}
  renderTasks(data || []);
}

function renderTasks(tasks){
  taskListEl.innerHTML = '';
  tasks.forEach(t=>{
    const id = t.ID ?? t.id ?? t.Id;
    const texto = t.Texto ?? t.texto;
    const estado = (t.Estado ?? t.estado ?? 'En progreso');
    const fecha = (t.FechaTentativaFin ?? t.fechaTentativaFin) || '';
    const cat   = t.Categoria?.Nombre ?? t.categoria?.nombre ?? '—';

    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <div class="meta">
        <strong>${texto}</strong>
        <small>Due: ${fecha || '—'} · <span class="badge">${cat}</span></small>
      </div>
      <div class="actions">
        <select data-status="${id}">
          <option ${/Finalizada/i.test(estado)?'':'selected'}>En progreso</option>
          <option ${/Finalizada/i.test(estado)?'selected':''}>Finalizada</option>
        </select>
        <button class="btn btn-light" data-save="${id}">Save</button>
        <button class="btn btn-danger" data-del="${id}">Delete</button>
      </div>`;
    taskListEl.appendChild(li);
  });

  // Bind acciones
  taskListEl.querySelectorAll('[data-save]').forEach(btn=>{
    btn.onclick = async ()=>{
      const id = btn.dataset.save;
      const statusSel = taskListEl.querySelector(`[data-status="${id}"]`);
      const estado = statusSel.value;
      await updateTask(id, { estado });
      await loadMyTasks();
    };
  });
  taskListEl.querySelectorAll('[data-del]').forEach(btn=>{
    btn.onclick = async ()=>{
      await deleteTask(btn.dataset.del);
      await loadMyTasks();
    };
  });
}

async function createTask({ texto, fechaTentativaFin, id_categoria }){
  const body = { texto };
  if (fechaTentativaFin) body.fechaTentativaFin = fechaTentativaFin;
  if (id_categoria) body.id_categoria = Number(id_categoria);
  const res = await api.post('/tareas', body);
  if (!res.ok) {
    const e = await res.json().catch(()=>({}));
    throw new Error(e.message || `Error ${res.status}`);
  }
}
async function updateTask(id, { texto, estado }){
  const body = {};
  if (texto) body.texto = texto;
  if (estado) body.estado = estado;
  const res = await api.put(`/tareas/${id}`, body);
  if (!res.ok) {
    const e = await res.json().catch(()=>({}));
    throw new Error(e.message || `Error ${res.status}`);
  }
}
async function deleteTask(id){
  const res = await api.del(`/tareas/${id}`);
  if (!res.ok) {
    const e = await res.json().catch(()=>({}));
    throw new Error(e.message || `Error ${res.status}`);
  }
}

// Form nueva tarea
document.getElementById('newTaskForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const texto = document.getElementById('taskText').value.trim();
  const fechaTentativaFin = document.getElementById('taskDate').value;
  const id_categoria = document.getElementById('taskCat').value;

  try{
    await createTask({ texto, fechaTentativaFin, id_categoria });
    e.target.reset();
    await loadMyTasks();
  }catch(err){
    alert(err.message);
  }
});
