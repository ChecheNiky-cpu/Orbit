// ═══════════════════════════════════════════════════
//  ORBIT — Task Manager v3 · Full Feature Build
// ═══════════════════════════════════════════════════

// ── CONSTANTS ──
// Paleta de fondo de los grupos, por familias de color
const GROUP_PALETTE = [
    {
        label: 'Primarios', colors: [
            ['#e03131', 'Rojo'], ['#ffd43b', 'Amarillo'], ['#1a6cff', 'Azul']
        ]
    },
    {
        label: 'Secundarios', colors: [
            ['#ff922b', 'Naranja'], ['#2cb67d', 'Verde'], ['#9b5de5', 'Morado']
        ]
    },
    {
        label: 'Otros', colors: [
            ['#f783ac', 'Rosa'], ['#20c997', 'Turquesa'], ['#a9e34b', 'Lima'], ['#7a8fa8', 'Gris']
        ]
    },
];
const GROUP_COLORS = GROUP_PALETTE.reduce((acc, s) => acc.concat(s.colors.map(c => c[0])), []);
const PRIO_LABELS = { high: 'Alta', medium: 'Media', low: 'Baja', none: '—' };
const PALETTE_ICON = `<svg viewBox="0 0 14 14" fill="none"><path d="M7 1.2a5.8 5.8 0 000 11.6c.72 0 1.2-.5 1.2-1.15 0-.3-.12-.57-.3-.78a1.15 1.15 0 01.85-1.92h1.4A3.65 3.65 0 0012.8 5.3C12.25 2.9 9.85 1.2 7 1.2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><circle cx="4.2" cy="6.3" r=".95" fill="currentColor"/><circle cx="7" cy="4.2" r=".95" fill="currentColor"/><circle cx="9.8" cy="6.3" r=".95" fill="currentColor"/></svg>`;
const CF_TYPES = ['texto', 'número', 'URL', 'persona', 'checkbox'];
const TEMPLATES = [
    {
        icon: '🚀', name: 'Proyecto de Software', desc: 'Backlog · Sprint · En revisión · Listo', groups: [
            { name: '📋 Backlog', color: '#7a8fa8' }, { name: '⚡ En progreso', color: '#ff922b' }, { name: '🔍 En revisión', color: '#9b5de5' }, { name: '✅ Listo', color: '#2cb67d' }
        ]
    },
    {
        icon: '📅', name: 'Planeación semanal', desc: 'Por hacer · Hoy · Hecho', groups: [
            { name: '📌 Por hacer', color: '#1a6cff' }, { name: '🔥 Hoy', color: '#e03131' }, { name: '✅ Hecho', color: '#2cb67d' }
        ]
    },
    {
        icon: '🎯', name: 'OKRs', desc: 'Objetivos · Key Results · Iniciativas', groups: [
            { name: '🎯 Objetivos', color: '#9b5de5' }, { name: '📊 Key Results', color: '#1a6cff' }, { name: '🛠 Iniciativas', color: '#ff922b' }
        ]
    },
    {
        icon: '🐛', name: 'Bug Tracker', desc: 'Reportado · Investigando · Fix · Cerrado', groups: [
            { name: '🐛 Reportado', color: '#e03131' }, { name: '🔎 Investigando', color: '#ff922b' }, { name: '🛠 Fix en curso', color: '#20c997' }, { name: '✅ Cerrado', color: '#2cb67d' }
        ]
    },
    {
        icon: '📝', name: 'Editorial', desc: 'Ideas · Redacción · Revisión · Publicado', groups: [
            { name: '💡 Ideas', color: '#a9e34b' }, { name: '✍️ Redacción', color: '#1a6cff' }, { name: '📖 Revisión', color: '#ffd43b' }, { name: '🌐 Publicado', color: '#2cb67d' }
        ]
    },
    {
        icon: '🏠', name: 'Vida personal', desc: 'Hogar · Salud · Aprendizaje · Compras', groups: [
            { name: '🏠 Hogar', color: '#ff922b' }, { name: '💪 Salud', color: '#2cb67d' }, { name: '📚 Aprendizaje', color: '#1a6cff' }, { name: '🛒 Compras', color: '#9b5de5' }
        ]
    },
];

// ── STATE ──
let S = { groups: [], tasks: [], allTags: [], customFieldDefs: [] };
let view = 'list';
let filterStatus = 'all';
let filterPrio = 'all';
let filterTags = [];
let sortMode = 'manual';
let searchQ = '';
let editTaskId = null;
let editTaskDraft = {};
let selectedColor = '#1a6cff';
let dragTaskId = null;
let dragGroupId = null;
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let cfAddType = 'texto';
let showHistory = false;
let CURRENT_USER = null;

// ── DOM REFS ──
const $ = id => document.getElementById(id);
const mainEl = $('main');
const searchInput = $('search-input');
const toast = $('toast');
const cmdOverlay = $('cmd-overlay');
const cmdIn = $('cmd-in');
const cmdResults = $('cmd-results');
const groupModal = $('group-modal');
const gmName = $('gm-name');
const gmColors = $('gm-colors');
const tplModal = $('tpl-modal');
const tplGrid = $('tpl-grid');
const taskModal = $('task-modal');
const filterBar = $('filter-bar');
const tagFiltersEl = $('tag-filters');
const sortSel = $('sort-sel');

// ── INIT ──
// bootstrap() está definido en la sección PERSISTENCE (maneja el gate de auth).
document.addEventListener('DOMContentLoaded', bootstrap);

function seedDefaults() {
    const g1 = mkGroup('📋 Por hacer', '#1a6cff');
    const g2 = mkGroup('⚡ En progreso', '#ff922b');
    const g3 = mkGroup('✅ Completado', '#2cb67d');
    addTask(g1.id, 'Diseñar pantalla de inicio', 'high', '', new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10), ['diseño']);
    addTask(g1.id, 'Revisar requerimientos', 'medium', '', '', []);
    addTask(g1.id, 'Escribir tests unitarios', 'low', '', '', []);
    const t2 = addTask(g2.id, 'Implementar autenticación', 'high', 'Usar JWT + refresh tokens.', new Date(Date.now() - 86400000).toISOString().slice(0, 10), ['backend', 'auth']);
    t2.subtasks = [{ id: uid(), text: 'Diseñar schema DB', done: true }, { id: uid(), text: 'Implementar endpoints', done: false }, { id: uid(), text: 'Escribir documentación', done: false }];
    const t3 = addTask(g3.id, 'Setup del repositorio', 'low', '', '', []);
    t3.done = true;
    S.allTags = ['diseño', 'backend', 'auth', 'frontend', 'docs', 'bug'];
}

// ── FACTORIES ──
function mkGroup(name, color) {
    const g = { id: uid(), name, color, collapsed: false, order: Date.now() };
    S.groups.push(g); return g;
}
function addTask(gid, text, priority = 'none', notes = '', due = '', tags = []) {
    const t = { id: uid(), groupId: gid, text, done: false, priority, notes, due, tags: [...tags], subtasks: [], comments: [], customFields: {}, history: [], order: Date.now() };
    logHistory(t, 'Tarea creada');
    S.tasks.push(t); return t;
}
function uid() { return '_' + Math.random().toString(36).slice(2, 9); }

// ── HISTORY ──
function logHistory(task, msg) {
    if (!task.history) task.history = [];
    task.history.unshift({ msg, ts: Date.now() });
    if (task.history.length > 30) task.history.pop();
}

// ── RENDER ROUTER ──
function render() {
    updateStats();
    updateTagFilters();
    const q = searchQ.toLowerCase().trim();
    if (view === 'list') renderList(q);
    else if (view === 'kanban') renderKanban(q);
    else if (view === 'calendar') renderCalendar();
}

// ── FILTERED TASKS FOR GROUP ──
function getGroupTasks(gid) {
    let tasks = S.tasks.filter(t => t.groupId === gid);
    if (filterStatus === 'done') tasks = tasks.filter(t => t.done);
    if (filterStatus === 'pending') tasks = tasks.filter(t => !t.done);
    if (filterPrio !== 'all') tasks = tasks.filter(t => t.priority === filterPrio);
    if (filterTags.length) tasks = tasks.filter(t => filterTags.every(tag => t.tags && t.tags.includes(tag)));
    if (searchQ) {
        const q = searchQ.toLowerCase();
        tasks = tasks.filter(t => t.text.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q) || t.tags.some(tg => tg.includes(q)));
    }
    // sort
    if (sortMode === 'name') tasks.sort((a, b) => a.text.localeCompare(b.text));
    else if (sortMode === 'priority') { const po = { high: 0, medium: 1, low: 2, none: 3 }; tasks.sort((a, b) => (po[a.priority] || 3) - (po[b.priority] || 3)); }
    else if (sortMode === 'due') tasks.sort((a, b) => { if (!a.due && !b.due) return 0; if (!a.due) return 1; if (!b.due) return -1; return a.due.localeCompare(b.due); });
    else tasks.sort((a, b) => a.order - b.order);
    return tasks;
}

// ─────────────────────────────────────────────────
//  LIST VIEW
// ─────────────────────────────────────────────────
function renderList(q) {
    if (!S.groups.length) { mainEl.innerHTML = emptyBoardHTML(); return; }
    const wrap = document.createElement('div');
    wrap.className = 'group-wrap';
    S.groups.slice().sort((a, b) => a.order - b.order).forEach(g => {
        wrap.appendChild(buildGroupEl(g, q));
    });
    mainEl.innerHTML = '';
    mainEl.appendChild(wrap);
    bindDragDrop();
    bindGroupReorder(wrap);
}

