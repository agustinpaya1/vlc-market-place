-- Migración completa para arreglar qr_codes
-- 1. Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id),
  code TEXT,
  payload JSONB,
  signature TEXT,
  validation_attempts INTEGER DEFAULT 0,
  is_valid BOOLEAN DEFAULT true,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_qr_codes_order_id ON qr_codes(order_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_signature ON qr_codes(signature);
CREATE INDEX IF NOT EXISTS idx_qr_codes_store_id ON qr_codes(store_id);

-- 3. Deshabilitar RLS temporalmente
ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;

-- 4. Otorgar permisos
GRANT ALL ON qr_codes TO authenticated;

-- 5. Crear políticas simples
DROP POLICY IF EXISTS qr_codes_select_policy ON qr_codes;
DROP POLICY IF EXISTS qr_codes_update_policy ON qr_codes;
DROP POLICY IF EXISTS qr_codes_insert_policy ON qr_codes;

-- Política para seleccionar
CREATE POLICY qr_codes_select_policy ON qr_codes
  FOR SELECT TO authenticated
  USING (true);

-- Política para actualizar
CREATE POLICY qr_codes_update_policy ON qr_codes
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para insertar
CREATE POLICY qr_codes_insert_policy ON qr_codes
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 6. Re-habilitar RLS
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
