-- Script de diagnóstico PROFUNDO para la tabla keys
-- IMPORTANTE: Ejecutar en Supabase Dashboard

-- ========================================
-- PASO 1: VERIFICAR ESTADO DE RLS
-- ========================================

-- Verificar si RLS está habilitado en keys
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'keys';

-- ========================================
-- PASO 2: VERIFICAR POLÍTICAS DETALLADAS
-- ========================================

-- Verificar políticas con más detalle
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'keys'
ORDER BY policyname;

-- ========================================
-- PASO 3: VERIFICAR USUARIO ACTUAL
-- ========================================

-- Verificar quién es el usuario actual
SELECT 
    current_user,
    session_user,
    auth.uid() as auth_uid;

-- ========================================
-- PASO 4: VERIFICAR TIENDAS DEL USUARIO
-- ========================================

-- Verificar que el usuario tiene tiendas
SELECT 
    id as store_id,
    name as store_name,
    owner_id,
    auth.uid() as current_user_id
FROM stores 
WHERE owner_id = auth.uid();

-- ========================================
-- PASO 5: VERIFICAR ACCESO DIRECTO
-- ========================================

-- Intentar acceso directo a keys (esto debería funcionar con las políticas)
SELECT COUNT(*) as total_keys
FROM keys 
WHERE store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
);

-- ========================================
-- PASO 6: VERIFICAR ESTRUCTURA DE TABLAS
-- ========================================

-- Verificar que las tablas tienen la estructura correcta
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'keys' 
ORDER BY ordinal_position;

-- ========================================
-- PASO 7: MENSAJE DE DIAGNÓSTICO
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '🔍 DIAGNÓSTICO PROFUNDO COMPLETADO!';
    RAISE NOTICE '✅ Verifica el estado de RLS en PASO 1';
    RAISE NOTICE '✅ Verifica las políticas en PASO 2';
    RAISE NOTICE '✅ Verifica el usuario actual en PASO 3';
    RAISE NOTICE '✅ Verifica las tiendas en PASO 4';
    RAISE NOTICE '✅ Verifica el acceso directo en PASO 5';
    RAISE NOTICE '✅ Verifica la estructura en PASO 6';
END $$;