function buildGroupEl(group, q) {
    const tasks = getGroupTasks(group.id);
    const total = S.tasks.filter(t => t.groupId === group.id).length;
    const el = document.createElement('div');
    el.className = `group${group.collapsed ? ' collapsed' : ''}`;
    el.dataset.gid = group.id;
    el.style.setProperty('--gc', safeColor(group.color));

    el.innerHTML = `
    <div class="g-hdr" data-gid="${group.id}" title="Arrastra el grupo para moverlo arriba/abajo">
      <span class="g-grip" aria-hidden="true">
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><circle cx="2" cy="3" r="1" fill="currentColor"/><circle cx="6" cy="3" r="1" fill="currentColor"/><circle cx="2" cy="7" r="1" fill="currentColor"/><circle cx="6" cy="7" r="1" fill="currentColor"/><circle cx="2" cy="11" r="1" fill="currentColor"/><circle cx="6" cy="11" r="1" fill="currentColor"/></svg>
      </span>
      <button class="g-color" data-action="pick-color" data-gid="${group.id}" title="Cambiar color de fondo del grupo" style="background:${safeColor(group.color)}"></button>
      <input class="g-name-in" value="${esc(group.name)}" data-gid="${group.id}" readonly title="Doble clic para renombrar"/>
      <span class="g-count">${total}</span>
      <button class="btn-ic g-color-btn" data-action="pick-color" data-gid="${group.id}" title="Color del bloque" aria-label="Cambiar el color del bloque">
        ${PALETTE_ICON}
      </button>
      <div class="g-actions">
        <button class="btn-ic" data-action="add-task" data-gid="${group.id}" title="Agregar tarea">
          <svg viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
        <button class="btn-ic danger" data-action="del-group" data-gid="${group.id}" title="Eliminar grupo">
          <svg viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M4 3.5l.7 8a.5.5 0 00.5.5h4.6a.5.5 0 00.5-.5l.7-8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        </button>
      </div>
      <svg class="g-chevron" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="g-body" id="gb-${group.id}">
      ${tasks.length === 0 && !q ? `<div class="g-empty">Sin tareas. Agrega una abajo.</div>` : ''}
      ${tasks.map(t => buildTaskHTML(t, q)).join('')}
      ${q ? '' : `<div class="add-row" data-gid="${group.id}">
        <input class="add-in" placeholder="+ Nueva tarea..." maxlength="120" data-gid="${group.id}"/>
        <button class="add-btn-sm" data-gid="${group.id}">↵</button>
      </div>`}
    </div>`;

    const hdr = el.querySelector('.g-hdr');
    const nameIn = el.querySelector('.g-name-in');

    // header toggle — sin re-render, así el doble clic (renombrar) no pierde el nodo
    hdr.addEventListener('click', e => {
        if (e.target.closest('.btn-ic') || e.target.closest('.g-color') || !nameIn.readOnly) return;
        group.collapsed = !group.collapsed;
        el.classList.toggle('collapsed', group.collapsed);
        save();
    });
    // rename (doble clic en la cabecera)
    hdr.addEventListener('dblclick', e => {
        if (e.target.closest('.btn-ic') || e.target.closest('.g-color')) return;
        nameIn.readOnly = false;
        nameIn.classList.add('editing');
        nameIn.focus(); nameIn.select();
    });
    nameIn.addEventListener('change', e => {
        group.name = e.target.value.trim() || group.name; save(); render();
    });
    nameIn.addEventListener('blur', () => { nameIn.readOnly = true; nameIn.classList.remove('editing'); });
    nameIn.addEventListener('keydown', e => {
        if (e.key === 'Enter') nameIn.blur();
        if (e.key === 'Escape') { nameIn.value = group.name; nameIn.blur(); }
    });
    // color de fondo del grupo (barrita lateral + botón de paleta)
    el.querySelectorAll('[data-action="pick-color"]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            openColorPicker(e.currentTarget, group);
        });
    });
    // reordenar: solo se arrastra si el gesto empieza en la cabecera
    el.addEventListener('mousedown', e => {
        const onHdr = !!e.target.closest('.g-hdr');
        el.draggable = onHdr && !e.target.closest('.btn-ic') && !e.target.closest('.g-color') && nameIn.readOnly;
    });
    el.addEventListener('dragstart', e => {
        if (e.target !== el) return;            // el arrastre viene de una tarea
        dragGroupId = group.id;
        el.classList.add('g-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', group.id);
    });
    el.addEventListener('dragend', () => {
        el.draggable = false;
        el.classList.remove('g-dragging');
        if (!dragGroupId) return;
        dragGroupId = null;
        commitGroupOrder(el.parentElement);
    });
    // del group
    const delBtn = el.querySelector('[data-action="del-group"]');
    if (delBtn) delBtn.addEventListener('click', e => {
        e.stopPropagation();
        trashGroup(group.id);
    });
    // add task shortcut
    const addTaskBtn = el.querySelector('[data-action="add-task"]');
    if (addTaskBtn) addTaskBtn.addEventListener('click', e => {
        e.stopPropagation();
        group.collapsed = false; save(); render();
        setTimeout(() => el.querySelector('.add-in')?.focus(), 50);
    });
    // add-row
    const addRow = el.querySelector('.add-row');
    if (addRow) {
        const inp = addRow.querySelector('.add-in');
        const btn = addRow.querySelector('.add-btn-sm');
        const submit = () => {
            const v = inp.value.trim(); if (!v) return;
            addTask(group.id, v); save(); render(); toast_('Tarea agregada');
        };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
        btn.addEventListener('click', submit);
    }
    // task actions
    el.querySelectorAll('[data-open-task]').forEach(b => {
        b.addEventListener('click', e => { e.stopPropagation(); openTaskModal(b.dataset.openTask); });
    });
    el.querySelectorAll('[data-del-task]').forEach(b => {
        b.addEventListener('click', e => {
            e.stopPropagation();
            trashTask(b.dataset.delTask);
        });
    });
    el.querySelectorAll('[data-chk]').forEach(b => {
        b.addEventListener('click', e => {
            e.stopPropagation();
            toggleTaskDone(b.dataset.chk);
        });
    });
    el.querySelectorAll('[data-sub-chk]').forEach(b => {
        b.addEventListener('click', e => {
            e.stopPropagation();
            const [tid, sid] = b.dataset.subChk.split('|');
            const t = S.tasks.find(t => t.id === tid); if (!t) return;
            const sub = t.subtasks.find(s => s.id === sid); if (!sub) return;
            sub.done = !sub.done; save(); render();
        });
    });
    // drop zone
    el.addEventListener('dragover', e => {
        if (dragGroupId) return;                // reordenando grupos, lo maneja el contenedor
        e.preventDefault(); el.classList.add('drag-over-group');
    });
    el.addEventListener('dragleave', () => el.classList.remove('drag-over-group'));
    el.addEventListener('drop', e => {
        if (dragGroupId) return;
        e.preventDefault(); el.classList.remove('drag-over-group');
        if (!dragTaskId) return;
        const task = S.tasks.find(t => t.id === dragTaskId); if (!task) return;
        if (task.groupId === group.id) return;
        task.groupId = group.id; task.order = Date.now();
        logHistory(task, `Movida al grupo "${group.name}"`);
        save(); render(); toast_('Tarea movida');
    });
    return el;
}

function buildTaskHTML(t, q) {
    const doneSubs = t.subtasks?.filter(s => s.done).length || 0;
    const totalSubs = t.subtasks?.length || 0;
    const isOverdue = t.due && !t.done && new Date(t.due + 'T00:00:00') < new Date(new Date().toDateString());
    const tags = (t.tags || []).map(tag => {
        const c = tagColor(tag);
        return `<span class="tag-b" style="background:${c}22;color:${c};border:1px solid ${c}44">${esc(tag)}</span>`;
    }).join('');
    const txt = q ? highlight(esc(t.text), q) : esc(t.text);
    const subHTML = t.subtasks?.length ? `
    <div class="subtasks">
      ${t.subtasks.map(s =>`
        <div class="sub-item">
          <button class="sub-chk${s.done ? ' done' : ''}" data-sub-chk="${t.id}|${s.id}">
            <svg viewBox="0 0 9 8" fill="none"><path d="M1 4l2.5 3 5-6" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <span class="sub-text" style="${s.done ? 'text-decoration:line-through;color:var(--txt3)' : ''}">${esc(s.text)}</span>
        </div>`).join('')}
      ${totalSubs > 1 ? `<div class="sub-progress"><div class="sub-progress-fill" style="width:${Math.round(doneSubs / totalSubs * 100)}%"></div></div>` : ''}
    </div>` : '';
    return `
    <div class="task-item${t.done ? ' done-item' : ''}" draggable="true" data-task-id="${t.id}">
      <div class="drag-h">
        <svg width="10" height="12" viewBox="0 0 10 12" fill="none"><circle cx="3" cy="2" r="1" fill="currentColor"/><circle cx="7" cy="2" r="1" fill="currentColor"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="7" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="10" r="1" fill="currentColor"/><circle cx="7" cy="10" r="1" fill="currentColor"/></svg>
      </div>
      <button class="chk${t.done ? ' done' : ''}" data-chk="${t.id}">
        <svg viewBox="0 0 9 8" fill="none"><path d="M1 4l2.5 3 5-6" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="t-main">
        <span class="t-text">${txt}</span>
        <div class="t-sub">
          ${t.priority && t.priority !== 'none' ? `<span class="prio-b p-${t.priority}">${PRIO_LABELS[t.priority]}</span>` : ''}
          ${t.due ? `<span class="due-b${isOverdue ? ' ov' : ''}"><svg viewBox="0 0 10 10" fill="none"><rect x="1" y="1.5" width="8" height="7" rx="1" stroke="currentColor" stroke-width="1.1"/><path d="M3 .5v2M7 .5v2M1 4.5h8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>${fmtDate(t.due)}${t.dueTime ? ' · ' + t.dueTime : ''}</span>` : ''}
          ${tags}
          ${t.notes ? `<span class="note-dot" title="Tiene nota"></span>` : ''}
          ${totalSubs ? `<span class="sub-count"><svg viewBox="0 0 10 10" fill="none"><path d="M2 3h6M2 5h6M2 7h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>${doneSubs}/${totalSubs}</span>` : ''}
          ${t.comments?.length ? `<span class="comments-count"><svg viewBox="0 0 10 10" fill="none"><path d="M1 2a1 1 0 011-1h6a1 1 0 011 1v5a1 1 0 01-1 1H6L4 9.5 2 8H2a1 1 0 01-1-1V2z" stroke="currentColor" stroke-width="1.2"/></svg>${t.comments.length}</span>` : ''}
        </div>
      </div>
      <div class="t-actions">
        <button class="btn-ic" data-open-task="${t.id}" title="Abrir detalle">
          <svg viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
        <button class="btn-ic danger" data-del-task="${t.id}" title="Eliminar">
          <svg viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M4 3.5l.7 8a.5.5 0 00.5.5h4.6a.5.5 0 00.5-.5l.7-8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        </button>
      </div>
      ${subHTML}
    </div>`;
}

// ─────────────────────────────────────────────────
//  KANBAN VIEW
// ─────────────────────────────────────────────────
function renderKanban(q) {
    if (!S.groups.length) { mainEl.innerHTML = emptyBoardHTML(); return; }
    mainEl.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'kanban-wrap';
    S.groups.slice().sort((a, b) => a.order - b.order).forEach(g => {
        const tasks = getGroupTasks(g.id);
        const kol = document.createElement('div');
        kol.className = 'kol';
        kol.dataset.gid = g.id;
        kol.style.setProperty('--gc', safeColor(g.color));
        kol.innerHTML = `
      <div class="kol-hdr">
        <button class="g-color" data-action="pick-color" title="Cambiar color de fondo del grupo" style="background:${safeColor(g.color)}"></button>
        <span class="kol-name">${esc(g.name)}</span>
        <span class="kol-count">${tasks.length}</span>
        <button class="btn-ic" data-action="pick-color" title="Color del bloque" aria-label="Cambiar el color del bloque">${PALETTE_ICON}</button>
      </div>
      <div class="kol-body" id="kb-${g.id}">
        ${tasks.map(t =>`
          <div class="kcard${t.done ? ' kcard-done' : ''}" draggable="true" data-task-id="${t.id}">
            <span class="kcard-text">${q ? highlight(esc(t.text), q) : esc(t.text)}</span>
            <div class="kcard-meta">
              ${t.priority && t.priority !== 'none' ? `<span class="prio-b p-${t.priority}">${PRIO_LABELS[t.priority]}</span>` : ''}
              ${t.due ? `<span class="due-b${(!t.done && new Date(t.due + 'T00:00:00') < new Date()) ? ' ov' : ''}"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="1" y="1.5" width="8" height="7" rx="1" stroke="currentColor" stroke-width="1.1"/><path d="M3 .5v2M7 .5v2M1 4.5h8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>${fmtDate(t.due)}${t.dueTime ? ' · ' + t.dueTime : ''}</span>` : ''}
              ${(t.tags || []).map(tag => { const c = tagColor(tag); return `<span class="tag-b" style="background:${c}22;color:${c}">${esc(tag)}</span>`; }).join('')}
              ${t.subtasks?.length ? `<span class="kcard-sub"><svg viewBox="0 0 10 10" fill="none"><path d="M2 3h6M2 5h6M2 7h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>${t.subtasks.filter(s => s.done).length}/${t.subtasks.length}</span>` : ''}
            </div>
          </div>`).join('')}
      </div>
      <div class="k-add-row" data-gid="${g.id}">
        <input class="k-add-in" placeholder="+ Agregar tarea..." data-gid="${g.id}"/>
      </div>`;
        // color de fondo de la columna
        kol.querySelectorAll('[data-action="pick-color"]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                openColorPicker(e.currentTarget, g);
            });
        });
        // kcard click → open modal
        kol.querySelectorAll('.kcard').forEach(kc => {
            kc.addEventListener('click', () => openTaskModal(kc.dataset.taskId));
            kc.addEventListener('dragstart', e => { dragTaskId = kc.dataset.taskId; kc.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
            kc.addEventListener('dragend', () => { kc.classList.remove('dragging'); dragTaskId = null; document.querySelectorAll('.kol').forEach(k => k.classList.remove('drag-over-group')); });
        });
        // k-add-row
        const kin = kol.querySelector('.k-add-in');
        kin.addEventListener('keydown', e => {
            if (e.key !== 'Enter') return;
            const v = kin.value.trim(); if (!v) return;
            addTask(g.id, v); save(); render(); toast_('Tarea agregada');
        });
        // drop
        kol.addEventListener('dragover', e => { e.preventDefault(); kol.classList.add('drag-over-group'); });
        kol.addEventListener('dragleave', () => kol.classList.remove('drag-over-group'));
        kol.addEventListener('drop', e => {
            e.preventDefault(); kol.classList.remove('drag-over-group');
            if (!dragTaskId) return;
            const task = S.tasks.find(t => t.id === dragTaskId); if (!task || task.groupId === g.id) return;
            task.groupId = g.id; task.order = Date.now();
            logHistory(task, `Movida al grupo "${g.name}"`);
            save(); render(); toast_('Tarea movida');
        });
        wrap.appendChild(kol);
    });
    mainEl.appendChild(wrap);
}

// ─────────────────────────────────────────────────
//  CALENDAR VIEW
// ─────────────────────────────────────────────────
function renderCalendar() {
    mainEl.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'cal-wrap';
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const today = new Date();
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
    wrap.innerHTML = `
    <div class="cal-nav">
      <button class="btn-ghost" id="cal-prev" style="padding:5px 10px">&larr;</button>
      <h2>${monthNames[calMonth]} ${calYear}</h2>
      <button class="btn-ghost" id="cal-next" style="padding:5px 10px">&rarr;</button>
      <button class="btn-ghost" id="cal-today" style="padding:5px 10px;font-size:.76rem">Hoy</button>
    </div>
    <div class="cal-grid">
      ${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => `<div class="cal-dow">${d}</div>`).join('')}
    </div>`;
    const grid = wrap.querySelector('.cal-grid');
    // Pad start
    for (let i = 0; i < startDow; i++) {
        const d = document.createElement('div'); d.className = 'cal-day other-month'; grid.appendChild(d);
    }
    // Days
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const isoDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
        const dayTasks = S.tasks.filter(t => t.due === isoDate);
        const el = document.createElement('div');
        el.className = `cal-day${isToday ? ' today' : ''}`;
        el.innerHTML = `<div class="cal-day-num">${day}</div>`;
        const maxShow = 3;
        dayTasks.slice(0, maxShow).forEach(t => {
            const pill = document.createElement('div');
            pill.className = `cal-task-pill${t.done ? ' pil-done' : t.priority === 'high' ? ' pil-high' : t.priority === 'medium' ? ' pil-medium' : ''}`;
            pill.textContent = t.text;
            pill.addEventListener('click', () => openTaskModal(t.id));
            el.appendChild(pill);
        });
        if (dayTasks.length > maxShow) {
            const more = document.createElement('div');
            more.className = 'cal-more';
            more.textContent = `+${dayTasks.length - maxShow} más`;
            el.appendChild(more);
        }
        grid.appendChild(el);
    }
    // Pad end to complete last row
    const totalCells = startDow + lastDay.getDate();
    const rem = (7 - totalCells % 7) % 7;
    for (let i = 0; i < rem; i++) {
        const d = document.createElement('div'); d.className = 'cal-day other-month'; grid.appendChild(d);
    }
    mainEl.appendChild(wrap);
    $('cal-prev').addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } render(); });
    $('cal-next').addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } render(); });
    $('cal-today').addEventListener('click', () => { calYear = today.getFullYear(); calMonth = today.getMonth(); render(); });
}

