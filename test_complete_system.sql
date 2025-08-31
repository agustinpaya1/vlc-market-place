-- Script para probar que el sistema completo funciona
-- IMPORTANTE: Ejecutar en Supabase Dashboard DESPUÉS de ejecutar complete_qr_architecture_fixed.sql

-- ========================================
-- PASO 1: VERIFICAR ESTRUCTURA FINAL
-- ========================================

-- Verificar que qr_codes tiene todas las columnas necesarias
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
ORDER BY ordinal_position;

-- Verificar que keys tiene RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'keys';

-- Verificar que qr_codes tiene RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'qr_codes';

-- ========================================
-- PASO 2: VERIFICAR POLÍTICAS RLS
-- ========================================

-- Verificar políticas en keys
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

-- Verificar políticas en qr_codes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'qr_codes'
ORDER BY policyname;

-- ========================================
-- PASO 3: VERIFICAR ÍNDICES OPTIMIZADOS
-- ========================================

-- Verificar índices finales
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'qr_codes'
ORDER BY indexname;

-- ========================================
-- PASO 4: VERIFICAR RELACIONES
-- ========================================

-- Verificar foreign keys
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'qr_codes';

-- ========================================
-- PASO 5: MENSAJE DE VERIFICACIÓN
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '🔍 VERIFICACIÓN DEL SISTEMA COMPLETADA!';
    RAISE NOTICE '✅ Verifica que todas las columnas estén presentes';
    RAISE NOTICE '✅ Verifica que RLS esté habilitado en ambas tablas';
    RAISE NOTICE '✅ Verifica que las políticas estén creadas';
    RAISE NOTICE '✅ Verifica que los índices estén optimizados';
    RAISE NOTICE '✅ Verifica que las foreign keys estén conectadas';
    RAISE NOTICE '🚀 El sistema está listo para usar!';
END $$;
