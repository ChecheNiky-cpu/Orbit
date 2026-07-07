// =============================================
//  ORBIT — Cliente Supabase + Motor de Sincronización
//  Reasembla / descompone el estado normalizado (schema.sql)
//  hacia y desde el objeto de estado anidado que usa app.js.
// =============================================

(function () {
    const cfg = window.ORBIT_CONFIG || {};
    const configured =
        cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes('TU_PROYECTO') &&
        cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes('TU_ANON');

    // Cliente global (o null si aún no está configurado)
    const sb = (configured && window.supabase)
        ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
        : null;

    window.OrbitSB = sb;

    if (!sb) {
        window.OrbitCloud = { enabled: false, pull: async () => null, push: async () => { }, subscribeRealtime: () => null };
        console.info('ℹ️ ORBIT en modo local: configura config.js para activar la nube.');
        return;
    }

    // Lanza el error de Supabase si existe
    async function chk(query) {
        const { error } = await query;
        if (error) throw error;
    }

    // Borra las filas de `table` cuyo `col` NO esté en `ids`, para este usuario
    async function delOrphans(table, col, ids, userId) {
        let query = sb.from(table).delete().eq('user_id', userId);
        if (ids.length) query = query.not(col, 'in', '(' + ids.join(',') + ')');
        await chk(query);
    }

    // ── PULL: leer todo (propio + compartido vía RLS) y reasamblar S ──
    //  Anota cada grupo con { ownerUid, shared, role } y cada tarea/comentario
    //  con ownerUid, para que el push preserve la propiedad y acote el borrado.
    async function pull(userId, email) {
        const sel = t => sb.from(t).select('*');
        const res = await Promise.all([
            sel('groups'), sel('tasks'), sel('subtasks'), sel('task_tags'),
            sel('comments'), sel('relations'), sel('custom_field_defs'),
            sel('custom_field_values'), sel('history'),
        ]);
        for (const r of res) if (r.error) throw r.error;
        const [g, t, st, tt, cm, rl, cd, cv, hi] = res.map(r => r.data || []);

        // Rol del usuario en cada grupo compartido (tabla opcional).
        const roleByGroup = {};
        try {
            const sh = await sb.from('group_shares').select('*');
            if (!sh.error) (sh.data || []).forEach(s => {
                const mine = s.member_id === userId || (email && (s.member_email || '').toLowerCase() === String(email).toLowerCase());
                if (mine) roleByGroup[s.group_id] = s.role || 'viewer';
            });
        } catch (_) { /* migración de colaboración no aplicada aún */ }

        const cfType = {};
        cd.forEach(d => { cfType[d.id] = d.type; });
        const decodeCF = (fid, val) => cfType[fid] === 'checkbox' ? val === 'true' : val;

        const tasks = t.map(row => ({
            id: row.id,
            groupId: row.group_id,
            ownerUid: row.user_id,
            text: row.text,
            done: !!row.done,
            priority: row.priority || 'none',
            notes: row.notes || '',
            due: row.due || '',
            dueTime: row.due_time || '',
            recurrence: row.recurrence || 'none',
            order: Number(row.order) || 0,
            tags: tt.filter(x => x.task_id === row.id).map(x => x.tag),
            subtasks: st.filter(x => x.task_id === row.id).map(x => ({ id: x.id, text: x.text, done: !!x.done })),
            comments: cm.filter(x => x.task_id === row.id).sort((a, b) => (a.ts || 0) - (b.ts || 0)).map(x => ({ id: x.id, text: x.text, ts: Number(x.ts), ownerUid: x.user_id })),
            relations: rl.filter(x => x.task_id === row.id).map(x => ({ type: x.type, targetId: x.target_id })),
            history: hi.filter(x => x.task_id === row.id).sort((a, b) => (b.ts || 0) - (a.ts || 0)).map(x => ({ id: x.id, msg: x.msg, ts: Number(x.ts) })),
            customFields: cv.filter(x => x.task_id === row.id).reduce((o, x) => { o[x.field_id] = decodeCF(x.field_id, x.value); return o; }, {}),
        }));

        const groups = g.map(row => {
            const shared = row.user_id !== userId;
            return {
                id: row.id, name: row.name, color: row.color,
                collapsed: !!row.collapsed, order: Number(row.order) || 0,
                ownerUid: row.user_id,
                shared,
                role: shared ? (roleByGroup[row.id] || 'viewer') : 'owner',
            };
        });

        const customFieldDefs = cd.map(row => ({ id: row.id, name: row.name, type: row.type }));
        const allTags = [...new Set(tt.map(x => x.tag))];

        return { groups, tasks, allTags, customFieldDefs };
    }

    // ── PUSH: reconciliar la BD con alcance por grupo (borrado seguro) ──
    //  Solo se ELIMINA: (a) grupos propios ausentes, (b) tareas/hijos dentro de
    //  grupos que el usuario puede editar. Nunca se toca un grupo ajeno.
    async function push(userId, S) {
        const roleOf = g => g.shared ? (g.role || 'viewer') : 'owner';
        const canEdit = g => roleOf(g) === 'owner' || roleOf(g) === 'editor';
        const groupById = {};
        S.groups.forEach(g => { groupById[g.id] = g; });
        const canEditGid = gid => { const g = groupById[gid]; return g ? canEdit(g) : true; };

        // ── GRUPOS PROPIOS (los compartidos no se reescriben: son de su dueño) ──
        const ownGroups = S.groups.filter(g => !g.shared);
        if (ownGroups.length) {
            await chk(sb.from('groups').upsert(ownGroups.map(g => ({
                id: g.id, user_id: userId, name: g.name, color: g.color,
                collapsed: !!g.collapsed, order: g.order || 0,
            }))));
        }
        await delOrphans('groups', 'id', ownGroups.map(g => g.id), userId);

        // ── TAREAS en grupos editables (propios o compartidos como 'editor') ──
        const editableGroupIds = S.groups.filter(canEdit).map(g => g.id);
        const editableTasks = S.tasks.filter(t => canEditGid(t.groupId));
        const editableTaskIds = editableTasks.map(t => t.id);

        if (editableTasks.length) {
            await chk(sb.from('tasks').upsert(editableTasks.map(t => ({
                id: t.id, user_id: t.ownerUid || userId, group_id: t.groupId, text: t.text,
                done: !!t.done, priority: t.priority || 'none', notes: t.notes || '',
                due: t.due || null, due_time: t.dueTime || null, recurrence: t.recurrence || 'none',
                order: t.order || 0,
            }))));
        }
        // Huérfanas: borrar SOLO dentro de cada grupo editable (jamás en grupos ajenos)
        for (const gid of editableGroupIds) {
            const keep = S.tasks.filter(t => t.groupId === gid).map(t => t.id);
            let q = sb.from('tasks').delete().eq('group_id', gid);
            if (keep.length) q = q.not('id', 'in', '(' + keep.join(',') + ')');
            await chk(q);
        }

        // ── CAMPOS PERSONALIZADOS (nivel usuario, propios) ──
        const defIds = (S.customFieldDefs || []).map(d => d.id);
        if (defIds.length) {
            await chk(sb.from('custom_field_defs').upsert(S.customFieldDefs.map(d => ({
                id: d.id, user_id: userId, name: d.name, type: d.type,
            }))));
        }
        await delOrphans('custom_field_defs', 'id', defIds, userId);

        // ── HIJOS (solo de tareas editables): reemplazo completo ──
        if (editableTaskIds.length) {
            await Promise.all([
                chk(sb.from('subtasks').delete().in('task_id', editableTaskIds)),
                chk(sb.from('task_tags').delete().in('task_id', editableTaskIds)),
                chk(sb.from('comments').delete().in('task_id', editableTaskIds)),
                chk(sb.from('relations').delete().in('task_id', editableTaskIds)),
                chk(sb.from('custom_field_values').delete().in('task_id', editableTaskIds)),
                chk(sb.from('history').delete().in('task_id', editableTaskIds)),
            ]);

            const subs = [], tgs = [], cms = [], rels = [], cfv = [], hist = [];
            editableTasks.forEach(t => {
                (t.subtasks || []).forEach(s => subs.push({ id: s.id, task_id: t.id, text: s.text, done: !!s.done }));
                (t.tags || []).forEach(tag => tgs.push({ task_id: t.id, tag }));
                (t.comments || []).forEach(c => cms.push({ id: c.id, task_id: t.id, user_id: c.ownerUid || userId, text: c.text, ts: c.ts }));
                (t.relations || []).forEach(r => rels.push({ task_id: t.id, target_id: r.targetId, type: r.type }));
                Object.entries(t.customFields || {}).forEach(([fid, val]) => cfv.push({ field_id: fid, task_id: t.id, value: String(val) }));
                (t.history || []).forEach(h => {
                    if (!h.id) h.id = t.id + '_' + h.ts + '_' + Math.random().toString(36).slice(2, 6);
                    hist.push({ id: h.id, task_id: t.id, msg: h.msg, ts: h.ts });
                });
            });

            const validCfv = cfv.filter(v => defIds.includes(v.field_id));
            if (subs.length) await chk(sb.from('subtasks').insert(subs));
            if (tgs.length) await chk(sb.from('task_tags').insert(tgs));
            if (cms.length) await chk(sb.from('comments').insert(cms));
            if (rels.length) await chk(sb.from('relations').insert(rels));
            if (validCfv.length) await chk(sb.from('custom_field_values').insert(validCfv));
            if (hist.length) await chk(sb.from('history').insert(hist));
        }
    }

    // ── REALTIME: avisar cuando cambian tasks/groups (colaboración en vivo) ──
    //  Requiere activar Replication en Supabase para esas tablas.
    function subscribeRealtime(onChange) {
        try {
            const ch = sb.channel('orbit-collab')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, onChange)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, onChange)
                .subscribe();
            return ch;
        } catch (_) { return null; }
    }

    // ── ADJUNTOS (Supabase Storage) ──
    async function uploadAttachment(userId, taskId, file) {
        const safe = file.name.replace(/[^\w.\-]+/g, '_');
        const path = `${userId}/${taskId}/${Date.now()}_${safe}`;
        const up = await sb.storage.from('attachments').upload(path, file);
        if (up.error) throw up.error;
        const meta = { id: '_att' + Math.random().toString(36).slice(2, 9), task_id: taskId, user_id: userId, name: file.name, path, size: file.size, mime: file.type };
        const ins = await sb.from('attachments').insert(meta);
        if (ins.error) throw ins.error;
        return meta;
    }
    async function listAttachments(taskId) {
        const { data, error } = await sb.from('attachments').select('*').eq('task_id', taskId).order('created_at', { ascending: true });
        if (error) throw error;
        return data || [];
    }
    async function attachmentUrl(path) {
        const { data, error } = await sb.storage.from('attachments').createSignedUrl(path, 3600);
        if (error) throw error;
        return data.signedUrl;
    }
    async function deleteAttachment(att) {
        await sb.storage.from('attachments').remove([att.path]);
        const { error } = await sb.from('attachments').delete().eq('id', att.id);
        if (error) throw error;
    }

    // ── COLABORACIÓN (compartir grupos — lectura lista; escritura: ver schema-collab.sql) ──
    async function shareGroup(groupId, ownerId, email, role = 'viewer') {
        const { error } = await sb.from('group_shares').upsert({ group_id: groupId, owner_id: ownerId, member_email: email.toLowerCase(), role });
        if (error) throw error;
    }
    async function listShares(groupId) {
        const { data, error } = await sb.from('group_shares').select('*').eq('group_id', groupId);
        if (error) throw error;
        return data || [];
    }
    async function unshareGroup(groupId, email) {
        const { error } = await sb.from('group_shares').delete().eq('group_id', groupId).eq('member_email', email.toLowerCase());
        if (error) throw error;
    }

    window.OrbitCloud = {
        enabled: true, pull, push, subscribeRealtime,
        uploadAttachment, listAttachments, attachmentUrl, deleteAttachment,
        shareGroup, listShares, unshareGroup,
    };
})();