// ─────────────────────────────────────────────────
//  TASK DETAIL MODAL
// ─────────────────────────────────────────────────
function openTaskModal(taskId) {
    const t = S.tasks.find(t => t.id === taskId); if (!t) return;
    editTaskId = taskId;
    editTaskDraft = JSON.parse(JSON.stringify(t)); // deep copy
    showHistory = false;
    taskModal.hidden = false;
    // title
    $('td-title').value = t.text;
    // notes
    $('td-notes').value = t.notes || '';
    $('td-notes-preview').style.display = 'none';
    $('td-notes-preview').innerHTML = '';
    $('td-notes').style.display = '';
    $('td-preview-btn').style.display = '';
    $('td-edit-btn').style.display = 'none';
    // priority
    document.querySelectorAll('#td-prio-row .prio-opt').forEach(b => {
        b.className = 'prio-opt' + (b.dataset.p === t.priority ? ` sel-${t.priority}` : '');
    });
    renderPrioBadge(t.priority);
    // due
    $('td-due').value = t.due || '';
    // group
    const gs = $('td-group');
    gs.innerHTML = S.groups.map(g => `<option value="${g.id}"${g.id === t.groupId ? ' selected' : ''}>${esc(g.name)}</option>`).join('');
    // tags
    renderModalTags();
    // custom fields
    renderCustomFields();
    // subtasks
    renderModalSubtasks();
    // comments
    renderComments();
    // history
    renderHistory();
    $('td-title').focus();
}

function renderPrioBadge(prio) {
    const badge = $('td-prio-badge');
    if (!prio || prio === 'none') { badge.textContent = ''; badge.className = ''; return; }
    badge.textContent = PRIO_LABELS[prio];
    badge.className = `prio-b p-${prio}`;
}

function renderModalTags() {
    const t = S.tasks.find(t => t.id === editTaskId); if (!t) return;
    const wrap = $('td-tags-wrap');
    // remove old pills
    wrap.querySelectorAll('.tag-pill-rem').forEach(el => el.remove());
    const inp = $('td-tags-in');
    (t.tags || []).forEach(tag => {
        const c = tagColor(tag);
        const pill = document.createElement('button');
        pill.className = 'tag-pill-rem';
        pill.style.cssText = `background:${c}22;color:${c};border:1px solid ${c}44`;
        pill.innerHTML = `${esc(tag)}<span>×</span>`;
        pill.addEventListener('click', () => { t.tags = t.tags.filter(tg => tg !== tag); renderModalTags(); });
        wrap.insertBefore(pill, inp);
    });
}

function renderModalSubtasks() {
    const t = S.tasks.find(t => t.id === editTaskId); if (!t) return;
    const container = $('td-subtasks'); container.innerHTML = '';
    (t.subtasks || []).forEach(s => {
        const el = document.createElement('div');
        el.className = `sub-modal-item${s.done ? ' sub-modal-done' : ''}`;
        el.innerHTML =`
      <button class="sub-chk sub-modal-chk${s.done ? ' done' : ''}" style="width:14px;height:14px;border-radius:3px;border:1.5px solid var(--bd-hi);background:${s.done ? 'var(--done)' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;transition:all .17s">
        <svg viewBox="0 0 9 8" fill="none" style="width:8px;height:8px;opacity:${s.done ? 1 : 0}"><path d="M1 4l2.5 3 5-6" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <span class="sub-modal-text">${esc(s.text)}</span>
      <button class="btn-ic danger" style="padding:2px"><svg viewBox="0 0 14 14" fill="none" style="width:11px;height:11px"><path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M4 3.5l.7 8a.5.5 0 00.5.5h4.6a.5.5 0 00.5-.5l.7-8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></button>`;
        el.querySelector('.sub-modal-chk').addEventListener('click', () => { s.done = !s.done; save(); renderModalSubtasks(); render(); });
        el.querySelector('.btn-ic').addEventListener('click', () => { t.subtasks = t.subtasks.filter(x => x.id !== s.id); save(); renderModalSubtasks(); render(); });
        container.appendChild(el);
    });
}

function renderComments() {
    const t = S.tasks.find(t => t.id === editTaskId); if (!t) return;
    const c = $('td-comments'); c.innerHTML = '';
    (t.comments || []).forEach((cm, i) => {
        const el = document.createElement('div'); el.className = 'comment-item';
        el.innerHTML =`
      <div class="comment-meta">
        <div class="comment-avatar">YO</div>
        <span class="comment-ts">${fmtTs(cm.ts)}</span>
        <button class="comment-del" data-ci="${i}">× Eliminar</button>
      </div>
      <div class="comment-text">${esc(cm.text)}</div>`;
        el.querySelector('.comment-del').addEventListener('click', () => { t.comments.splice(i, 1); save(); renderComments(); });
        c.appendChild(el);
    });
    if (!t.comments?.length) c.innerHTML = '<div style="font-size:.78rem;color:var(--txt3);padding:4px 0">Sin comentarios aún.</div>';
}

function renderHistory() {
    const t = S.tasks.find(t => t.id === editTaskId); if (!t) return;
    const list = $('td-history');
    list.innerHTML = (t.history || []).map(h =>`
    <div class="hist-item"><b>${esc(h.msg)}</b> · ${fmtTs(h.ts)}</div>`).join('');
}

function renderCustomFields() {
    const t = S.tasks.find(t => t.id === editTaskId); if (!t) return;
    const list = $('td-cf-list'); list.innerHTML = '';
    (S.customFieldDefs || []).forEach(cf => {
        const val = t.customFields?.[cf.id] || '';
        const row = document.createElement('div'); row.className = 'cf-row';
        if (cf.type === 'checkbox') {
            row.innerHTML =`
        <input type="checkbox" ${val ? 'checked' : ''} style="width:15px;height:15px;cursor:pointer;accent-color:var(--accent)"/>
        <span style="font-size:.82rem;color:var(--txt2)">${esc(cf.name)}</span>
        <button class="btn-ic danger" data-cfid="${cf.id}" style="margin-left:auto"><svg viewBox="0 0 14 14" fill="none" style="width:11px;height:11px"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>`;
            row.querySelector('input').addEventListener('change', e => { if (!t.customFields) t.customFields = {}; t.customFields[cf.id] = e.target.checked; save(); });
        } else {
            row.innerHTML =`
        <span class="cf-type-badge">${cf.type}</span>
        <span style="font-size:.78rem;color:var(--txt2);min-width:70px">${esc(cf.name)}</span>
        <input class="cf-val-in" type="${cf.type === 'número' ? 'number' : cf.type === 'URL' ? 'url' : 'text'}" value="${esc(val)}" placeholder="Valor..." style="flex:1"/>
        <button class="btn-ic danger" data-cfid="${cf.id}"><svg viewBox="0 0 14 14" fill="none" style="width:11px;height:11px"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>`;
            row.querySelector('.cf-val-in').addEventListener('change', e => { if (!t.customFields) t.customFields = {}; t.customFields[cf.id] = e.target.value; save(); });
        }
        row.querySelector('[data-cfid]').addEventListener('click', () => { S.customFieldDefs = S.customFieldDefs.filter(c => c.id !== cf.id); save(); renderCustomFields(); });
        list.appendChild(row);
    });
}

function closeTaskModal() {
    taskModal.hidden = true; editTaskId = null; editTaskDraft = {};
    $('td-tag-sug').style.display = 'none';
}

// ─────────────────────────────────────────────────
//  STATS & TAG FILTERS
// ─────────────────────────────────────────────────
function updateStats() {
    const total = S.tasks.length;
    const done = S.tasks.filter(t => t.done).length;
    const pend = total - done;
    const ov = S.tasks.filter(t => !t.done && t.due && new Date(t.due + 'T00:00:00') < new Date(new Date().toDateString())).length;
    $('s-total').textContent = total;
    $('s-done').textContent = done;
    $('s-pend').textContent = pend;
    $('s-ov').textContent = ov;
    $('s-overdue-pill').style.display = ov > 0 ? '' : 'none';
    $('prog-fill').style.width = total > 0 ? Math.round(done / total * 100) + '%' : '0%';
}

function updateTagFilters() {
    // collect all tags
    const allT = [...new Set(S.tasks.flatMap(t => t.tags || []))].sort();
    tagFiltersEl.innerHTML = '';
    allT.forEach(tag => {
        const c = tagColor(tag);
        const btn = document.createElement('button');
        btn.className = 'tag-filter-btn';
        btn.style.cssText = filterTags.includes(tag) ? `background:${c}33;color:${c};border-color:${c}` : `background:${c}11;color:${c};border-color:${c}44`;
        btn.textContent = tag;
        btn.addEventListener('click', () => {
            if (filterTags.includes(tag)) filterTags = filterTags.filter(t => t !== tag);
            else filterTags.push(tag);
            render();
        });
        tagFiltersEl.appendChild(btn);
    });
}

// ─────────────────────────────────────────────────
//  DRAG & DROP (LIST)
// ─────────────────────────────────────────────────
function bindDragDrop() {
    document.querySelectorAll('.task-item[draggable]').forEach(el => {
        el.addEventListener('dragstart', e => {
            dragTaskId = el.dataset.taskId;
            el.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            dragTaskId = null;
            document.querySelectorAll('.group').forEach(g => g.classList.remove('drag-over-group'));
        });
        el.addEventListener('dragover', e => {
            if (!dragTaskId || dragTaskId === el.dataset.taskId) return;
            e.preventDefault(); e.stopPropagation();
            const dragged = S.tasks.find(t => t.id === dragTaskId);
            const target = S.tasks.find(t => t.id === el.dataset.taskId);
            if (!dragged || !target) return;
            const di = S.tasks.indexOf(dragged), ti = S.tasks.indexOf(target);
            S.tasks.splice(di, 1);
            dragged.groupId = target.groupId;
            S.tasks.splice(S.tasks.indexOf(target), 0, dragged);
            S.tasks.filter(t => t.groupId === target.groupId).forEach((t, i) => t.order = i);
            save(); render();
        });
    });
}

