// Tests de funciones puras de ORBIT (app.js) con el runner nativo de Node.
//   Ejecutar:  node --test
// No hay dependencias: cargamos app.js en un contexto aislado con stubs de DOM
// y accedemos a sus funciones globales (declaraciones de función).

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadApp() {
    const noop = () => {};
    function makeEl() {
        return new Proxy({
            style: {}, dataset: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
            addEventListener: noop, removeEventListener: noop,
            querySelector: () => makeEl(), querySelectorAll: () => [],
            appendChild: noop, insertBefore: noop, remove: noop, focus: noop, setAttribute: noop,
            innerHTML: '', textContent: '', value: '', hidden: true,
        }, { get(t, p) { return p in t ? t[p] : noop; }, set(t, p, v) { t[p] = v; return true; } });
    }
    const document = {
        getElementById: () => makeEl(), querySelector: () => makeEl(), querySelectorAll: () => [],
        createElement: () => makeEl(), addEventListener: noop, body: makeEl(), activeElement: { tagName: 'BODY' },
    };
    const localStorage = (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => m[k] = String(v), removeItem: k => delete m[k] }; })();
    const ctx = {
        document, localStorage, console,
        Notification: function () {}, setTimeout: noop, setInterval: noop, clearTimeout: noop,
        navigator: {}, URL: { createObjectURL: () => '', revokeObjectURL: noop },
        Blob: function () {}, FileReader: function () { this.readAsText = noop; }, alert: noop, confirm: () => true, prompt: () => null,
        Date, Math, JSON, Object, Array, String, Number, RegExp, Set, Boolean, isNaN, parseInt, parseFloat,
    };
    ctx.addEventListener = noop; ctx.removeEventListener = noop; ctx.window = ctx; ctx.globalThis = ctx;
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8'), ctx, { filename: 'app.js' });
    return ctx;
}

const app = loadApp();

test('esc() escapa HTML peligroso', () => {
    assert.strictEqual(app.esc('<b>&"'), '&lt;b&gt;&amp;&quot;');
    assert.strictEqual(app.esc('hola'), 'hola');
});

test('safeColor() solo acepta hex válidos (anti-inyección)', () => {
    assert.strictEqual(app.safeColor('#1a6cff'), '#1a6cff');
    assert.strictEqual(app.safeColor('#abc'), '#abc');
    assert.strictEqual(app.safeColor('red; background:url(x)'), '#1a6cff'); // se descarta → color por defecto
    assert.strictEqual(app.safeColor(null), '#1a6cff');
});

test('nextRecurDate() avanza día/semana/mes', () => {
    assert.strictEqual(app.nextRecurDate('2026-01-15', 'daily'), '2026-01-16');
    assert.strictEqual(app.nextRecurDate('2026-01-15', 'weekly'), '2026-01-22');
    assert.strictEqual(app.nextRecurDate('2026-01-15', 'monthly'), '2026-02-15');
});

test('parseMarkdown() convierte marcas básicas', () => {
    assert.match(app.parseMarkdown('**negrita**'), /<strong>negrita<\/strong>/);
    assert.match(app.parseMarkdown('*cursiva*'), /<em>cursiva<\/em>/);
    assert.match(app.parseMarkdown('`code`'), /<code>code<\/code>/);
    assert.strictEqual(app.parseMarkdown(''), '');
});

test('tagColor() es determinista y del set de colores', () => {
    assert.strictEqual(app.tagColor('frontend'), app.tagColor('frontend'));
    assert.match(app.tagColor('frontend'), /^#[0-9a-f]{6}$/i);
});

test('fmtDate() maneja vacío y fecha válida', () => {
    assert.strictEqual(app.fmtDate(''), '');
    assert.match(app.fmtDate('2026-01-15'), /15/);
});
