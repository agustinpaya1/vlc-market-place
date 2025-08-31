-- DIAGNÓSTICO SIMPLE PARA LA TABLA KEYS
-- IMPORTANTE: Ejecutar en Supabase Dashboard

-- ========================================
-- PASO 1: VERIFICAR EXISTENCIA DE TABLA
-- ========================================

-- Verificar si la tabla keys existe
SELECT 
    'EXISTENCIA TABLA KEYS' as seccion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'keys') THEN '✅ TABLA KEYS EXISTE'
        ELSE '❌ TABLA KEYS NO EXISTE'
    END as estado_tabla_keys;

-- ========================================
-- PASO 2: VERIFICAR RLS
-- ========================================

-- Verificar estado de RLS en keys
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

-- Verificar usuario actual
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
-- PASO 4: INTENTAR ACCESO DIRECTO
-- ========================================

-- Intentar acceso directo a keys (sin RLS)
SELECT 
    'ACCESO DIRECTO A KEYS' as seccion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM keys LIMIT 1) THEN '✅ ACCESO FUNCIONA'
        ELSE '❌ ACCESO FALLA'
    END as estado_acceso;

-- ========================================
-- PASO 5: VER ESTRUCTURA DE KEYS
-- ========================================

-- Mostrar columnas de keys (si existe)
SELECT 
    'COLUMNAS KEYS' as seccion,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'keys' 
ORDER BY ordinal_position;

-- ========================================
-- PASO 6: VER DATOS EN KEYS
-- ========================================

-- Intentar contar registros en keys
SELECT 
    'DATOS EN KEYS' as seccion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'keys') THEN
            (SELECT COUNT(*)::TEXT FROM keys)
        ELSE 'TABLA NO EXISTE'
    END as total_registros;

-- ========================================
-- PASO 7: RESUMEN FINAL
-- ========================================

DO $$
DECLARE
    tabla_existe BOOLEAN;
    rls_habilitado BOOLEAN;
    usuario_autenticado BOOLEAN;
    acceso_funciona BOOLEAN;
BEGIN
    -- Verificar cada condición
    tabla_existe := EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'keys');
    rls_habilitado := EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'keys' AND rowsecurity = true);
    usuario_autenticado := (auth.uid() IS NOT NULL);
    
    -- Probar acceso
    BEGIN
        PERFORM 1 FROM keys LIMIT 1;
        acceso_funciona := true;
    EXCEPTION WHEN OTHERS THEN
        acceso_funciona := false;
    END;
    
    RAISE NOTICE '🔍 DIAGNÓSTICO SIMPLE COMPLETADO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TABLA KEYS EXISTE: %', CASE WHEN tabla_existe THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'RLS HABILITADO: %', CASE WHEN rls_habilitado THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'USUARIO AUTENTICADO: %', CASE WHEN usuario_autenticado THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'ACCESO FUNCIONA: %', CASE WHEN acceso_funciona THEN '✅' ELSE '❌' END;
    RAISE NOTICE '========================================';
    
    IF NOT tabla_existe THEN
        RAISE NOTICE '❌ PROBLEMA CRÍTICO: La tabla keys NO EXISTE!';
        RAISE NOTICE '💡 SOLUCIÓN: Crear la tabla keys';
    ELSIF rls_habilitado THEN
        RAISE NOTICE '❌ PROBLEMA: RLS sigue habilitado';
        RAISE NOTICE '💡 SOLUCIÓN: Deshabilitar RLS completamente';
    ELSIF NOT usuario_autenticado THEN
        RAISE NOTICE '❌ PROBLEMA: Usuario no autenticado';
        RAISE NOTICE '💡 SOLUCIÓN: Autenticar usuario';
    ELSIF NOT acceso_funciona THEN
        RAISE NOTICE '❌ PROBLEMA: No se puede acceder a keys';
        RAISE NOTICE '💡 SOLUCIÓN: Verificar permisos básicos';
    ELSE
        RAISE NOTICE '✅ TODO ESTÁ CORRECTO! El problema debe estar en otro lugar';
    END IF;
END $$;
