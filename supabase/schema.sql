-- ============================================================
-- PMP Smart — Esquema de Base de Datos para Supabase
-- Ejecutar en el SQL Editor de tu proyecto en supabase.com
-- ============================================================

-- ============================
-- 1. TABLA: perfiles
-- ============================
CREATE TABLE perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rol TEXT NOT NULL CHECK (rol IN ('agricultor', 'tecnico')),
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  notificaciones BOOLEAN DEFAULT true,
  -- Campos específicos de agricultor
  finca_principal TEXT,
  ubicacion TEXT,
  modo_offline BOOLEAN DEFAULT true,
  -- Campos específicos de técnico
  registro_profesional TEXT,
  especialidad TEXT,
  entidad TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================
-- 2. TABLA: cultivos
-- ============================
CREATE TABLE cultivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  variedad TEXT NOT NULL,
  hectareas NUMERIC(6,2) NOT NULL DEFAULT 1.0,
  ubicacion TEXT NOT NULL DEFAULT '',
  fecha_siembra TEXT NOT NULL DEFAULT '',
  estado_fitosanitario TEXT CHECK (estado_fitosanitario IN ('optimo', 'observacion', 'alerta')) DEFAULT 'optimo',
  analisis_count INTEGER DEFAULT 0,
  ultima_revision TEXT DEFAULT 'Recién registrado',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================
-- 3. TABLA: analisis
-- ============================
CREATE TABLE analisis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cultivo_id UUID REFERENCES cultivos(id) ON DELETE SET NULL,
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  cultivo_nombre TEXT NOT NULL,
  fecha TEXT NOT NULL,
  image_url TEXT,
  diagnostico TEXT CHECK (diagnostico IN ('Posible PMP', 'Sano', 'PMP Severo', 'Deficiencia Nutricional')),
  estado TEXT CHECK (estado IN ('alerta', 'sano', 'observacion')),
  severidad TEXT CHECK (severidad IN ('baja', 'moderada', 'alta', 'ninguna')),
  confianza NUMERIC(5,2),
  sintomas TEXT[] DEFAULT '{}',
  recomendaciones TEXT[] DEFAULT '{}',
  notas TEXT,
  estado_revision TEXT CHECK (estado_revision IN ('sin_solicitar', 'pendiente', 'revisado')) DEFAULT 'sin_solicitar',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================
-- 4. TABLA: revisiones_tecnicas
-- ============================
CREATE TABLE revisiones_tecnicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analisis_id UUID NOT NULL REFERENCES analisis(id) ON DELETE CASCADE,
  tecnico_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  tecnico_nombre TEXT NOT NULL,
  registro_profesional TEXT,
  fecha_revision TEXT NOT NULL,
  diagnostico_validado TEXT CHECK (diagnostico_validado IN (
    'PMP Confirmado', 'Sospecha Moderada', 'Descartado - Sano',
    'Deficiencia Nutricional', 'Virosis / Otra Afección'
  )),
  observaciones TEXT,
  tratamiento_recomendado TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE analisis ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisiones_tecnicas ENABLE ROW LEVEL SECURITY;

-- ----- PERFILES -----
CREATE POLICY "Usuarios ven su propio perfil"
  ON perfiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuarios editan su propio perfil"
  ON perfiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Insertar perfil propio"
  ON perfiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ----- CULTIVOS -----
CREATE POLICY "Dueño ve sus cultivos"
  ON cultivos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Dueño crea cultivos"
  ON cultivos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Dueño edita cultivos"
  ON cultivos FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Dueño elimina cultivos"
  ON cultivos FOR DELETE
  USING (auth.uid() = usuario_id);

-- ----- ANÁLISIS -----
CREATE POLICY "Dueño ve sus análisis"
  ON analisis FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Técnico ve análisis pendientes"
  ON analisis FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'tecnico')
    AND estado_revision = 'pendiente'
  );

CREATE POLICY "Dueño crea análisis"
  ON analisis FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Dueño actualiza sus análisis"
  ON analisis FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Técnico actualiza análisis pendientes"
  ON analisis FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'tecnico')
    AND estado_revision = 'pendiente'
  );

CREATE POLICY "Dueño elimina sus análisis"
  ON analisis FOR DELETE
  USING (auth.uid() = usuario_id);

-- ----- REVISIONES TÉCNICAS -----
CREATE POLICY "Técnico crea revisión"
  ON revisiones_tecnicas FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'tecnico')
  );

CREATE POLICY "Ver revisiones de mis análisis"
  ON revisiones_tecnicas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM analisis
      WHERE analisis.id = revisiones_tecnicas.analisis_id
      AND analisis.usuario_id = auth.uid()
    )
    OR auth.uid() = tecnico_id
  );

-- ============================================================
-- 6. STORAGE BUCKET para fotos de análisis
-- ============================================================

-- Crear bucket (ejecutar en el Dashboard > Storage o via SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('analisis-fotos', 'analisis-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Política: usuarios autenticados pueden subir fotos
CREATE POLICY "Usuarios suben sus fotos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'analisis-fotos'
    AND auth.role() = 'authenticated'
  );

-- Política: cualquiera puede leer fotos (bucket público)
CREATE POLICY "Fotos públicas para lectura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'analisis-fotos');

-- Política: usuarios eliminan sus propias fotos
CREATE POLICY "Usuarios eliminan sus fotos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'analisis-fotos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 7. FUNCIÓN: crear perfil automáticamente al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, rol, nombre, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'agricultor'),
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Nuevo Usuario'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta cuando un usuario se registra
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 8. ÍNDICES para rendimiento
-- ============================================================
CREATE INDEX idx_cultivos_usuario ON cultivos(usuario_id);
CREATE INDEX idx_analisis_usuario ON analisis(usuario_id);
CREATE INDEX idx_analisis_cultivo ON analisis(cultivo_id);
CREATE INDEX idx_analisis_estado_revision ON analisis(estado_revision);
CREATE INDEX idx_revisiones_analisis ON revisiones_tecnicas(analisis_id);
CREATE INDEX idx_revisiones_tecnico ON revisiones_tecnicas(tecnico_id);
