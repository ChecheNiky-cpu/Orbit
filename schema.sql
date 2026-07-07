-- =============================================
--  ORBIT — Esquema SQL para Supabase (normalizado)
--  Ejecuta este archivo en: SQL Editor → New query
--
--  NOTA: los IDs son TEXT porque el cliente los genera
--  (uid() → "_ab12cd"). user_id sí es UUID (auth.users).
--  Los campos "order" y "ts" son BIGINT (usan Date.now()).
-- =============================================

-- ── GRUPOS ──
CREATE TABLE IF NOT EXISTS groups (
  id         TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#1a6cff',
  collapsed  BOOLEAN DEFAULT false,
  "order"    BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── TAREAS ──
CREATE TABLE IF NOT EXISTS tasks (
  id         TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id   TEXT REFERENCES groups(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  done       BOOLEAN DEFAULT false,
  priority   TEXT DEFAULT 'none' CHECK (priority IN ('none','low','medium','high')),
  notes      TEXT DEFAULT '',
  due        DATE,
  due_time   TEXT,                                   -- 'HH:MM' opcional
  recurrence TEXT DEFAULT 'none'
             CHECK (recurrence IN ('none','daily','weekly','monthly')),
  "order"    BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── SUBTAREAS ──
CREATE TABLE IF NOT EXISTS subtasks (
  id      TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  text    TEXT NOT NULL,
  done    BOOLEAN DEFAULT false
);

-- ── TAGS ──
CREATE TABLE IF NOT EXISTS task_tags (
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  tag     TEXT NOT NULL,
  PRIMARY KEY (task_id, tag)
);

-- ── COMENTARIOS ──
CREATE TABLE IF NOT EXISTS comments (
  id         TEXT PRIMARY KEY,
  task_id    TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  text       TEXT NOT NULL,
  ts         BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── RELACIONES ENTRE TAREAS ──
CREATE TABLE IF NOT EXISTS relations (
  task_id   TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  target_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  type      TEXT NOT NULL CHECK (type IN ('depende-de', 'bloquea')),
  PRIMARY KEY (task_id, target_id)
);

-- ── CAMPOS PERSONALIZADOS (definición a nivel usuario) ──
CREATE TABLE IF NOT EXISTS custom_field_defs (
  id      TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name    TEXT NOT NULL,
  type    TEXT NOT NULL CHECK (type IN ('texto','número','URL','persona','checkbox'))
);

-- ── VALORES DE CAMPOS PERSONALIZADOS (por tarea) ──
CREATE TABLE IF NOT EXISTS custom_field_values (
  field_id TEXT REFERENCES custom_field_defs(id) ON DELETE CASCADE,
  task_id  TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  value    TEXT,
  PRIMARY KEY (field_id, task_id)
);

-- ── HISTORIAL DE CAMBIOS ──
CREATE TABLE IF NOT EXISTS history (
  id      TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  msg     TEXT NOT NULL,
  ts      BIGINT
);

-- =============================================
--  ROW LEVEL SECURITY (RLS)
--  CRÍTICO: cada usuario solo accede a sus propios datos.
--  USING controla lectura/actualización/borrado de filas existentes;
--  WITH CHECK controla las filas que se insertan/actualizan.
-- =============================================

ALTER TABLE groups              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags           ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE relations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_defs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE history             ENABLE ROW LEVEL SECURITY;

-- ── Tablas con user_id directo ──
DROP POLICY IF EXISTS own_groups ON groups;
CREATE POLICY own_groups ON groups
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS own_tasks ON tasks;
CREATE POLICY own_tasks ON tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS own_cf_defs ON custom_field_defs;
CREATE POLICY own_cf_defs ON custom_field_defs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Tablas hijas: se valida a través de la tarea propietaria ──
DROP POLICY IF EXISTS own_subtasks ON subtasks;
CREATE POLICY own_subtasks ON subtasks FOR ALL
  USING      (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));

DROP POLICY IF EXISTS own_task_tags ON task_tags;
CREATE POLICY own_task_tags ON task_tags FOR ALL
  USING      (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()));

DROP POLICY IF EXISTS own_comments ON comments;
CREATE POLICY own_comments ON comments FOR ALL
  USING      (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = comments.task_id AND tasks.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = comments.task_id AND tasks.user_id = auth.uid()));

DROP POLICY IF EXISTS own_relations ON relations;
CREATE POLICY own_relations ON relations FOR ALL
  USING      (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = relations.task_id AND tasks.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = relations.task_id AND tasks.user_id = auth.uid()));

DROP POLICY IF EXISTS own_cf_values ON custom_field_values;
CREATE POLICY own_cf_values ON custom_field_values FOR ALL
  USING      (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = custom_field_values.task_id AND tasks.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = custom_field_values.task_id AND tasks.user_id = auth.uid()));

DROP POLICY IF EXISTS own_history ON history;
CREATE POLICY own_history ON history FOR ALL
  USING      (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = history.task_id AND tasks.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = history.task_id AND tasks.user_id = auth.uid()));

-- =============================================
--  ÍNDICES para mejor rendimiento
-- =============================================
CREATE INDEX IF NOT EXISTS idx_tasks_user_id    ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_group_id   ON tasks(group_id);
CREATE INDEX IF NOT EXISTS idx_groups_user_id   ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_task   ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_relations_task   ON relations(task_id);
CREATE INDEX IF NOT EXISTS idx_cf_values_task   ON custom_field_values(task_id);
CREATE INDEX IF NOT EXISTS idx_history_task_id  ON history(task_id);
CREATE INDEX IF NOT EXISTS idx_cf_defs_user     ON custom_field_defs(user_id);
