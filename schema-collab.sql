-- ============================================================
--  ORBIT — Migración v2: hora/recurrencia · colaboración · adjuntos
--  Ejecuta este archivo en Supabase → SQL Editor → New query
--  DESPUÉS de haber corrido schema.sql.
--
--  ⚠️ IMPORTANTE (léelo):
--  • Los bloques 1 y 3 son seguros y ya están cableados en el cliente
--    (hora y recurrencia se sincronizan; los adjuntos suben a Storage).
--  • El bloque 2 (colaboración) crea la infraestructura y políticas de
--    LECTURA de tableros compartidos. La ESCRITURA colaborativa completa
--    requiere adaptar el motor de sync (pull/push por grupo en vez de por
--    usuario). Se deja como base lista para ese paso. No rompe nada.
-- ============================================================


-- ============================================================
--  1) HORA Y RECURRENCIA (para bases de datos ya existentes)
--     En instalaciones nuevas ya vienen en schema.sql.
-- ============================================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_time   TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'none';

-- Restringir valores válidos de recurrence (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_recurrence_chk') THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_recurrence_chk
      CHECK (recurrence IN ('none','daily','weekly','monthly'));
  END IF;
END $$;


-- ============================================================
--  2) COLABORACIÓN — compartir grupos con otros usuarios
-- ============================================================

-- Miembros invitados a un grupo. Se invita por email; cuando esa persona
-- inicia sesión con ese email, member_id se enlaza a su cuenta.
CREATE TABLE IF NOT EXISTS group_shares (
  group_id     TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_email TEXT NOT NULL,
  member_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer','editor')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, member_email)
);

CREATE INDEX IF NOT EXISTS idx_shares_member ON group_shares(member_id);
CREATE INDEX IF NOT EXISTS idx_shares_email  ON group_shares(lower(member_email));

ALTER TABLE group_shares ENABLE ROW LEVEL SECURITY;

-- El dueño gestiona a quién invita; el miembro puede ver sus propias filas.
DROP POLICY IF EXISTS shares_owner ON group_shares;
CREATE POLICY shares_owner ON group_shares FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS shares_member_read ON group_shares;
CREATE POLICY shares_member_read ON group_shares FOR SELECT
  USING (auth.uid() = member_id OR lower(member_email) = lower(auth.jwt() ->> 'email'));

-- Funciones de apoyo (SECURITY DEFINER = corren como dueño y saltan RLS,
-- evitando recursión de políticas).
--   is_group_member: ¿el usuario actual está invitado al grupo (viewer o editor)?
--   can_edit_group:  ¿es dueño del grupo O miembro con rol 'editor'?
CREATE OR REPLACE FUNCTION is_group_member(gid TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_shares s
    WHERE s.group_id = gid
      AND (s.member_id = auth.uid()
           OR lower(s.member_email) = lower(auth.jwt() ->> 'email'))
  );
$$;

CREATE OR REPLACE FUNCTION can_edit_group(gid TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    EXISTS (SELECT 1 FROM groups g WHERE g.id = gid AND g.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM group_shares s
      WHERE s.group_id = gid AND s.role = 'editor'
        AND (s.member_id = auth.uid()
             OR lower(s.member_email) = lower(auth.jwt() ->> 'email'))
    );
$$;

-- ── GRUPOS ──
-- El dueño gestiona la fila del grupo (renombrar, color, borrar, compartir);
-- los miembros solo pueden LEERLA. (own_groups FOR ALL ya existe en schema.sql.)
DROP POLICY IF EXISTS read_shared_groups ON groups;
CREATE POLICY read_shared_groups ON groups FOR SELECT
  USING (auth.uid() = user_id OR is_group_member(id));

-- ── TAREAS ── autorización basada en el GRUPO, no en el user_id.
-- Reemplaza la política de solo-dueño por: leer si eres miembro; escribir si
-- eres dueño o editor del grupo.
DROP POLICY IF EXISTS own_tasks   ON tasks;
DROP POLICY IF EXISTS read_tasks  ON tasks;
DROP POLICY IF EXISTS write_tasks ON tasks;
CREATE POLICY read_tasks  ON tasks FOR SELECT
  USING (auth.uid() = user_id OR is_group_member(group_id));
CREATE POLICY write_tasks ON tasks FOR ALL
  USING (can_edit_group(group_id)) WITH CHECK (can_edit_group(group_id));

-- ── TABLAS HIJAS ── mismo criterio, a través de la tarea → grupo.
-- Patrón por tabla: <t>_read (miembros leen) + <t>_write (editores/dueño escriben).
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['subtasks','task_tags','comments','relations','custom_field_values','history']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS own_%1$s ON %1$s;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %1$s_read ON %1$s;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %1$s_write ON %1$s;', tbl);
    EXECUTE format($f$
      CREATE POLICY %1$s_read ON %1$s FOR SELECT USING (
        EXISTS (SELECT 1 FROM tasks t WHERE t.id = %1$s.task_id
                AND (t.user_id = auth.uid() OR is_group_member(t.group_id))));
    $f$, tbl);
    EXECUTE format($f$
      CREATE POLICY %1$s_write ON %1$s FOR ALL
      USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = %1$s.task_id AND can_edit_group(t.group_id)))
      WITH CHECK (EXISTS (SELECT 1 FROM tasks t WHERE t.id = %1$s.task_id AND can_edit_group(t.group_id)));
    $f$, tbl);
  END LOOP;
END $$;


-- ============================================================
--  3) ADJUNTOS — archivos por tarea (Supabase Storage)
-- ============================================================

-- Metadatos del archivo (el binario vive en el bucket 'attachments').
CREATE TABLE IF NOT EXISTS attachments (
  id         TEXT PRIMARY KEY,
  task_id    TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  path       TEXT NOT NULL,          -- ruta dentro del bucket: <user_id>/<task_id>/<file>
  size       BIGINT,
  mime       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachments_task ON attachments(task_id);
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS own_attachments ON attachments;
CREATE POLICY own_attachments ON attachments FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Bucket privado para los binarios.
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Cada usuario solo accede a su carpeta (primer segmento de la ruta = su uid).
DROP POLICY IF EXISTS attach_read   ON storage.objects;
CREATE POLICY attach_read   ON storage.objects FOR SELECT
  USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS attach_write  ON storage.objects;
CREATE POLICY attach_write  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS attach_delete ON storage.objects;
CREATE POLICY attach_delete ON storage.objects FOR DELETE
  USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
--  Fin. Verifica en Table Editor que aparezcan group_shares y
--  attachments con el candado 🔒 (RLS activo), y en Storage el
--  bucket 'attachments'.
-- ============================================================
