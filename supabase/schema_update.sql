-- Actualización de esquema para el sistema de roles y vinculación

-- 1. Tabla de códigos de acceso (generados por el agricultor)
CREATE TABLE IF NOT EXISTS codigos_acceso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agricultor_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de vinculación (técnico -> agricultor)
CREATE TABLE IF NOT EXISTS vinculos_tecnico_agricultor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tecnico_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  agricultor_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  estado TEXT CHECK (estado IN ('activo', 'revocado')) DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tecnico_id, agricultor_id)
);

-- Actualizar RLS
ALTER TABLE codigos_acceso ENABLE ROW LEVEL SECURITY;
ALTER TABLE vinculos_tecnico_agricultor ENABLE ROW LEVEL SECURITY;

-- Nota: Como el backend usa service_role, bypassa RLS. Pero por seguridad:
CREATE POLICY "Agricultor ve sus códigos" ON codigos_acceso FOR SELECT USING (auth.uid() = agricultor_id);
CREATE POLICY "Agricultor ve sus vinculaciones" ON vinculos_tecnico_agricultor FOR SELECT USING (auth.uid() = agricultor_id);
CREATE POLICY "Tecnico ve sus vinculaciones" ON vinculos_tecnico_agricultor FOR SELECT USING (auth.uid() = tecnico_id);
