# 🛰️ ORBIT — Task Manager

Gestor de tareas **100% front-end** (HTML + CSS + JavaScript, sin frameworks) con
sincronización opcional en la nube. Rápido, minimalista y con tema oscuro/claro.

> Proyecto de **Front-End** · Universidad — 2.º año, 1.er semestre.

---

## ✨ Características

| Área | Detalle |
|------|---------|
| **4 vistas + Panel** | Hoy · Lista · Kanban · Calendario · **Panel de productividad** (gráficos) |
| **Tareas ricas** | Prioridades, etiquetas, fecha **y hora** límite, notas en Markdown, subtareas, comentarios, relaciones, campos personalizados e historial |
| **Recurrencia** | Tareas que se repiten cada día / semana / mes |
| **Recordatorios** | Notificaciones del navegador para tareas vencidas o que vencen hoy |
| **Productividad** | Racha de días, % de avance, completadas por día, distribución por prioridad y por grupo |
| **Grupos a tu gusto** | Color de fondo por grupo (paleta o color personalizado) y reordenar arrastrando la cabecera |
| **Acciones en lote** | Selección múltiple + completar / mover / eliminar; navegación con teclado |
| **Deshacer** | Papelera con **Ctrl+Z** y botón "Deshacer" en las notificaciones |
| **Nube (opcional)** | Supabase + login con Google; datos por usuario protegidos con RLS |
| **Offline-first / PWA** | Funciona sin conexión (Service Worker) e instalable |
| **Sincronización** | Entre dispositivos (nube) y entre **pestañas** del navegador |
| **Extras** | Búsqueda, paleta de comandos (Ctrl+K), templates, export/import JSON, tema claro/oscuro |

---

## 🚀 Cómo ejecutarlo en local

El login y el Service Worker **no funcionan** abriendo el archivo directamente
(`file://`). Sírvelo por HTTP desde esta carpeta:

```bash
npx serve
# o, con Python:
python -m http.server 3000
```

Abre la URL indicada (p. ej. `http://localhost:3000`) y entra por **`inicio.html`**
(la landing) o directamente por **`index.html`** (la app).

> Sin configurar Supabase, la app funciona en **modo local** (solo este dispositivo).
> Para activar la nube y el login con Google, sigue `README-PRIVADO.md`.

---

## 🤝 Colaboración (compartir grupos)

1. Ejecuta **`schema-collab.sql`** en Supabase → SQL Editor (después de `schema.sql`).
   Crea las tablas `group_shares` / `attachments`, el bucket de adjuntos y las
   políticas RLS **por grupo** (dueño / editor / lector).
2. (Opcional, para tiempo real) En Supabase → **Database → Replication**, activa
   la publicación `supabase_realtime` para las tablas `tasks` y `groups`.
3. En la app, pasa el ratón por la cabecera de un grupo tuyo → botón **compartir**
   → invita por email y elige rol:
   - **Editor**: puede crear, editar y completar tareas del grupo.
   - **Lector**: solo puede verlas.
4. Cuando esa persona inicie sesión con ese email, verá el grupo con una insignia
   *Compartido* / *Solo lectura*.

**Modelo de permisos:** la autorización es **por grupo** (RLS con
`can_edit_group`). El motor de sync solo escribe/borra dentro de grupos que puedes
editar — **nunca toca datos de grupos ajenos** (verificado en `tests/push.test.js`).

> ⚠️ **Concurrencia:** dentro de un mismo grupo compartido la estrategia es
> *last-write-wins*. Realtime reduce la ventana de conflicto sincronizando en vivo,
> pero dos personas editando la misma tarea a la vez pueden pisarse. Para colaboración
> intensiva haría falta control por-campo/CRDT (fuera del alcance actual).

## 🧪 Tests

Pruebas de las funciones puras con el runner integrado de Node (sin dependencias):

```bash
node --test
```

---

## 📁 Estructura

```
inicio.html   → landing (pantalla de inicio)
index.html    → la app
style.css     → estilos
app.js        → lógica (estado, vistas, panel, recordatorios, sync…)
auth.js       → login con Google (Supabase)
supabase.js   → cliente + motor de sincronización
config.js     → 🔑 claves de Supabase (privado)
schema.sql    → esquema de la base de datos (ejecutar en Supabase)
sw.js         → Service Worker (PWA/offline)
manifest.json → metadatos PWA
tests/        → pruebas de funciones puras
icons/        → iconos de la app
```

---

## ⌨️ Atajos de teclado

`Ctrl+K` paleta · `1/2/3` vistas · `/` buscar · `N` nuevo grupo · `T` tema ·
`?` ayuda · `Ctrl+Z` deshacer · **↑/↓** navegar tareas · **Espacio** completar ·
**Enter** abrir · **X** seleccionar.

---

## 🔒 Seguridad

Row Level Security (RLS) activo en todas las tablas: cada usuario solo ve sus datos.
La *anon key* del frontend es pública por diseño; la `service_role` **nunca** se expone.
