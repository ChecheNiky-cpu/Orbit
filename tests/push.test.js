// Test de reconciliación del motor de sync por grupo (supabase.js → push).
//   node --test
// Carga supabase.js con un cliente Supabase SIMULADO que registra las
// operaciones, y verifica que el borrado nunca toca grupos ajenos y que se
// preserva la propiedad del creador.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadCloud() {
    const ops = [];
    function builder(table) {
        const op = { table, actions: [] };
        const b = {
            upsert(rows) { op.type = 'upsert'; op.rows = rows; ops.push(op); return b; },
            insert(rows) { op.type = 'insert'; op.rows = rows; ops.push(op); return b; },
            delete() { op.type = 'delete'; ops.push(op); return b; },
            select() { return { eq() { return this; }, order() { return this; }, then(r) { r({ data: [], error: null }); } }; },
            eq(c, v) { op.actions.push(['eq', c, v]); return b; },
            in(c, v) { op.actions.push(['in', c, v]); return b; },
            not(c, o, v) { op.actions.push(['not', c, o, v]); return b; },
            then(res) { res({ error: null }); },
        };
        return b;
    }
    const sb = { from: builder, channel: () => ({ on() { return this; }, subscribe() { return this; } }), storage: { from: () => ({}) }, auth: {} };
    const ctx = {
        window: { ORBIT_CONFIG: { SUPABASE_URL: 'https://real.supabase.co', SUPABASE_ANON_KEY: 'eyJreal' }, supabase: { createClient: () => sb } },
        console, Promise, Object, Array, String, Number, Math, JSON, Set, Boolean,
    };
    ctx.globalThis = ctx;
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'supabase.js'), 'utf8'), ctx, { filename: 'supabase.js' });
    return { cloud: ctx.window.OrbitCloud, ops };
}

const state = () => ({
    groups: [
        { id: 'G1', name: 'Propio', color: '#1a6cff', shared: false },
        { id: 'G2', name: 'Editor', color: '#2cb67d', shared: true, role: 'editor', ownerUid: 'other' },
        { id: 'G3', name: 'Viewer', color: '#ffa94d', shared: true, role: 'viewer', ownerUid: 'other' },
    ],
    tasks: [
        { id: 'T1', groupId: 'G1', text: 'a' },
        { id: 'T2', groupId: 'G2', text: 'b', ownerUid: 'other' },
        { id: 'T3', groupId: 'G3', text: 'c', ownerUid: 'other' },
    ],
    customFieldDefs: [],
});

test('push solo upserta grupos propios y tareas editables', async () => {
    const { cloud, ops } = loadCloud();
    await cloud.push('me', state());
    const gUp = ops.find(o => o.table === 'groups' && o.type === 'upsert');
    const tUp = ops.find(o => o.table === 'tasks' && o.type === 'upsert');
    assert.deepStrictEqual(gUp.rows.map(r => r.id), ['G1']);
    assert.deepStrictEqual(tUp.rows.map(r => r.id).sort(), ['T1', 'T2']);
});

test('push preserva la propiedad del creador', async () => {
    const { cloud, ops } = loadCloud();
    await cloud.push('me', state());
    const tUp = ops.find(o => o.table === 'tasks' && o.type === 'upsert');
    assert.strictEqual(tUp.rows.find(r => r.id === 'T2').user_id, 'other');
    assert.strictEqual(tUp.rows.find(r => r.id === 'T1').user_id, 'me');
});

test('push NUNCA toca el grupo/tarea de solo lectura ajenos', async () => {
    const { cloud, ops } = loadCloud();
    await cloud.push('me', state());
    const delGids = ops.filter(o => o.table === 'tasks' && o.type === 'delete')
        .map(o => (o.actions.find(a => a[0] === 'eq' && a[1] === 'group_id') || [])[2]).filter(Boolean).sort();
    assert.deepStrictEqual(delGids, ['G1', 'G2']);
    const dump = JSON.stringify(ops);
    assert.ok(!dump.includes('G3'), 'no debe mencionar G3');
    assert.ok(!dump.includes('"T3"'), 'no debe mencionar T3');
});
