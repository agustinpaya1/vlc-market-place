-- Script COMPLETO para implementar la nueva arquitectura de QR codes
-- IMPORTANTE: Ejecutar en Supabase Dashboard en este orden

-- ========================================
-- PASO 1: LIMPIAR POLÍTICAS EXISTENTES
-- ========================================

-- Eliminar todas las políticas existentes en qr_codes
DROP POLICY IF EXISTS "Staff can validate QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Users can view their own QR codes" ON qr_codes;
DROP POLICY IF EXISTS "qr_code_access" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_delete_policy" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_insert_auth" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_insert_own" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_insert_policy" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_select_auth" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_select_own" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_select_policy" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_update_auth" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_update_own" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_update_policy" ON qr_codes;

-- ========================================
-- PASO 2: CONECTAR qr_codes CON keys_public
-- ========================================

-- Agregar columna key_id para conectar con keys_public
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS key_id UUID REFERENCES keys_public(id);

-- ========================================
-- PASO 3: OPTIMIZAR ESTRUCTURA DE qr_codes
-- ========================================

-- Asegurar que las columnas críticas existen
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS public_key TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Hacer code NOT NULL y UNIQUE
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
        RAISE NOTICE '✅ Constraint UNIQUE agregado a code';
    ELSE
        RAISE NOTICE 'Constraint UNIQUE ya existe en code';
    END IF;
END $$;

-- ========================================
-- PASO 4: CREAR ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para conectar con keys_public
CREATE INDEX IF NOT EXISTS idx_qr_codes_key_id ON qr_codes(key_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_store_key ON qr_codes(store_id, key_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_order_key ON qr_codes(order_id, key_id);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_qr_codes_public_key ON qr_codes(public_key);
CREATE INDEX IF NOT EXISTS idx_qr_codes_updated_at ON qr_codes(updated_at);
CREATE INDEX IF NOT EXISTS idx_qr_codes_is_valid ON qr_codes(is_valid);
CREATE INDEX IF NOT EXISTS idx_qr_codes_used_at ON qr_codes(used_at);
CREATE INDEX IF NOT EXISTS idx_qr_codes_validation_attempts ON qr_codes(validation_attempts);

-- ========================================
-- PASO 5: CONFIGURAR RLS POLICIES LIMPIAS
-- ========================================

-- Habilitar RLS en keys_public
ALTER TABLE keys_public ENABLE ROW LEVEL SECURITY;

-- Políticas para keys_public
CREATE POLICY "keys_public_select_policy" ON keys_public
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "keys_public_insert_policy" ON keys_public
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "keys_public_update_policy" ON keys_public
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "keys_public_delete_policy" ON keys_public
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Habilitar RLS en qr_codes
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Políticas para qr_codes (LIMPIAS Y SIMPLES)
CREATE POLICY "qr_codes_select_policy" ON qr_codes
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "qr_codes_insert_policy" ON qr_codes
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "qr_codes_update_policy" ON qr_codes
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "qr_codes_delete_policy" ON qr_codes
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- ========================================
-- PASO 6: VERIFICAR ESTRUCTURA FINAL
-- ========================================

-- Verificar estructura de qr_codes
SELECT 
    'qr_codes' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
ORDER BY ordinal_position;

-- Verificar políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('keys_public', 'qr_codes')
ORDER BY tablename, policyname;

-- Verificar índices creados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'qr_codes'
ORDER BY indexname;

-- ========================================
-- PASO 7: MENSAJE DE COMPLETADO
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '🎉 ARQUITECTURA DE QR CODES COMPLETADA!';
    RAISE NOTICE '✅ Tablas conectadas: qr_codes ↔ keys_public';
    RAISE NOTICE '✅ RLS policies configuradas y limpias';
    RAISE NOTICE '✅ Índices optimizados para performance';
    RAISE NOTICE '✅ Estructura lista para el sistema criptográfico';
END $$;
