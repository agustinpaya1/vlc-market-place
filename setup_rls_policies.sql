-- Script para configurar RLS policies para keys_public y qr_codes
-- IMPORTANTE: Ejecutar en Supabase Dashboard

-- 1. Habilitar RLS en keys_public si no está habilitado
ALTER TABLE keys_public ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes en keys_public
DROP POLICY IF EXISTS "keys_public_select_policy" ON keys_public;
DROP POLICY IF EXISTS "keys_public_insert_policy" ON keys_public;
DROP POLICY IF EXISTS "keys_public_update_policy" ON keys_public;
DROP POLICY IF EXISTS "keys_public_delete_policy" ON keys_public;

-- 3. Crear políticas para keys_public
-- SELECT: Solo propietarios de tienda pueden ver sus claves públicas
CREATE POLICY "keys_public_select_policy" ON keys_public
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- INSERT: Solo propietarios de tienda pueden crear claves
CREATE POLICY "keys_public_insert_policy" ON keys_public
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- UPDATE: Solo propietarios de tienda pueden actualizar sus claves
CREATE POLICY "keys_public_update_policy" ON keys_public
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- DELETE: Solo propietarios de tienda pueden eliminar sus claves
CREATE POLICY "keys_public_delete_policy" ON keys_public
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- 4. Habilitar RLS en qr_codes si no está habilitado
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- 5. Eliminar políticas existentes en qr_codes
DROP POLICY IF EXISTS "qr_codes_select_policy" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_insert_policy" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_update_policy" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_delete_policy" ON qr_codes;

-- 6. Crear políticas para qr_codes
-- SELECT: Solo propietarios de tienda pueden ver sus QRs
CREATE POLICY "qr_codes_select_policy" ON qr_codes
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- INSERT: Solo propietarios de tienda pueden crear QRs
CREATE POLICY "qr_codes_insert_policy" ON qr_codes
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- UPDATE: Solo propietarios de tienda pueden actualizar sus QRs
CREATE POLICY "qr_codes_update_policy" ON qr_codes
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- DELETE: Solo propietarios de tienda pueden eliminar sus QRs
CREATE POLICY "qr_codes_delete_policy" ON qr_codes
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- 7. Verificar políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('keys_public', 'qr_codes')
ORDER BY tablename, policyname;