// ─────────────────────────────────────────────────
//  REORDENAR GRUPOS (arrastrar por la cabecera)
// ─────────────────────────────────────────────────
function bindGroupReorder(wrap) {
    wrap.addEventListener('dragover', e => {
        if (!dragGroupId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const dragging = wrap.querySelector('.g-dragging');
        if (!dragging) return;
        const ref = groupAfterPoint(wrap, e.clientY);
        if (ref === dragging) return;
        if (ref) wrap.insertBefore(dragging, ref);
        else wrap.appendChild(dragging);
    });
    wrap.addEventListener('drop', e => { if (dragGroupId) e.preventDefault(); });
}

// Primer grupo (sin contar el arrastrado) cuyo centro queda por debajo del cursor
function groupAfterPoint(wrap, y) {
    return [...wrap.querySelectorAll('.group:not(.g-dragging)')]
        .find(el => { const r = el.getBoundingClientRect(); return y < r.top + r.height / 2; }) || null;
}

// Pasa el orden visual del DOM al estado y guarda
function commitGroupOrder(wrap) {
    if (!wrap) return;
    const ids = [...wrap.querySelectorAll('.group')].map(el => el.dataset.gid);
    let changed = false;
    ids.forEach((id, i) => {
        const g = S.groups.find(x => x.id === id);
        if (g && g.order !== i) { g.order = i; changed = true; }
    });
    if (!changed) return;
    save(); render(); toast_('Grupo movido');
}

// ─────────────────────────────────────────────────
//  CMD PALETTE
// ─────────────────────────────────────────────────
function openCmd() { cmdOverlay.hidden = false; cmdIn.value = ''; renderCmdResults(''); cmdIn.focus(); }
function closeCmd() { cmdOverlay.hidden = true; }

function renderCmdResults(q) {
    cmdResults.innerHTML = '';
    const actions = [
        { label: 'Nuevo grupo', hint: 'Crea un grupo', icon: '⊞', action: () => { closeCmd(); openGroupModal(); } },
        { label: 'Vista Lista', hint: '', icon: '☰', action: () => { closeCmd(); switchView('list'); } },
        { label: 'Vista Kanban', hint: '', icon: '⊟', action: () => { closeCmd(); switchView('kanban'); } },
        { label: 'Vista Calendario', hint: '', icon: '📅', action: () => { closeCmd(); switchView('calendar'); } },
        { label: 'Templates', hint: '', icon: '📋', action: () => { closeCmd(); tplModal.hidden = false; } },
    ];
    if (!q) {
        const sec = document.createElement('div'); sec.className = 'cmd-section'; sec.textContent = 'Acciones rápidas';
        cmdResults.appendChild(sec);
        actions.forEach(a => cmdResults.appendChild(mkCmdItem(a)));
        if (S.tasks.length) {
            const sec2 = document.createElement('div'); sec2.className = 'cmd-section'; sec2.textContent = 'Tareas recientes';
            cmdResults.appendChild(sec2);
            S.tasks.slice(-5).reverse().forEach(t => {
                cmdResults.appendChild(mkCmdItem({ label: t.text, hint: S.groups.find(g => g.id === t.groupId)?.name || '', icon: '◻', action: () => { closeCmd(); openTaskModal(t.id); } }));
            });
        }
        return;
    }
    const ql = q.toLowerCase();
    const matchedActions = actions.filter(a => a.label.toLowerCase().includes(ql));
    const matchedTasks = S.tasks.filter(t => t.text.toLowerCase().includes(ql) || t.notes.toLowerCase().includes(ql));
    if (!matchedActions.length && !matchedTasks.length) {
        cmdResults.innerHTML = '<div class="cmd-empty">Sin resultados para "' + esc(q) + '"</div>'; return;
    }
    if (matchedActions.length) {
        const sec = document.createElement('div'); sec.className = 'cmd-section'; sec.textContent = 'Acciones';
        cmdResults.appendChild(sec);
        matchedActions.forEach(a => cmdResults.appendChild(mkCmdItem(a)));
    }
    if (matchedTasks.length) {
        const sec = document.createElement('div'); sec.className = 'cmd-section'; sec.textContent = 'Tareas';
        cmdResults.appendChild(sec);
        matchedTasks.slice(0, 8).forEach(t => {
            cmdResults.appendChild(mkCmdItem({ label: t.text, hint: S.groups.find(g => g.id === t.groupId)?.name || '', icon: '◻', action: () => { closeCmd(); openTaskModal(t.id); } }));
        });
    }
}

function mkCmdItem({ label, hint, icon, action }) {
    const el = document.createElement('div'); el.className = 'cmd-item';
    el.innerHTML = `<span style="font-size:1rem">${icon}</span><span class="cmd-item-label">${esc(label)}</span>${hint ? `<span class="cmd-item-hint">${esc(hint)}</span>` : ''}`;
    el.addEventListener('click', action);
    return el;
}

// ─────────────────────────────────────────────────
//  GROUP MODAL
// ─────────────────────────────────────────────────
function openGroupModal() { gmName.value = ''; groupModal.hidden = false; gmName.focus(); }

function buildColorSwatches(container, onSelect, current = GROUP_COLORS[0]) {
    GROUP_COLORS.forEach(c => {
        const s = document.createElement('div');
        s.className = `csw${c === current ? ' sel' : ''}`;
        s.style.background = c; s.dataset.c = c;
        s.addEventListener('click', () => { container.querySelectorAll('.csw').forEach(x => x.classList.remove('sel')); s.classList.add('sel'); onSelect(c); });
        container.appendChild(s);
    });
}

// ─────────────────────────────────────────────────
//  COLOR DE FONDO DEL GRUPO
// ─────────────────────────────────────────────────
let colorPop = null;

function openColorPicker(anchor, group) {
    const same = colorPop && colorPop.dataset.gid === group.id;
    closeColorPicker();
    if (same) return;                            // segundo clic en el mismo botón: cerrar

    const cur = safeColor(group.color);
    const pop = document.createElement('div');
    pop.className = 'color-pop';
    pop.dataset.gid = group.id;
    pop.innerHTML = `
    <div class="color-pop-t">Color del bloque</div>
    <div class="color-pop-fams"></div>
    <label class="color-pop-custom">
      <span>Personalizado</span>
      <input type="color" value="${cur}"/>
    </label>`;

    // una fila por familia (primarios / secundarios / otros)
    const fams = pop.querySelector('.color-pop-fams');
    GROUP_PALETTE.forEach(fam => {
        const sec = document.createElement('div');
        sec.className = 'color-fam';
        sec.innerHTML = `<div class="color-fam-t">${fam.label}</div><div class="color-pop-grid"></div>`;
        const grid = sec.querySelector('.color-pop-grid');
        fam.colors.forEach(([c, name]) => {
            const s = document.createElement('button');
            s.className = `csw${c.toLowerCase() === cur.toLowerCase() ? ' sel' : ''}`;
            s.style.background = c;
            s.title = name;
            s.setAttribute('aria-label', `Color ${name}`);
            s.addEventListener('mouseenter', () => previewGroupColor(group.id, c));
            s.addEventListener('mouseleave', () => previewGroupColor(group.id, cur));
            s.addEventListener('click', () => applyGroupColor(group, c));
            grid.appendChild(s);
        });
        fams.appendChild(sec);
    });
    const custom = pop.querySelector('input[type="color"]');
    custom.addEventListener('input', e => previewGroupColor(group.id, e.target.value));
    custom.addEventListener('change', e => applyGroupColor(group, e.target.value));

    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect();
    pop.style.top = Math.min(r.bottom + 8, window.innerHeight - pop.offsetHeight - 12) + 'px';
    pop.style.left = Math.max(12, Math.min(r.left - 4, window.innerWidth - pop.offsetWidth - 12)) + 'px';
    colorPop = pop;
    setTimeout(() => document.addEventListener('mousedown', outsideColorPop), 0);
}

function outsideColorPop(e) {
    if (!colorPop) return;
    // los botones de color los gestiona su propio click (abrir/cerrar/cambiar de grupo)
    if (colorPop.contains(e.target) || e.target.closest('[data-action="pick-color"]')) return;
    closeColorPicker();
}

function closeColorPicker() {
    document.removeEventListener('mousedown', outsideColorPop);
    if (colorPop) { colorPop.remove(); colorPop = null; }
}

// Vista previa en vivo mientras se mueve el selector nativo
function previewGroupColor(gid, c) {
    document.querySelectorAll(`.group[data-gid="${gid}"], .kol[data-gid="${gid}"]`).forEach(el => {
        el.style.setProperty('--gc', c);
        el.querySelectorAll('.g-color').forEach(dot => dot.style.background = c);
    });
}

function applyGroupColor(group, c) {
    group.color = c;
    closeColorPicker();
    save(); render(); toast_('Color actualizado');
}

// ─────────────────────────────────────────────────
//  TEMPLATES
// ─────────────────────────────────────────────────
function buildTemplates() {
    tplGrid.innerHTML = '';
    TEMPLATES.forEach(tpl => {
        const c = document.createElement('div'); c.className = 'tpl-card';
        c.innerHTML = `<div class="tpl-icon">${tpl.icon}</div><div class="tpl-name">${esc(tpl.name)}</div><div class="tpl-desc">${esc(tpl.desc)}</div>`;
        c.addEventListener('click', () => {
            if (!confirm(`¿Agregar template "${tpl.name}"? Se crearán ${tpl.groups.length} grupos nuevos.`)) return;
            tpl.groups.forEach(g => mkGroup(g.name, g.color));
            save(); render(); tplModal.hidden = true; toast_(`Template "${tpl.name}" aplicado`);
        });
        tplGrid.appendChild(c);
    });
}

// ─────────────────────────────────────────────────
//  UI BINDINGS
// ─────────────────────────────────────────────────
function bindUI() {
    // View tabs
    document.querySelectorAll('.vtab').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    // New group
    $('new-group-btn').addEventListener('click', openGroupModal);
    $('gm-cancel').addEventListener('click', () => groupModal.hidden = true);
    $('gm-confirm').addEventListener('click', () => {
        const n = gmName.value.trim(); if (!n) { gmName.focus(); return; }
        mkGroup(n, selectedColor); save(); render(); groupModal.hidden = true; toast_(`Grupo "${n}" creado`);
    });
    gmName.addEventListener('keydown', e => { if (e.key === 'Enter') $('gm-confirm').click(); });
    groupModal.addEventListener('click', e => { if (e.target === groupModal) groupModal.hidden = true; });

    // Templates
    $('templates-btn').addEventListener('click', () => { tplModal.hidden = false; });
    tplModal.addEventListener('click', e => { if (e.target === tplModal) tplModal.hidden = true; });
    $('tpl-cancel').addEventListener('click', () => { tplModal.hidden = true });

    // Search
    searchInput.addEventListener('input', e => { searchQ = e.target.value; render(); });

    // Filter chips (status)
    filterBar.querySelectorAll('[data-status]').forEach(btn => {
        btn.addEventListener('click', () => {
            filterStatus = btn.dataset.status;
            filterBar.querySelectorAll('[data-status]').forEach(b => b.classList.toggle('active', b === btn));
            render();
        });
    });
    // Filter chips (prio)
    filterBar.querySelectorAll('[data-prio-f]').forEach(btn => {
        btn.addEventListener('click', () => {
            filterPrio = btn.dataset.prioF;
            filterBar.querySelectorAll('[data-prio-f]').forEach(b => b.classList.toggle('active', b === btn));
            render();
        });
    });
    // Sort
    sortSel.addEventListener('change', () => { sortMode = sortSel.value; render(); });

    // CMD palette
    $('cmd-overlay').addEventListener('click', e => { if (e.target === cmdOverlay) closeCmd(); });
    cmdIn.addEventListener('input', () => renderCmdResults(cmdIn.value));
    cmdIn.addEventListener('keydown', e => { if (e.key === 'Escape') closeCmd(); });

    // Global keyboard shortcuts
    document.addEventListener('keydown', e => {
        const inInput = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA';
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); cmdOverlay.hidden ? openCmd() : closeCmd(); return; }
        if (e.key === 'Escape') {
            if (colorPop) { closeColorPicker(); return; }
            if (!cmdOverlay.hidden) { closeCmd(); return; }
            if (!taskModal.hidden) { closeTaskModal(); return; }
            if (!groupModal.hidden) { groupModal.hidden = true; return; }
            if (!tplModal.hidden) { tplModal.hidden = true; return; }
        }
        if (!inInput && e.key === 'n') { e.preventDefault(); openGroupModal(); }
    });

    // ── TASK MODAL ──
    $('td-close').addEventListener('click', closeTaskModal);
    $('td-cancel').addEventListener('click', closeTaskModal);
    taskModal.addEventListener('click', e => { if (e.target === taskModal) closeTaskModal(); });

    // priority buttons
    document.querySelectorAll('#td-prio-row .prio-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            const t = S.tasks.find(t => t.id === editTaskId); if (!t) return;
            t.priority = btn.dataset.p;
            document.querySelectorAll('#td-prio-row .prio-opt').forEach(b => b.className = 'prio-opt' + (b === btn ? ` sel-${t.priority}` : ''));
            renderPrioBadge(t.priority);
        });
    });

    // notes preview/edit toggle
    $('td-preview-btn').addEventListener('click', () => {
        const raw = $('td-notes').value;
        $('td-notes-preview').innerHTML = parseMarkdown(raw) || '<span style="color:var(--txt3);font-size:.82rem">Sin notas.</span>';
        $('td-notes').style.display = 'none';
        $('td-notes-preview').style.display = '';
        $('td-preview-btn').style.display = 'none';
        $('td-edit-btn').style.display = '';
    });
    $('td-edit-btn').addEventListener('click', () => {
        $('td-notes').style.display = '';
        $('td-notes-preview').style.display = 'none';
        $('td-preview-btn').style.display = '';
        $('td-edit-btn').style.display = 'none';
    });

    // tags input
    const tagsIn = $('td-tags-in');
    tagsIn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTagToTask(tagsIn.value.trim()); tagsIn.value = ''; updateTagSuggestions(''); }
        if (e.key === 'Backspace' && !tagsIn.value) { const t = S.tasks.find(t => t.id === editTaskId); if (t && t.tags.length) { t.tags.pop(); renderModalTags(); } }
    });
    tagsIn.addEventListener('input', () => updateTagSuggestions(tagsIn.value.trim()));
    tagsIn.addEventListener('blur', () => setTimeout(() => $('td-tag-sug').style.display = 'none', 150));
    $('td-tags-wrap').addEventListener('click', () => tagsIn.focus());

    // add custom field
    $('td-add-cf').addEventListener('click', () => {
        const name = prompt('Nombre del campo:'); if (!name) return;
        const type = prompt(`Tipo (${CF_TYPES.join(', ')}):`)?.toLowerCase(); if (!CF_TYPES.includes(type)) return;
        if (!S.customFieldDefs) S.customFieldDefs = [];
        S.customFieldDefs.push({ id: uid(), name, type });
        save(); renderCustomFields();
    });

    // subtasks in modal
    const subIn = $('td-sub-in');
    $('td-sub-add').addEventListener('click', () => {
        const v = subIn.value.trim(); if (!v) return;
        const t = S.tasks.find(t => t.id === editTaskId); if (!t) return;
        if (!t.subtasks) t.subtasks = [];
        t.subtasks.push({ id: uid(), text: v, done: false });
        save(); renderModalSubtasks(); subIn.value = '';
    });
    subIn.addEventListener('keydown', e => { if (e.key === 'Enter') $('td-sub-add').click(); });

    // comments
    $('td-comment-send').addEventListener('click', () => {
        const v = $('td-comment-in').value.trim(); if (!v) return;
        const t = S.tasks.find(t => t.id === editTaskId); if (!t) return;
        if (!t.comments) t.comments = [];
        t.comments.push({ id: uid(), text: v, ts: Date.now() });
        save(); renderComments(); $('td-comment-in').value = '';
    });
    $('td-comment-in').addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') $('td-comment-send').click(); });

    // history toggle
    $('hist-toggle').addEventListener('click', () => {
        showHistory = !showHistory;
        $('td-history').style.display = showHistory ? '' : 'none';
        $('hist-toggle').textContent = showHistory ? 'Ocultar historial' : 'Mostrar historial de cambios';
    });

    // save task
    $('td-save').addEventListener('click', () => {
        const t = S.tasks.find(t => t.id === editTaskId); if (!t) return;
        const newTitle = $('td-title').value.trim(); if (!newTitle) { $('td-title').focus(); return; }
        if (t.text !== newTitle) logHistory(t, `Título cambiado a "${newTitle}"`);
        t.text = newTitle;
        t.notes = $('td-notes').value.trim();
        t.due = $('td-due').value;
        t.dueTime = $('td-time') ? $('td-time').value : (t.dueTime || '');
        if (!t.due) t.dueTime = '';
        t.groupId = $('td-group').value;
        // tags saved live
        // custom fields saved live
        // subtasks saved live
        save(); render(); closeTaskModal(); toast_('Tarea guardada');
    });

    // delete task from modal
    $('td-delete').addEventListener('click', () => {
        const id = editTaskId;
        closeTaskModal();
        trashTask(id);
    });
}

