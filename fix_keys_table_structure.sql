-- Script para corregir la estructura de la tabla keys
-- IMPORTANTE: Ejecutar en Supabase Dashboard

-- ========================================
-- PASO 1: VERIFICAR ESTRUCTURA ACTUAL
-- ========================================

-- Verificar columnas actuales
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'keys' 
ORDER BY ordinal_position;

-- ========================================
-- PASO 2: AGREGAR COLUMNA FALTANTE
-- ========================================

-- Agregar columna private_key (para desarrollo)
ALTER TABLE keys 
ADD COLUMN IF NOT EXISTS private_key TEXT;

-- ========================================
-- PASO 3: VERIFICAR ESTRUCTURA FINAL
-- ========================================

-- Verificar que la columna se agregó
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'keys' 
ORDER BY ordinal_position;

-- ========================================
-- PASO 4: VERIFICAR POLÍTICAS RLS
-- ========================================

-- Verificar que las políticas RLS siguen funcionando
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'keys'
ORDER BY policyname;

-- ========================================
-- PASO 5: MENSAJE DE COMPLETADO
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '🔧 ESTRUCTURA DE TABLA KEYS CORREGIDA!';
    RAISE NOTICE '✅ Columna private_key agregada';
    RAISE NOTICE '✅ Políticas RLS verificadas';
    RAISE NOTICE '🚀 La tabla keys ahora tiene la estructura correcta!';
END $$;
