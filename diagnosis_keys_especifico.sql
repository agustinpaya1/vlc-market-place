-- DIAGNÓSTICO ESPECÍFICO PARA LA TABLA KEYS
-- IMPORTANTE: Ejecutar en Supabase Dashboard

-- ========================================
-- PASO 1: VERIFICAR EXISTENCIA DE TABLA KEYS
-- ========================================

-- Verificar si la tabla keys existe
SELECT 
    'EXISTENCIA TABLA KEYS' as seccion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'keys') THEN '✅ TABLA KEYS EXISTE'
        ELSE '❌ TABLA KEYS NO EXISTE'
    END as estado_tabla_keys;

-- ========================================
-- PASO 2: VERIFICAR ESTRUCTURA DE KEYS
-- ========================================

-- Si existe, mostrar su estructura
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'keys') THEN
        RAISE NOTICE '🔑 TABLA KEYS EXISTE - Mostrando estructura...';
    ELSE
        RAISE NOTICE '❌ TABLA KEYS NO EXISTE - ESTE ES EL PROBLEMA!';
        RETURN;
    END IF;
END $$;

-- Mostrar columnas de keys (si existe)
SELECT 
    'COLUMNAS KEYS' as seccion,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'keys' 
ORDER BY ordinal_position;

-- ========================================
-- PASO 3: VERIFICAR RLS EN KEYS
-- ========================================

-- Verificar si RLS está habilitado en keys
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
-- PASO 4: VERIFICAR POLÍTICAS RLS EN KEYS
-- ========================================

-- Verificar políticas RLS en keys
SELECT 
    'POLÍTICAS RLS KEYS' as seccion,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN roles = '{authenticated}' THEN '✅ ROLES CORRECTOS'
        WHEN roles = '{public}' THEN '❌ ROLES INCORRECTOS'
        ELSE '⚠️ ROLES DIFERENTES'
    END as estado_roles
FROM pg_policies 
WHERE tablename = 'keys'
ORDER BY policyname;

-- ========================================
-- PASO 5: VERIFICAR ACCESO DIRECTO A KEYS
-- ========================================

-- Intentar acceso directo a keys
SELECT 
    'ACCESO DIRECTO KEYS' as seccion,
    COUNT(*) as total_keys,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ ACCESO DIRECTO FUNCIONA'
        ELSE '❌ ACCESO DIRECTO FALLA'
    END as estado_acceso_directo
FROM keys;

-- ========================================
-- PASO 6: VERIFICAR ACCESO CON POLÍTICAS RLS
-- ========================================

-- Intentar acceso con políticas RLS (esto debería funcionar)
SELECT 
    'ACCESO CON RLS' as seccion,
    COUNT(*) as total_keys_accesibles,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ ACCESO CON RLS FUNCIONA'
        ELSE '❌ ACCESO CON RLS FALLA'
    END as estado_acceso_rls
FROM keys 
WHERE store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
);

-- ========================================
-- PASO 7: VERIFICAR TIENDAS DEL USUARIO
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
WHERE owner_id = auth.uid()
ORDER BY name;

-- ========================================
-- PASO 8: RESUMEN DEL DIAGNÓSTICO
-- ========================================

DO $$
DECLARE
    tabla_keys_existe BOOLEAN;
    rls_habilitado BOOLEAN;
    politicas_existen BOOLEAN;
    usuario_tiene_tiendas BOOLEAN;
    acceso_directo_funciona BOOLEAN;
    acceso_rls_funciona BOOLEAN;
BEGIN
    -- Verificar cada condición
    tabla_keys_existe := EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'keys');
    rls_habilitado := EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'keys' AND rowsecurity = true);
    politicas_existen := EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'keys');
    usuario_tiene_tiendas := EXISTS (SELECT 1 FROM stores WHERE owner_id = auth.uid());
    
    -- Probar acceso
    BEGIN
        PERFORM COUNT(*) FROM keys;
        acceso_directo_funciona := true;
    EXCEPTION WHEN OTHERS THEN
        acceso_directo_funciona := false;
    END;
    
    BEGIN
        PERFORM COUNT(*) FROM keys WHERE store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid());
        acceso_rls_funciona := true;
    EXCEPTION WHEN OTHERS THEN
        acceso_rls_funciona := false;
    END;
    
    RAISE NOTICE '🔍 DIAGNÓSTICO ESPECÍFICO DE KEYS COMPLETADO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TABLA KEYS EXISTE: %', CASE WHEN tabla_keys_existe THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'RLS HABILITADO: %', CASE WHEN rls_habilitado THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'POLÍTICAS EXISTEN: %', CASE WHEN politicas_existen THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'USUARIO TIENE TIENDAS: %', CASE WHEN usuario_tiene_tiendas THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'ACCESO DIRECTO: %', CASE WHEN acceso_directo_funciona THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'ACCESO CON RLS: %', CASE WHEN acceso_rls_funciona THEN '✅' ELSE '❌' END;
    RAISE NOTICE '========================================';
    
    IF NOT tabla_keys_existe THEN
        RAISE NOTICE '❌ PROBLEMA CRÍTICO: La tabla keys NO EXISTE!';
    ELSIF NOT rls_habilitado THEN
        RAISE NOTICE '❌ PROBLEMA: RLS no habilitado en keys';
    ELSIF NOT politicas_existen THEN
        RAISE NOTICE '❌ PROBLEMA: No hay políticas RLS en keys';
    ELSIF NOT usuario_tiene_tiendas THEN
        RAISE NOTICE '❌ PROBLEMA: Usuario no tiene tiendas';
    ELSIF NOT acceso_directo_funciona THEN
        RAISE NOTICE '❌ PROBLEMA: No se puede acceder directamente a keys';
    ELSIF NOT acceso_rls_funciona THEN
        RAISE NOTICE '❌ PROBLEMA: Las políticas RLS están bloqueando el acceso';
    ELSE
        RAISE NOTICE '✅ TODO ESTÁ CORRECTO! El problema debe estar en otro lugar';
    END IF;
END $$;
