-- Script para ver TODAS las tablas y su estado
-- IMPORTANTE: Ejecutar en Supabase Dashboard

-- ========================================
-- PASO 1: VER TODAS LAS TABLAS
-- ========================================

-- Mostrar todas las tablas del esquema public
SELECT 
    'TODAS LAS TABLAS' as seccion,
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS HABILITADO'
        ELSE '❌ RLS DESHABILITADO'
    END as estado_rls
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ========================================
-- PASO 2: VER ESTRUCTURA DE TABLAS CLAVE
-- ========================================

-- Verificar si existe la tabla keys
SELECT 
    'VERIFICAR KEYS' as seccion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'keys') THEN '✅ TABLA KEYS EXISTE'
        ELSE '❌ TABLA KEYS NO EXISTE'
    END as estado_tabla_keys;

-- Verificar si existe la tabla qr_codes
SELECT 
    'VERIFICAR QR_CODES' as seccion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'qr_codes') THEN '✅ TABLA QR_CODES EXISTE'
        ELSE '❌ TABLA QR_CODES NO EXISTE'
    END as estado_tabla_qr_codes;

-- ========================================
-- PASO 3: VER COLUMNAS DE TABLAS CLAVE
-- ========================================

-- Si existe keys, mostrar sus columnas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'keys') THEN
        RAISE NOTICE '🔑 TABLA KEYS EXISTE - Mostrando columnas...';
    ELSE
        RAISE NOTICE '❌ TABLA KEYS NO EXISTE';
    END IF;
END $$;

-- Mostrar columnas de keys (si existe)
SELECT 
    'COLUMNAS KEYS' as seccion,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'keys' 
ORDER BY ordinal_position;

-- Mostrar columnas de qr_codes (si existe)
SELECT 
    'COLUMNAS QR_CODES' as seccion,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
ORDER BY ordinal_position;

-- ========================================
-- PASO 4: VER POLÍTICAS RLS DE TODAS LAS TABLAS
-- ========================================

-- Mostrar todas las políticas RLS
SELECT 
    'TODAS LAS POLÍTICAS RLS' as seccion,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- PASO 5: VER USUARIO ACTUAL
-- ========================================

-- Verificar usuario autenticado
SELECT 
    'USUARIO ACTUAL' as seccion,
    current_user,
    session_user,
    auth.uid() as auth_uid,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ USUARIO AUTENTICADO'
        ELSE '❌ USUARIO NO AUTENTICADO'
    END as estado_autenticacion;

-- ========================================
-- PASO 6: VER TIENDAS DEL USUARIO
-- ========================================

-- Verificar tiendas del usuario
SELECT 
    'TIENDAS USUARIO' as seccion,
    COUNT(*) as total_tiendas,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ USUARIO TIENE TIENDAS'
        ELSE '❌ USUARIO NO TIENE TIENDAS'
    END as estado_tiendas
FROM stores 
WHERE owner_id = auth.uid();

-- Mostrar tiendas del usuario
SELECT 
    'DETALLE TIENDAS' as seccion,
    id as store_id,
    name as store_name,
    owner_id
FROM stores 
WHERE owner_id = auth.uid();

-- ========================================
-- PASO 7: RESUMEN COMPLETO
-- ========================================

DO $$
DECLARE
    total_tablas INTEGER;
    tablas_con_rls INTEGER;
    tablas_sin_rls INTEGER;
    tabla_keys_existe BOOLEAN;
    tabla_qr_codes_existe BOOLEAN;
    usuario_autenticado BOOLEAN;
    usuario_tiene_tiendas BOOLEAN;
BEGIN
    -- Contar tablas
    SELECT COUNT(*) INTO total_tablas FROM pg_tables WHERE schemaname = 'public';
    SELECT COUNT(*) INTO tablas_con_rls FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
    SELECT COUNT(*) INTO tablas_sin_rls FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;
    
    -- Verificar tablas clave
    tabla_keys_existe := EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'keys');
    tabla_qr_codes_existe := EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'qr_codes');
    
    -- Verificar usuario
    usuario_autenticado := (auth.uid() IS NOT NULL);
    usuario_tiene_tiendas := EXISTS (SELECT 1 FROM stores WHERE owner_id = auth.uid());
    
    RAISE NOTICE '🔍 RESUMEN COMPLETO DE LA BASE DE DATOS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TOTAL TABLAS: %', total_tablas;
    RAISE NOTICE 'TABLAS CON RLS: %', tablas_con_rls;
    RAISE NOTICE 'TABLAS SIN RLS: %', tablas_sin_rls;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TABLA KEYS: %', CASE WHEN tabla_keys_existe THEN '✅ EXISTE' ELSE '❌ NO EXISTE' END;
    RAISE NOTICE 'TABLA QR_CODES: %', CASE WHEN tabla_qr_codes_existe THEN '✅ EXISTE' ELSE '❌ NO EXISTE' END;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'USUARIO AUTENTICADO: %', CASE WHEN usuario_autenticado THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'USUARIO TIENE TIENDAS: %', CASE WHEN usuario_tiene_tiendas THEN '✅' ELSE '❌' END;
    RAISE NOTICE '========================================';
    
    IF NOT tabla_keys_existe THEN
        RAISE NOTICE '❌ PROBLEMA CRÍTICO: La tabla keys NO EXISTE!';
    END IF;
    
    IF NOT tabla_qr_codes_existe THEN
        RAISE NOTICE '❌ PROBLEMA CRÍTICO: La tabla qr_codes NO EXISTE!';
    END IF;
    
    IF NOT usuario_autenticado THEN
        RAISE NOTICE '❌ PROBLEMA: Usuario no autenticado';
    END IF;
    
    IF NOT usuario_tiene_tiendas THEN
        RAISE NOTICE '❌ PROBLEMA: Usuario no tiene tiendas';
    END IF;
END $$;