function addTagToTask(tag) {
    if (!tag) return;
    const t = S.tasks.find(t => t.id === editTaskId); if (!t) return;
    tag = tag.toLowerCase().replace(/[^a-z0-9áéíóúñü\-_]/g, '');
    if (!tag || t.tags.includes(tag)) return;
    t.tags.push(tag);
    if (!S.allTags.includes(tag)) S.allTags.push(tag);
    renderModalTags();
}

function updateTagSuggestions(q) {
    const sug = $('td-tag-sug');
    const t = S.tasks.find(t => t.id === editTaskId);
    const existing = t?.tags || [];
    const matches = S.allTags.filter(tag => !existing.includes(tag) && (!q || tag.includes(q.toLowerCase())));
    if (!matches.length) { sug.style.display = 'none'; return; }
    sug.innerHTML = matches.slice(0, 6).map(tag => `<div class="tag-sug-item" data-tag="${tag}">${tag}</div>`).join('');
    sug.querySelectorAll('.tag-sug-item').forEach(el => {
        el.addEventListener('mousedown', e => { e.preventDefault(); addTagToTask(el.dataset.tag); $('td-tags-in').value = ''; sug.style.display = 'none'; });
    });
    sug.style.display = '';
}

function switchView(v) {
    view = v;
    document.querySelectorAll('.vtab').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    render();
}

// ─────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function highlight(text, q) { const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return text.replace(new RegExp(`(${safe})`, 'gi'), '<mark class="hl">$1</mark>'); }
function fmtDate(iso) { if (!iso) return ''; const d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }); }
function fmtTs(ts) { return new Date(ts).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
function emptyBoardHTML() { return `<div class="empty-board"><svg width="56" height="56" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="26" stroke="#2a4a6b" stroke-width="1.5"/><circle cx="28" cy="28" r="5" fill="#1a6cff" opacity=".5"/><path d="M28 2A26 26 0 0 1 54 28" stroke="#1a6cff" stroke-width="1.5" stroke-linecap="round" opacity=".4"/></svg><p>Sin grupos. Usa "Nuevo grupo" o carga un template.</p></div>`; }
let toastTimer;
function toast_(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2400); }

const TAG_COLORS = ['#1a6cff', '#2cb67d', '#ffa94d', '#ff6b6b', '#cc5de8', '#74c0fc', '#f783ac', '#a9e34b', '#ff922b', '#20c997'];
const tagColorCache = {};
function tagColor(tag) { if (!tagColorCache[tag]) { let h = 0; for (let c of tag) h = (h * 31 + c.charCodeAt(0)) & 0xfffffff; tagColorCache[tag] = TAG_COLORS[h % TAG_COLORS.length]; } return tagColorCache[tag]; }

function parseMarkdown(md) {
    if (!md) return '';
    let html = esc(md);
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/^\- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br/>');
    return '<p>' + html + '</p>';
}

// ─────────────────────────────────────────────────
//  PERSISTENCE (caché local + sincronización con la nube)
// ─────────────────────────────────────────────────
// Solo permite colores hex válidos (evita inyección vía style="" con datos importados)
function safeColor(c) { return (typeof c === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(c)) ? c : '#1a6cff'; }

function ensureShape(state) {
    if (!state.groups) state.groups = [];
    if (!state.tasks) state.tasks = [];
    if (!state.allTags) state.allTags = [];
    if (!state.customFieldDefs) state.customFieldDefs = [];
    state.groups.forEach(g => { g.color = safeColor(g.color); });
    state.tasks.forEach(t => {
        if (!t.subtasks) t.subtasks = [];
        if (!t.comments) t.comments = [];
        if (!t.tags) t.tags = [];
        if (!t.history) t.history = [];
        if (!t.relations) t.relations = [];
        if (!t.customFields) t.customFields = {};
        if (t.dueTime === undefined) t.dueTime = '';
        if (t.recurrence === undefined) t.recurrence = 'none';
    });
    return state;
}

function loadLocalRaw() {
    try { const r = localStorage.getItem('orbit-v3'); return r ? JSON.parse(r) : null; }
    catch (e) { return null; }
}

function save() {
    try { localStorage.setItem('orbit-v3', JSON.stringify(S)); } catch (e) { }
    scheduleCloudPush();
}

function loadState() {
    const raw = loadLocalRaw();
    S = raw ? ensureShape(raw) : { groups: [], tasks: [], allTags: [], customFieldDefs: [] };
}

// ── SINCRONIZACIÓN CON LA NUBE (debounced) ──
let _cloudPushTimer = null;
function cloudEnabled() { return !!(window.OrbitCloud && window.OrbitCloud.enabled && CURRENT_USER); }
function scheduleCloudPush() {
    if (!cloudEnabled()) return;
    clearTimeout(_cloudPushTimer);
    _cloudPushTimer = setTimeout(() => {
        window.OrbitCloud.push(CURRENT_USER.id, S).catch(e => {
            console.error('Error de sincronización:', e);
            toast_('⚠️ Error al sincronizar con la nube');
        });
    }, 800);
}

// ─────────────────────────────────────────────────
//  BOOTSTRAP + GATE DE AUTENTICACIÓN
// ─────────────────────────────────────────────────
let _loadedForUser = null;

function bootstrap() {
    buildColorSwatches(gmColors, c => selectedColor = c, selectedColor);
    buildTemplates();
    bindUI();
    if (window.OrbitCloud && window.OrbitCloud.enabled) {
        // Modo nube: esperar a la sesión antes de mostrar datos
        window.OrbitAuth.init(onLogin, onLogout);
    } else {
        // Modo local (Supabase sin configurar): comportamiento offline clásico
        loadState();
        if (!S.groups.length) seedDefaults();
        render();
    }
}

async function onLogin(user) {
    if (_loadedForUser === user.id) { window.OrbitAuth.hideLoginScreen(); return; }
    _loadedForUser = user.id;
    CURRENT_USER = user;
    window.OrbitAuth.hideLoginScreen();
    const logoutBtn = $('logout-btn');
    if (logoutBtn) logoutBtn.style.display = '';
    try {
        const cloud = await window.OrbitCloud.pull(user.id, user.email);
        const local = loadLocalRaw();
        const cloudHasData = cloud && (cloud.groups.length || cloud.tasks.length);
        const localHasData = local && ((local.tasks && local.tasks.length) || (local.groups && local.groups.length));
        if (cloudHasData) {
            S = ensureShape(cloud);
        } else if (localHasData) {
            // Primer inicio de sesión: migrar los datos locales a la nube
            S = ensureShape(local);
            await window.OrbitCloud.push(user.id, S);
            toast_('Datos locales migrados a la nube ✓');
        } else {
            S = { groups: [], tasks: [], allTags: [], customFieldDefs: [] };
            seedDefaults();
            await window.OrbitCloud.push(user.id, S);
        }
    } catch (e) {
        console.error('No se pudo cargar desde la nube, usando datos locales:', e);
        toast_('⚠️ Sin conexión con la nube, usando datos locales');
        loadState();
    }
    render();
}

function onLogout() {
    CURRENT_USER = null;
    _loadedForUser = null;
    clearTimeout(_cloudPushTimer);
    S = { groups: [], tasks: [], allTags: [], customFieldDefs: [] };
    const logoutBtn = $('logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'none';
    render();
    window.OrbitAuth.showLoginScreen();
}

// ─────────────────────────────────────────────────
//  EXPORT / IMPORT
// ─────────────────────────────────────────────────
function exportData() {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast_('Datos exportados ✓');
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.groups || !data.tasks) throw new Error('Formato inválido');
            if (!confirm(`¿Importar datos? Se reemplazarán ${S.groups.length} grupos y ${S.tasks.length} tareas actuales.`)) return;
            S = ensureShape(data);
            save(); render(); toast_('Datos importados correctamente ✓');
        } catch (err) {
            alert('Error al importar: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// ─────────────────────────────────────────────────
//  THEME
// ─────────────────────────────────────────────────
let isLight = localStorage.getItem('orbit-theme') === 'light';
function applyTheme() {
    document.body.classList.toggle('light', isLight);
    const icon = $('theme-icon');
    if (icon) icon.innerHTML = isLight
        ? '<path d="M7 1v1M7 12v1M1 7h1M12 7h1M2.9 2.9l.7.7M10.4 10.4l.7.7M2.9 11.1l.7-.7M10.4 3.6l.7-.7M7 4.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'
        : '<path d="M12 7.5A5.5 5.5 0 016.5 2 5.5 5.5 0 102 7.5 5.5 5.5 0 0012 7.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>';
    localStorage.setItem('orbit-theme', isLight ? 'light' : 'dark');
}

function toggleTheme() { isLight = !isLight; applyTheme(); }

// ─────────────────────────────────────────────────
//  DUPLICATE TASK
// ─────────────────────────────────────────────────
function duplicateTask(taskId) {
    const t = S.tasks.find(t => t.id === taskId); if (!t) return;
    const copy = JSON.parse(JSON.stringify(t));
    copy.id = uid();
    copy.text = copy.text + ' (copia)';
    copy.done = false;
    copy.order = Date.now();
    copy.history = [{ msg: 'Tarea duplicada', ts: Date.now() }];
    copy.comments = [];
    S.tasks.splice(S.tasks.indexOf(t) + 1, 0, copy);
    save(); render(); toast_('Tarea duplicada');
    return copy.id;
}

// ─────────────────────────────────────────────────
//  RELATIONS
// ─────────────────────────────────────────────────
let pendingRelType = null;

function renderRelations() {
    const t = S.tasks.find(t => t.id === editTaskId); if (!t) return;
    const container = $('td-relations'); container.innerHTML = '';
    (t.relations || []).forEach((rel, i) => {
        const related = S.tasks.find(r => r.id === rel.targetId);
        if (!related) return;
        const el = document.createElement('div'); el.className = 'rel-item';
        const typeLabel = rel.type === 'depende-de' ? 'Depende de' : 'Bloquea';
        const typeClass = rel.type === 'bloquea' ? 'blocks' : 'blocked-by';
        el.innerHTML = `
      <span class="rel-type ${typeClass}">${typeLabel}</span>
      <span class="rel-name">${esc(related.text)}</span>
      <button class="rel-del" data-ri="${i}">× Quitar</button>`;
        el.querySelector('.rel-del').addEventListener('click', () => {
            t.relations.splice(i, 1); save(); renderRelations();
        });
        container.appendChild(el);
    });
    if (!t.relations?.length) container.innerHTML = '<div style="font-size:.76rem;color:var(--txt3);padding:2px 0">Sin relaciones.</div>';
}

function openRelPicker(relType) {
    pendingRelType = relType;
    const picker = $('td-rel-picker'); picker.style.display = '';
    const searchIn = $('td-rel-search'); searchIn.value = ''; searchIn.focus();
    renderRelResults('');
}

function renderRelResults(q) {
    const t = S.tasks.find(t => t.id === editTaskId); if (!t) return;
    const existing = (t.relations || []).map(r => r.targetId);
    const results = $('td-rel-results'); results.innerHTML = '';
    const matches = S.tasks
        .filter(task => task.id !== editTaskId && !existing.includes(task.id) && (!q || task.text.toLowerCase().includes(q.toLowerCase())))
        .slice(0, 8);
    if (!matches.length) { results.innerHTML = '<div style="font-size:.76rem;color:var(--txt3);padding:6px">Sin resultados.</div>'; return; }
    matches.forEach(task => {
        const btn = document.createElement('button');
        btn.className = 'btn-ghost'; btn.style.cssText = 'width:100%;justify-content:flex-start;font-size:.8rem;padding:5px 10px;margin:1px 0';
        btn.textContent = task.text;
        btn.addEventListener('click', () => {
            if (!t.relations) t.relations = [];
            t.relations.push({ type: pendingRelType, targetId: task.id });
            logHistory(t, `Relación "${pendingRelType}" → "${task.text}"`);
            save(); renderRelations(); $('td-rel-picker').style.display = 'none'; pendingRelType = null;
        });
        results.appendChild(btn);
    });
}

// ─────────────────────────────────────────────────
//  EXTEND openTaskModal WITH NEW FEATURES
// ─────────────────────────────────────────────────
const _origOpenTaskModal = openTaskModal;
openTaskModal = function (taskId) {
    _origOpenTaskModal(taskId);
    renderRelations();
    // bind relation buttons
    document.querySelectorAll('[data-rel-type]').forEach(btn => {
        btn.onclick = () => openRelPicker(btn.dataset.relType);
    });
    $('td-rel-search').oninput = e => renderRelResults(e.target.value);
    // bind duplicate from modal
    $('td-duplicate').onclick = () => {
        const newId = duplicateTask(editTaskId);
        closeTaskModal();
    };
    // Ctrl+Enter saves
    taskModal.addEventListener('keydown', function onKey(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); $('td-save').click(); taskModal.removeEventListener('keydown', onKey); }
        if (e.key === 'Escape') taskModal.removeEventListener('keydown', onKey);
    }, { once: false });
};

