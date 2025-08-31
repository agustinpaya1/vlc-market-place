-- DIAGNÓSTICO KEYS - PARTE 1: EXISTENCIA Y RLS
-- IMPORTANTE: Ejecutar en Supabase Dashboard

-- ========================================
-- PASO 1: VERIFICAR EXISTENCIA DE TABLA
-- ========================================

SELECT 
    'EXISTENCIA TABLA KEYS' as seccion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'keys') THEN '✅ TABLA KEYS EXISTE'
        ELSE '❌ TABLA KEYS NO EXISTE'
    END as estado_tabla_keys;

-- ========================================
-- PASO 2: VERIFICAR RLS
-- ========================================

SELECT 
    'RLS EN KEYS' as seccion,
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS HABILITADO'
        ELSE '❌ RLS DESHABILITADO'
    END as estado_rls
FROM pg_tables 
WHERE tablename = 'keys';

-- ========================================
-- PASO 3: VERIFICAR USUARIO
-- ========================================

SELECT 
    'USUARIO ACTUAL' as seccion,
    current_user,
    session_user,
    auth.uid() as auth_uid,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ USUARIO AUTENTICADO'
        ELSE '❌ USUARIO NO AUTENTICADO'
    END as estado_autenticacion;

