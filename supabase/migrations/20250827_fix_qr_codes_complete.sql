-- Migración para ALTERAR la tabla qr_codes existente con criptografía segura
-- IMPORTANTE: Esta migración ALTERA la tabla existente, no la recrea

-- 1. Agregar columnas faltantes para criptografía
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS public_key TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Cambiar el tipo de key_id de UUID a TEXT para almacenar hash SHA256
ALTER TABLE qr_codes 
ALTER COLUMN key_id TYPE TEXT;

-- 3. Hacer code NOT NULL y UNIQUE si no lo es
ALTER TABLE qr_codes 
ALTER COLUMN code SET NOT NULL;

-- Agregar constraint UNIQUE si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'qr_codes_code_key'
    ) THEN
        ALTER TABLE qr_codes ADD CONSTRAINT qr_codes_code_key UNIQUE (code);
    END IF;
END $$;

-- 4. Crear índices para optimizar búsquedas (si no existen)
CREATE INDEX IF NOT EXISTS idx_qr_codes_order_id ON qr_codes(order_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_code ON qr_codes(code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_store_id ON qr_codes(store_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_key_id ON qr_codes(key_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_is_valid ON qr_codes(is_valid);
CREATE INDEX IF NOT EXISTS idx_qr_codes_used_at ON qr_codes(used_at);
CREATE INDEX IF NOT EXISTS idx_qr_codes_public_key ON qr_codes(public_key);

-- 5. Deshabilitar RLS temporalmente para configuración
ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;

-- 6. Otorgar permisos
GRANT ALL ON qr_codes TO authenticated;

-- 7. Eliminar políticas existentes
DROP POLICY IF EXISTS qr_codes_select_policy ON qr_codes;
DROP POLICY IF EXISTS qr_codes_update_policy ON qr_codes;
DROP POLICY IF EXISTS qr_codes_insert_policy ON qr_codes;
DROP POLICY IF EXISTS qr_codes_delete_policy ON qr_codes;

-- 8. Crear políticas de seguridad más estrictas
-- Política para seleccionar: Solo propietarios de tiendas pueden ver sus QRs
CREATE POLICY qr_codes_select_policy ON qr_codes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores s 
      WHERE s.id = qr_codes.store_id 
      AND s.owner_id = auth.uid()
    )
  );

-- Política para actualizar: Solo propietarios de tiendas pueden actualizar sus QRs
CREATE POLICY qr_codes_update_policy ON qr_codes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores s 
      WHERE s.id = qr_codes.store_id 
      AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores s 
      WHERE s.id = qr_codes.store_id 
      AND s.owner_id = auth.uid()
    )
  );

-- Política para insertar: Cualquier usuario autenticado puede crear QRs
CREATE POLICY qr_codes_insert_policy ON qr_codes
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Política para eliminar: Solo propietarios de tiendas pueden eliminar sus QRs
CREATE POLICY qr_codes_delete_policy ON qr_codes
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores s 
      WHERE s.id = qr_codes.store_id 
      AND s.owner_id = auth.uid()
    )
  );

-- 9. Re-habilitar RLS
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- 10. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON qr_codes;
CREATE TRIGGER update_qr_codes_updated_at
    BEFORE UPDATE ON qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 12. Actualizar registros existentes para tener valores por defecto
UPDATE qr_codes 
SET updated_at = COALESCE(updated_at, created_at)
WHERE updated_at IS NULL;

-- 13. Verificar que la estructura esté correcta
DO $$
BEGIN
    RAISE NOTICE 'Migración completada. Verificando estructura...';
    
    -- Verificar columnas existentes
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' 
        AND column_name = 'public_key'
    ) THEN
        RAISE NOTICE '✅ Columna public_key agregada correctamente';
    ELSE
        RAISE NOTICE '❌ Error: Columna public_key no se pudo agregar';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' 
        AND column_name = 'updated_at'
    ) THEN
        RAISE NOTICE '✅ Columna updated_at agregada correctamente';
    ELSE
        RAISE NOTICE '❌ Error: Columna updated_at no se pudo agregar';
    END IF;
    
    RAISE NOTICE 'Migración finalizada.';
END $$;