// ─────────────────────────────────────────────────
//  EXTEND BIND UI WITH NEW BINDINGS
// ─────────────────────────────────────────────────
const _origBindUI = bindUI;
bindUI = function () {
    _origBindUI();

    // Theme
    applyTheme();
    $('theme-btn').addEventListener('click', toggleTheme);

    // Logout (solo visible en modo nube)
    const logoutBtn = $('logout-btn');
    if (logoutBtn && window.OrbitCloud && window.OrbitCloud.enabled) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Cerrar sesión? Tus datos quedan guardados en la nube.')) {
                window.OrbitAuth.logout();
            }
        });
    }

    // Export
    $('export-btn').addEventListener('click', exportData);

    // Import
    $('import-input').addEventListener('change', e => {
        if (e.target.files[0]) { importData(e.target.files[0]); e.target.value = ''; }
    });

    // Shortcuts panel
    $('shortcuts-close').addEventListener('click', () => $('shortcuts-overlay').hidden = true);
    $('shortcuts-overlay').addEventListener('click', e => { if (e.target === $('shortcuts-overlay')) $('shortcuts-overlay').hidden = true; });

    // Extended keyboard shortcuts
    document.addEventListener('keydown', e => {
        const inInput = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT';
        if (inInput) return;
        // view shortcuts
        if (e.key === '1') switchView('list');
        if (e.key === '2') switchView('kanban');
        if (e.key === '3') switchView('calendar');
        // search focus
        if (e.key === '/') { e.preventDefault(); searchInput.focus(); }
        // theme
        if (e.key === 't' || e.key === 'T') toggleTheme();
        // shortcuts panel
        if (e.key === '?') $('shortcuts-overlay').hidden = !$('shortcuts-overlay').hidden;
        // export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') { e.preventDefault(); exportData(); }
        // duplicate (when modal is open)
        if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !taskModal.hidden) { e.preventDefault(); if (editTaskId) duplicateTask(editTaskId); }
    });
};

// ═══════════════════════════════════════════════════
//  MEJORAS v4 — Hoy · Recordatorios · Recurrencia · Deshacer
// ═══════════════════════════════════════════════════

// ── Toast con acción "Deshacer" (reutiliza #toast) ──
let _undoTimer;
function toastUndo(msg, onUndo) {
    toast.innerHTML = `<span>${esc(msg)}</span><button class="toast-undo" type="button">Deshacer</button>`;
    toast.classList.add('show', 'toast-has-action');
    clearTimeout(toastTimer); clearTimeout(_undoTimer);
    toast.querySelector('.toast-undo').addEventListener('click', () => {
        clearTimeout(_undoTimer);
        toast.classList.remove('show', 'toast-has-action');
        onUndo();
    });
    _undoTimer = setTimeout(() => { toast.classList.remove('show', 'toast-has-action'); _lastTrash = null; }, 6000);
}
// Que el toast normal limpie el estado con botón
const _origToast_ = toast_;
toast_ = function (m) { toast.classList.remove('toast-has-action'); toast.innerHTML = ''; _origToast_(m); };

// ── DESHACER ELIMINACIÓN (papelera de 1 nivel + Ctrl+Z) ──
let _lastTrash = null;

function trashTask(id) {
    const idx = S.tasks.findIndex(t => t.id === id);
    if (idx < 0) return;
    _lastTrash = { type: 'task', data: JSON.parse(JSON.stringify(S.tasks[idx])), index: idx };
    S.tasks.splice(idx, 1);
    save(); render();
    toastUndo('Tarea eliminada', undoTrash);
}

function trashGroup(id) {
    const g = S.groups.find(x => x.id === id);
    if (!g) return;
    if (!confirm(`¿Eliminar grupo "${g.name}" y sus tareas? Podrás deshacerlo.`)) return;
    const gIndex = S.groups.indexOf(g);
    const tasks = S.tasks.map((t, i) => ({ t, i })).filter(x => x.t.groupId === id)
        .map(x => ({ task: JSON.parse(JSON.stringify(x.t)), index: x.i }));
    _lastTrash = { type: 'group', group: JSON.parse(JSON.stringify(g)), gIndex, tasks };
    S.groups.splice(gIndex, 1);
    S.tasks = S.tasks.filter(t => t.groupId !== id);
    save(); render();
    toastUndo('Grupo eliminado', undoTrash);
}

function undoTrash() {
    if (!_lastTrash) return;
    if (_lastTrash.type === 'task') {
        S.tasks.splice(Math.min(_lastTrash.index, S.tasks.length), 0, _lastTrash.data);
    } else if (_lastTrash.type === 'group') {
        S.groups.splice(Math.min(_lastTrash.gIndex, S.groups.length), 0, _lastTrash.group);
        _lastTrash.tasks.forEach(({ task, index }) => S.tasks.splice(Math.min(index, S.tasks.length), 0, task));
    } else if (_lastTrash.type === 'bulk') {
        _lastTrash.items.forEach(({ task, index }) => S.tasks.splice(Math.min(index, S.tasks.length), 0, task));
    }
    _lastTrash = null;
    save(); render(); toast_('Restaurado ✓');
}

// ── COMPLETAR TAREA (punto central) + RECURRENCIA ──
function nextRecurDate(iso, freq) {
    const base = iso ? new Date(iso + 'T00:00:00') : new Date(new Date().toDateString());
    if (freq === 'daily') base.setDate(base.getDate() + 1);
    else if (freq === 'weekly') base.setDate(base.getDate() + 7);
    else if (freq === 'monthly') base.setMonth(base.getMonth() + 1);
    return base.toISOString().slice(0, 10);
}

function toggleTaskDone(id) {
    const t = S.tasks.find(x => x.id === id);
    if (!t) return;
    t.done = !t.done;
    logHistory(t, t.done ? 'Marcada como completada' : 'Marcada como pendiente');
    if (t.done && t.recurrence && t.recurrence !== 'none') {
        const copy = JSON.parse(JSON.stringify(t));
        copy.id = uid();
        copy.done = false;
        copy.due = nextRecurDate(t.due, t.recurrence);
        (copy.subtasks || []).forEach(s => s.done = false);
        copy.comments = [];
        copy.history = [{ msg: 'Creada automáticamente por recurrencia', ts: Date.now() }];
        copy.order = Date.now();
        S.tasks.splice(S.tasks.indexOf(t) + 1, 0, copy);
        save(); render();
        toast_(`🔁 Próxima repetición: ${fmtDate(copy.due)}`);
        return;
    }
    save(); render();
}

// ── RECORDATORIOS (Notification API) ──
let remindersEnabled = localStorage.getItem('orbit-reminders') === 'on';

function overdueOrTodayTasks() {
    const today = new Date(new Date().toDateString());
    return S.tasks.filter(t => !t.done && t.due && new Date(t.due + 'T00:00:00') <= today);
}

function updateReminderBadge() {
    const badge = $('rem-badge'); if (!badge) return;
    const n = overdueOrTodayTasks().length;
    badge.style.display = n > 0 ? '' : 'none';
    badge.textContent = n > 99 ? '99+' : n;
    const btn = $('reminders-btn');
    if (btn) btn.classList.toggle('rem-on', remindersEnabled);
}

function loadNotified() {
    const today = new Date().toDateString();
    try {
        const r = JSON.parse(localStorage.getItem('orbit-notified') || '{}');
        return r.date === today ? r : { date: today, ids: [] };
    } catch (e) { return { date: today, ids: [] }; }
}

function checkReminders() {
    updateReminderBadge();
    if (!remindersEnabled || !('Notification' in window) || Notification.permission !== 'granted') return;
    const rec = loadNotified();
    const today = new Date(new Date().toDateString());
    const due = overdueOrTodayTasks().filter(t => !rec.ids.includes(t.id));
    if (!due.length) return;
    due.slice(0, 5).forEach(t => {
        const overdue = new Date(t.due + 'T00:00:00') < today;
        try {
            new Notification(overdue ? '⏰ Tarea vencida' : '📌 Vence hoy', { body: t.text + (t.dueTime ? ' · ' + t.dueTime : ''), tag: 'orbit-' + t.id });
        } catch (e) { /* algunos navegadores requieren gesto */ }
        rec.ids.push(t.id);
    });
    localStorage.setItem('orbit-notified', JSON.stringify(rec));
}

function toggleReminders() {
    if (!('Notification' in window)) { toast_('Tu navegador no soporta notificaciones'); return; }
    if (!remindersEnabled) {
        Notification.requestPermission().then(p => {
            if (p === 'granted') {
                remindersEnabled = true;
                localStorage.setItem('orbit-reminders', 'on');
                toast_('🔔 Recordatorios activados');
                checkReminders();
            } else {
                toast_('Permiso de notificaciones denegado');
            }
            updateReminderBadge();
        });
    } else {
        remindersEnabled = false;
        localStorage.setItem('orbit-reminders', 'off');
        toast_('Recordatorios desactivados');
        updateReminderBadge();
    }
}

// ── VISTA "HOY" (agenda) ──
function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días ☀️' : h < 19 ? 'Buenas tardes 🌤️' : 'Buenas noches 🌙';
}

function agendaItem(t) {
    const g = S.groups.find(x => x.id === t.groupId);
    const el = document.createElement('div');
    el.className = 'agenda-item';
    el.innerHTML = `
    <button class="chk" aria-label="Completar tarea">
      <svg viewBox="0 0 9 8" fill="none"><path d="M1 4l2.5 3 5-6" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="agenda-main">
      <span class="agenda-text">${esc(t.text)}</span>
      <div class="agenda-meta">
        ${g ? `<span class="agenda-grp"><span class="dotc" style="background:${safeColor(g.color)}"></span>${esc(g.name)}</span>` : ''}
        ${t.priority && t.priority !== 'none' ? `<span class="prio-b p-${t.priority}">${PRIO_LABELS[t.priority]}</span>` : ''}
        <span class="agenda-date">${fmtDate(t.due)}${t.dueTime ? ' · ' + t.dueTime : ''}</span>
        ${t.recurrence && t.recurrence !== 'none' ? '<span class="agenda-rec" title="Tarea recurrente">🔁</span>' : ''}
      </div>
    </div>`;
    el.querySelector('.chk').addEventListener('click', e => { e.stopPropagation(); toggleTaskDone(t.id); });
    el.addEventListener('click', () => openTaskModal(t.id));
    return el;
}

function renderToday() {
    mainEl.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'agenda';
    const today = new Date(new Date().toDateString());
    const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
    const pend = S.tasks.filter(t => !t.done && t.due);
    const overdue = pend.filter(t => new Date(t.due + 'T00:00:00') < today).sort((a, b) => a.due.localeCompare(b.due));
    const todayT = pend.filter(t => new Date(t.due + 'T00:00:00').getTime() === today.getTime());
    const upcoming = pend.filter(t => { const d = new Date(t.due + 'T00:00:00'); return d > today && d <= in7; }).sort((a, b) => a.due.localeCompare(b.due));
    const noDate = S.tasks.filter(t => !t.done && !t.due);
    const total = overdue.length + todayT.length + upcoming.length;

    const head = document.createElement('div');
    head.className = 'agenda-head';
    head.innerHTML = `<h2>${greeting()}</h2><p>${total ? `Tienes <b>${total}</b> tarea(s) con fecha próxima.` : '¡Todo al día! No hay tareas con fecha próxima. 🎉'}</p>`;
    wrap.appendChild(head);

    [
        { title: 'Vencidas', cls: 'ov', icon: '⏰', tasks: overdue },
        { title: 'Hoy', cls: 'tod', icon: '📌', tasks: todayT },
        { title: 'Próximos 7 días', cls: 'up', icon: '🗓️', tasks: upcoming },
    ].forEach(sec => {
        if (!sec.tasks.length) return;
        const s = document.createElement('div');
        s.className = 'agenda-sec';
        s.innerHTML = `<div class="agenda-sec-h agenda-${sec.cls}"><span>${sec.icon} ${sec.title}</span><span class="agenda-n">${sec.tasks.length}</span></div>`;
        sec.tasks.forEach(t => s.appendChild(agendaItem(t)));
        wrap.appendChild(s);
    });

    if (noDate.length) {
        const s = document.createElement('div');
        s.className = 'agenda-sec';
        s.innerHTML = `<div class="agenda-sec-h agenda-none"><span>📥 Sin fecha</span><span class="agenda-n">${noDate.length}</span></div>`;
        noDate.slice(0, 8).forEach(t => s.appendChild(agendaItem(t)));
        wrap.appendChild(s);
    }

    if (total === 0 && noDate.length === 0) {
        const e = document.createElement('div');
        e.className = 'empty-board';
        e.innerHTML = `<svg width="52" height="52" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="26" stroke="#2a4a6b" stroke-width="1.5"/><path d="M18 29l7 7 13-15" stroke="#2cb67d" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><p>Sin pendientes con fecha. ¡Buen trabajo! 🎉</p>`;
        wrap.appendChild(e);
    }
    mainEl.appendChild(wrap);
}

// ── ENGANCHAR VISTA "HOY" AL ROUTER ──
const _origRender = render;
render = function () {
    if (view === 'today') { updateStats(); updateTagFilters(); renderToday(); }
    else _origRender();
    updateReminderBadge();
};

// ── RECURRENCIA EN EL MODAL ──
const _origOpenTaskModalV4 = openTaskModal;
openTaskModal = function (id) {
    _origOpenTaskModalV4(id);
    const t = S.tasks.find(x => x.id === id); if (!t) return;
    const rec = $('td-recur');
    if (rec) { rec.value = t.recurrence || 'none'; rec.onchange = () => { t.recurrence = rec.value; save(); }; }
    const tm = $('td-time');
    if (tm) { tm.value = t.dueTime || ''; tm.onchange = () => { t.dueTime = tm.value; save(); }; }
};

// ── BINDINGS v4 (recordatorios, intervalo, Ctrl+Z) ──
const _origBindUIV4 = bindUI;
bindUI = function () {
    _origBindUIV4();
    const rb = $('reminders-btn');
    if (rb) rb.addEventListener('click', toggleReminders);
    updateReminderBadge();
    setInterval(checkReminders, 60000);
    setTimeout(checkReminders, 1500);
    document.addEventListener('keydown', e => {
        const inInput = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !inInput && _lastTrash) { e.preventDefault(); undoTrash(); }
    });
};

// ═══════════════════════════════════════════════════
//  MEJORAS v5 — Panel de productividad (charts SVG)
// ═══════════════════════════════════════════════════
const CH = { done: '#2cb67d', accent: '#1a6cff', high: '#ff6b6b', med: '#ffa94d', low: '#69db7c', none: '#7a8fa8', grid: 'var(--bd)', ink: 'var(--txt)', ink2: 'var(--txt2)', ink3: 'var(--txt3)' };
const DOW_ES = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function dayKey(d) { return d.toISOString().slice(0, 10); }

function computeDashboard() {
    const total = S.tasks.length;
    const done = S.tasks.filter(t => t.done).length;
    const pct = total ? Math.round(done / total * 100) : 0;
    const overdue = S.tasks.filter(t => !t.done && t.due && new Date(t.due + 'T00:00:00') < new Date(new Date().toDateString())).length;

    // Completadas por día (últimos 7 días) a partir del historial
    const compByDay = {};
    S.tasks.forEach(t => (t.history || []).forEach(h => {
        if (h.msg === 'Marcada como completada') { const k = new Date(h.ts).toISOString().slice(0, 10); compByDay[k] = (compByDay[k] || 0) + 1; }
    }));
    const days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = dayKey(d); days.push({ label: DOW_ES[d.getDay()], value: compByDay[k] || 0, key: k }); }

    // Racha: días consecutivos (terminando hoy) con ≥1 completada
    let streak = 0;
    for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (compByDay[dayKey(d)]) streak++; else break; }

    // Distribución por prioridad
    const prio = [
        { label: 'Alta', value: S.tasks.filter(t => t.priority === 'high').length, color: CH.high },
        { label: 'Media', value: S.tasks.filter(t => t.priority === 'medium').length, color: CH.med },
        { label: 'Baja', value: S.tasks.filter(t => t.priority === 'low').length, color: CH.low },
        { label: 'Sin', value: S.tasks.filter(t => !t.priority || t.priority === 'none').length, color: CH.none },
    ].filter(s => s.value > 0);

    // Tareas por grupo (color propio del grupo)
    const byGroup = S.groups.map(g => ({
        name: g.name, color: safeColor(g.color),
        value: S.tasks.filter(t => t.groupId === g.id).length,
        done: S.tasks.filter(t => t.groupId === g.id && t.done).length,
    })).filter(r => r.value > 0).sort((a, b) => b.value - a.value);

    return { total, done, pct, overdue, days, streak, prio, byGroup };
}

// Gráfico de barras verticales — una sola serie (sin leyenda; el título la nombra)
function chartBars7(days) {
    const W = 320, H = 172, x0 = 26, x1 = 312, top = 22, base = 140;
    const max = Math.max(1, ...days.map(d => d.value));
    const slot = (x1 - x0) / days.length, bw = Math.min(26, slot - 12);
    let bars = '';
    days.forEach((d, i) => {
        const cx = x0 + slot * i + slot / 2;
        const h = d.value / max * (base - top);
        const y = base - h;
        if (d.value > 0) {
            bars += `<rect x="${(cx - bw / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="4" fill="${CH.done}"><title>${d.key}: ${d.value} completada(s)</title></rect>`;
            bars += `<text x="${cx.toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="10" fill="var(--txt2)">${d.value}</text>`;
        }
        bars += `<text x="${cx.toFixed(1)}" y="156" text-anchor="middle" font-size="10" fill="var(--txt3)">${d.label}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img" aria-label="Tareas completadas en los últimos 7 días">
    <line x1="${x0}" y1="${base}" x2="${x1}" y2="${base}" stroke="var(--bd)" stroke-width="1"/>${bars}</svg>`;
}

// Donut — categórico (leyenda + etiquetas: identidad nunca solo por color)
function chartDonut(segs, centerNum, centerLbl) {
    const total = segs.reduce((s, x) => s + x.value, 0) || 1;
    const r = 58, cx = 80, cy = 80, sw = 18, C = 2 * Math.PI * r;
    let off = 0, arcs = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bd)" stroke-width="${sw}"/>`;
    segs.forEach(s => {
        const len = s.value / total * C;
        const gap = 3;
        arcs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${sw}" stroke-dasharray="${Math.max(0, len - gap).toFixed(1)} ${(C - Math.max(0, len - gap)).toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 ${cx} ${cy})" stroke-linecap="round"><title>${esc(s.label)}: ${s.value}</title></circle>`;
        off += len;
    });
    const legend = segs.map(s => `<div class="lg-row"><span class="lg-dot" style="background:${s.color}"></span><span class="lg-lbl">${esc(s.label)}</span><span class="lg-val">${s.value}</span></div>`).join('');
    return `<div class="donut-wrap">
    <svg viewBox="0 0 160 160" class="donut-svg" role="img" aria-label="Distribución por prioridad">${arcs}
      <text x="80" y="76" text-anchor="middle" font-size="26" font-weight="700" fill="var(--txt)">${centerNum}</text>
      <text x="80" y="94" text-anchor="middle" font-size="10" fill="var(--txt3)">${centerLbl}</text>
    </svg>
    <div class="donut-legend">${legend}</div>
  </div>`;
}

// Barras horizontales — color propio de cada grupo (color sigue a la entidad)
function chartGroupBars(rows) {
    if (!rows.length) return '<p class="dash-empty">Aún no hay grupos con tareas.</p>';
    const max = Math.max(1, ...rows.map(r => r.value));
    return '<div class="hbars">' + rows.slice(0, 8).map(r => {
        const w = Math.round(r.value / max * 100);
        const donePct = r.value ? Math.round(r.done / r.value * 100) : 0;
        return `<div class="hbar-row" title="${esc(r.name)}: ${r.done}/${r.value} completadas">
      <span class="hbar-name">${esc(r.name)}</span>
      <div class="hbar-track"><div class="hbar-fill" style="width:${w}%;background:${r.color}"><div class="hbar-done" style="width:${donePct}%"></div></div></div>
      <span class="hbar-val">${r.done}/${r.value}</span>
    </div>`;
    }).join('') + '</div>';
}

function statTile(num, label, cls) {
    return `<div class="dstat ${cls || ''}"><div class="dstat-num">${num}</div><div class="dstat-lbl">${label}</div></div>`;
}

function renderDashboard() {
    const d = computeDashboard();
    mainEl.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'dash';
    wrap.innerHTML = `
    <div class="dash-head"><h2>Panel de productividad</h2><p>Un vistazo a tu progreso.</p></div>
    <div class="dstat-row">
      ${statTile(d.total, 'Tareas totales')}
      ${statTile(d.done, 'Completadas', 'ok')}
      ${statTile(d.pct + '%', 'Progreso', 'accent')}
      ${statTile('🔥 ' + d.streak, 'Racha (días)')}
      ${statTile(d.overdue, 'Vencidas', d.overdue ? 'err' : '')}
    </div>
    <div class="dash-grid">
      <div class="dash-card dash-card-wide">
        <div class="dash-card-h">Completadas · últimos 7 días</div>
        ${chartBars7(d.days)}
      </div>
      <div class="dash-card">
        <div class="dash-card-h">Por prioridad</div>
        ${d.prio.length ? chartDonut(d.prio, d.total, 'tareas') : '<p class="dash-empty">Sin datos.</p>'}
      </div>
      <div class="dash-card dash-card-wide">
        <div class="dash-card-h">Tareas por grupo <span class="dash-card-sub">(barra clara = completadas)</span></div>
        ${chartGroupBars(d.byGroup)}
      </div>
    </div>`;
    mainEl.appendChild(wrap);
}

// ── ENGANCHAR "PANEL" AL ROUTER ──
const _renderV5 = render;
render = function () {
    if (view === 'dash') { updateStats(); renderDashboard(); updateReminderBadge(); }
    else _renderV5();
};

// ═══════════════════════════════════════════════════
//  MEJORAS v6 — Selección múltiple · Acciones en lote · Teclado
// ═══════════════════════════════════════════════════
let selectedTasks = new Set();
let focusedTaskId = null;

function visibleTaskEls() { return Array.from(document.querySelectorAll('#main .task-item')); }

function toggleSelect(id) {
    if (selectedTasks.has(id)) selectedTasks.delete(id); else selectedTasks.add(id);
    render();
}

function enhanceListSelection() {
    visibleTaskEls().forEach(el => {
        const id = el.dataset.taskId;
        if (selectedTasks.has(id)) el.classList.add('selected');
        if (id === focusedTaskId) el.classList.add('focused');
        const box = document.createElement('button');
        box.className = 'sel-box' + (selectedTasks.has(id) ? ' on' : '');
        box.type = 'button';
        box.setAttribute('aria-label', 'Seleccionar tarea');
        box.setAttribute('aria-pressed', selectedTasks.has(id) ? 'true' : 'false');
        box.addEventListener('click', e => { e.stopPropagation(); toggleSelect(id); });
        el.insertBefore(box, el.firstChild);
    });
}

function updateBulkBar() {
    // Podar selección a tareas existentes
    [...selectedTasks].forEach(id => { if (!S.tasks.find(t => t.id === id)) selectedTasks.delete(id); });
    let bar = $('bulk-bar');
    if (selectedTasks.size === 0) { if (bar) bar.classList.remove('show'); return; }
    if (!bar) { bar = document.createElement('div'); bar.id = 'bulk-bar'; bar.className = 'bulk-bar'; document.body.appendChild(bar); }
    const opts = S.groups.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('');
    bar.innerHTML = `
    <span class="bulk-count">${selectedTasks.size} seleccionada(s)</span>
    <button class="btn-ghost" data-b="done">✓ Completar</button>
    <select class="bulk-move" aria-label="Mover a grupo"><option value="">Mover a…</option>${opts}</select>
    <button class="btn-ghost danger" data-b="del">Eliminar</button>
    <button class="btn-ghost" data-b="clear">✕</button>`;
    bar.classList.add('show');
    bar.querySelector('[data-b="done"]').onclick = bulkComplete;
    bar.querySelector('[data-b="del"]').onclick = bulkDelete;
    bar.querySelector('[data-b="clear"]').onclick = () => { selectedTasks.clear(); render(); };
    bar.querySelector('.bulk-move').onchange = e => { if (e.target.value) bulkMove(e.target.value); };
}

function bulkComplete() {
    let n = 0;
    selectedTasks.forEach(id => { const t = S.tasks.find(x => x.id === id); if (t && !t.done) { t.done = true; logHistory(t, 'Marcada como completada'); n++; } });
    selectedTasks.clear(); save(); render(); toast_(`${n} completada(s)`);
}

function bulkMove(gid) {
    const g = S.groups.find(x => x.id === gid); if (!g) return;
    let n = 0;
    selectedTasks.forEach(id => { const t = S.tasks.find(x => x.id === id); if (t && t.groupId !== gid) { t.groupId = gid; t.order = Date.now(); logHistory(t, `Movida al grupo "${g.name}"`); n++; } });
    selectedTasks.clear(); save(); render(); toast_(`${n} movida(s) a "${g.name}"`);
}

function bulkDelete() {
    const ids = [...selectedTasks];
    const items = ids.map(id => { const i = S.tasks.findIndex(t => t.id === id); return i < 0 ? null : { task: JSON.parse(JSON.stringify(S.tasks[i])), index: i }; })
        .filter(Boolean).sort((a, b) => a.index - b.index);
    if (!items.length) return;
    _lastTrash = { type: 'bulk', items };
    const idset = new Set(ids);
    S.tasks = S.tasks.filter(t => !idset.has(t.id));
    selectedTasks.clear();
    save(); render();
    toastUndo(`${items.length} tarea(s) eliminada(s)`, undoTrash);
}

function applyFocusVisual() {
    visibleTaskEls().forEach(el => el.classList.toggle('focused', el.dataset.taskId === focusedTaskId));
    const f = document.querySelector('#main .task-item.focused');
    if (f) f.scrollIntoView({ block: 'nearest' });
}

// ── Enganchar selección/teclado al router ──
const _renderV6 = render;
render = function () {
    _renderV6();
    if (view === 'list') enhanceListSelection();
    updateBulkBar();
};

const _origBindUIV6 = bindUI;
bindUI = function () {
    _origBindUIV6();
    document.addEventListener('keydown', e => {
        if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
        if (!taskModal.hidden || !cmdOverlay.hidden || !groupModal.hidden) return;
        if (view !== 'list') return;
        const ids = visibleTaskEls().map(x => x.dataset.taskId);
        if (!ids.length) return;
        let idx = ids.indexOf(focusedTaskId);
        if (e.key === 'ArrowDown') { e.preventDefault(); idx = idx < 0 ? 0 : Math.min(ids.length - 1, idx + 1); focusedTaskId = ids[idx]; applyFocusVisual(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); idx = idx <= 0 ? 0 : idx - 1; focusedTaskId = ids[idx]; applyFocusVisual(); }
        else if (focusedTaskId && ids.includes(focusedTaskId)) {
            if (e.key === ' ') { e.preventDefault(); toggleTaskDone(focusedTaskId); }
            else if (e.key === 'Enter') { e.preventDefault(); openTaskModal(focusedTaskId); }
            else if (e.key === 'x' || e.key === 'X') { e.preventDefault(); toggleSelect(focusedTaskId); }
        }
    });
};

// ═══════════════════════════════════════════════════
//  MEJORAS v7 — Sincronización entre pestañas del navegador
// ═══════════════════════════════════════════════════
// El evento 'storage' se dispara en las OTRAS pestañas cuando esta escribe
// en localStorage (no en la que lo provocó → sin bucles). Sirve en modo
// local y en modo nube, porque save() siempre refresca el caché local.
let _tabSyncTimer = null;
window.addEventListener('storage', e => {
    if (e.key !== 'orbit-v3' || !e.newValue) return;
    if (editTaskId) return;                 // no interrumpir una edición en curso
    clearTimeout(_tabSyncTimer);
    _tabSyncTimer = setTimeout(() => {
        try {
            S = ensureShape(JSON.parse(e.newValue));
            render();
            toast_('↻ Sincronizado desde otra pestaña');
        } catch (_) { /* JSON parcial: ignorar */ }
    }, 150);
});

// ═══════════════════════════════════════════════════
//  MEJORAS v8 — Adjuntos (Supabase Storage)
// ═══════════════════════════════════════════════════
function fmtSize(b) {
    if (b == null) return '';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(0) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
}

async function renderAttachments() {
    const sec = $('td-attach-section'); if (!sec) return;
    const list = $('td-attach-list');
    if (!cloudEnabled()) { sec.style.display = 'none'; return; }  // solo con nube activa
    sec.style.display = '';
    list.innerHTML = '<div class="attach-hint">Cargando…</div>';
    try {
        const atts = await window.OrbitCloud.listAttachments(editTaskId);
        if (!atts.length) { list.innerHTML = '<div class="attach-hint">Sin archivos.</div>'; return; }
        list.innerHTML = '';
        atts.forEach(a => {
            const row = document.createElement('div');
            row.className = 'attach-row';
            row.innerHTML = `<span class="attach-ic">📎</span><a class="attach-name" href="#">${esc(a.name)}</a><span class="attach-size">${fmtSize(a.size)}</span><button class="btn-ic danger attach-del" title="Eliminar"><svg viewBox="0 0 14 14" fill="none" style="width:11px;height:11px"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>`;
            row.querySelector('.attach-name').addEventListener('click', async e => {
                e.preventDefault();
                try { window.open(await window.OrbitCloud.attachmentUrl(a.path), '_blank'); }
                catch (_) { toast_('No se pudo abrir el archivo'); }
            });
            row.querySelector('.attach-del').addEventListener('click', async () => {
                if (!confirm('¿Eliminar archivo?')) return;
                try { await window.OrbitCloud.deleteAttachment(a); renderAttachments(); toast_('Archivo eliminado'); }
                catch (_) { toast_('Error al eliminar'); }
            });
            list.appendChild(row);
        });
    } catch (_) {
        list.innerHTML = '<div class="attach-hint" style="color:var(--err)">No se pudieron cargar los adjuntos (¿ejecutaste schema-collab.sql?).</div>';
    }
}

const _openTaskModalV8 = openTaskModal;
openTaskModal = function (id) {
    _openTaskModalV8(id);
    renderAttachments();
};

const _bindUIV8 = bindUI;
bindUI = function () {
    _bindUIV8();
    const ai = $('td-attach-input');
    if (ai) ai.addEventListener('change', async e => {
        const f = e.target.files[0];
        if (!f || !editTaskId) return;
        if (!cloudEnabled()) { toast_('Los adjuntos requieren la nube activa'); e.target.value = ''; return; }
        if (f.size > 10 * 1024 * 1024) { toast_('Máximo 10 MB por archivo'); e.target.value = ''; return; }
        toast_('Subiendo…');
        try { await window.OrbitCloud.uploadAttachment(CURRENT_USER.id, editTaskId, f); renderAttachments(); toast_('Archivo subido ✓'); }
        catch (err) { console.error(err); toast_('Error al subir el archivo'); }
        e.target.value = '';
    });
};

// ═══════════════════════════════════════════════════
//  MEJORAS v9 — Colaboración (compartir grupos) + Realtime
// ═══════════════════════════════════════════════════

// ── Marca cuándo guardamos localmente (para no pisar ediciones con un pull) ──
let _lastLocalSave = 0;
const _saveV9 = save;
save = function () { _lastLocalSave = Date.now(); _saveV9(); };

// ── REALTIME: al detectar cambios en la nube, re-sincroniza (con guardas) ──
let _realtimeCh = null;
let _rtPullTimer = null;
function setupRealtime() {
    if (!cloudEnabled() || !window.OrbitCloud.subscribeRealtime || _realtimeCh) return;
    _realtimeCh = window.OrbitCloud.subscribeRealtime(() => {
        if (!CURRENT_USER || editTaskId) return;             // no interrumpir edición
        if (Date.now() - _lastLocalSave < 2500) return;      // eco de nuestro propio cambio
        clearTimeout(_rtPullTimer);
        _rtPullTimer = setTimeout(async () => {
            try {
                const cloud = await window.OrbitCloud.pull(CURRENT_USER.id, CURRENT_USER.email);
                if (cloud) { S = ensureShape(cloud); render(); }
            } catch (_) { /* silencioso */ }
        }, 600);
    });
}

// Enganchar Realtime tras el login (onLogin se reasigna antes del bootstrap)
const _onLoginV9 = onLogin;
onLogin = async function (user) {
    await _onLoginV9(user);
    setupRealtime();
};

// ── UI: COMPARTIR GRUPO ──
let shareGid = null;

async function openShareModal(gid) {
    const g = S.groups.find(x => x.id === gid); if (!g) return;
    shareGid = gid;
    $('share-group-name').textContent = g.name;
    $('share-email').value = '';
    $('share-modal').hidden = false;
    renderShareList();
    $('share-email').focus();
}

async function renderShareList() {
    const list = $('share-list'); if (!list) return;
    list.innerHTML = '<div class="attach-hint">Cargando…</div>';
    try {
        const shares = await window.OrbitCloud.listShares(shareGid);
        if (!shares.length) { list.innerHTML = '<div class="attach-hint">Aún no has invitado a nadie.</div>'; return; }
        list.innerHTML = '';
        shares.forEach(s => {
            const row = document.createElement('div');
            row.className = 'attach-row';
            row.innerHTML = `<span class="attach-name" style="color:var(--txt)">${esc(s.member_email)}</span><span class="attach-size">${s.role === 'editor' ? 'Editor' : 'Lector'}</span><button class="btn-ic danger" title="Quitar"><svg viewBox="0 0 14 14" fill="none" style="width:11px;height:11px"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>`;
            row.querySelector('button').addEventListener('click', async () => {
                try { await window.OrbitCloud.unshareGroup(shareGid, s.member_email); renderShareList(); toast_('Invitación retirada'); }
                catch (_) { toast_('Error al quitar'); }
            });
            list.appendChild(row);
        });
    } catch (_) {
        list.innerHTML = '<div class="attach-hint" style="color:var(--err)">No se pudo cargar (¿ejecutaste schema-collab.sql?).</div>';
    }
}

// ── Badges de grupos compartidos + botón de compartir (post-render) ──
function enhanceSharing() {
    document.querySelectorAll('#main .group, #main .kol').forEach(el => {
        const gid = el.dataset.gid;
        const g = S.groups.find(x => x.id === gid); if (!g) return;
        if (g.shared) {
            const host = el.querySelector('.g-count, .kol-count');
            if (host && !el.querySelector('.share-badge')) {
                const b = document.createElement('span');
                b.className = 'share-badge' + (g.role === 'viewer' ? ' ro' : '');
                b.textContent = g.role === 'viewer' ? '👁 Solo lectura' : '👥 Compartido';
                host.parentNode.insertBefore(b, host.nextSibling);
            }
        } else {
            const actions = el.querySelector('.g-actions');
            if (actions && !actions.querySelector('.share-btn')) {
                const btn = document.createElement('button');
                btn.className = 'btn-ic share-btn';
                btn.title = 'Compartir grupo';
                btn.setAttribute('aria-label', 'Compartir grupo');
                btn.innerHTML = '<svg viewBox="0 0 14 14" fill="none"><circle cx="3.4" cy="7" r="1.7" stroke="currentColor" stroke-width="1.3"/><circle cx="10.6" cy="3.2" r="1.7" stroke="currentColor" stroke-width="1.3"/><circle cx="10.6" cy="10.8" r="1.7" stroke="currentColor" stroke-width="1.3"/><path d="M4.9 6.2l4.2-2.2M4.9 7.8l4.2 2.2" stroke="currentColor" stroke-width="1.3"/></svg>';
                btn.addEventListener('click', e => { e.stopPropagation(); openShareModal(gid); });
                actions.insertBefore(btn, actions.firstChild);
            }
        }
    });
}

const _renderV9 = render;
render = function () {
    _renderV9();
    if (cloudEnabled()) enhanceSharing();
};

const _bindUIV9 = bindUI;
bindUI = function () {
    _bindUIV9();
    const inv = $('share-invite');
    if (inv) inv.addEventListener('click', async () => {
        const email = $('share-email').value.trim();
        if (!email || !shareGid || !CURRENT_USER) return;
        try {
            await window.OrbitCloud.shareGroup(shareGid, CURRENT_USER.id, email, $('share-role').value);
            $('share-email').value = '';
            renderShareList();
            toast_('Invitación enviada ✓');
        } catch (_) { toast_('Error al invitar (¿schema-collab.sql?)'); }
    });
    const sc = $('share-close');
    if (sc) sc.addEventListener('click', () => $('share-modal').hidden = true);
    const sm = $('share-modal');
    if (sm) sm.addEventListener('click', e => { if (e.target === sm) sm.hidden = true; });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && sm && !sm.hidden) sm.hidden = true;
    });
    $('share-email')?.addEventListener('keydown', e => { if (e.key === 'Enter') inv?.click(); });
};