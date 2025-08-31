-- DIAGNÓSTICO COMPLETO Y DEFINITIVO
-- IMPORTANTE: Ejecutar en Supabase Dashboard

-- ========================================
-- PASO 1: VERIFICAR AUTENTICACIÓN
-- ========================================

-- Verificar si el usuario está autenticado
SELECT 
    'AUTENTICACIÓN' as seccion,
    current_user,
    session_user,
    auth.uid() as auth_uid,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ USUARIO AUTENTICADO'
        ELSE '❌ USUARIO NO AUTENTICADO'
    END as estado_autenticacion;

-- ========================================
-- PASO 2: VERIFICAR TABLA KEYS
-- ========================================

-- Verificar si la tabla keys existe y su estructura
SELECT 
    'TABLA KEYS' as seccion,
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS HABILITADO'
        ELSE '❌ RLS DESHABILITADO'
    END as estado_rls
FROM pg_tables 
WHERE tablename = 'keys';

-- Verificar columnas de keys
SELECT 
    'COLUMNAS KEYS' as seccion,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name = 'private_key' THEN '🔑 CLAVE PRIVADA'
        WHEN column_name = 'public_key' THEN '🔑 CLAVE PÚBLICA'
        WHEN column_name = 'store_id' THEN '🏪 ID TIENDA'
        ELSE '📋 COLUMNA NORMAL'
    END as tipo_columna
FROM information_schema.columns 
WHERE table_name = 'keys' 
ORDER BY ordinal_position;

-- ========================================
-- PASO 3: VERIFICAR POLÍTICAS RLS
-- ========================================

-- Verificar políticas RLS en keys
SELECT 
    'POLÍTICAS RLS' as seccion,
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
-- PASO 4: VERIFICAR TIENDAS DEL USUARIO
-- ========================================

-- Verificar si el usuario tiene tiendas
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
    owner_id,
    auth.uid() as current_user_id
FROM stores 
WHERE owner_id = auth.uid();

-- ========================================
-- PASO 5: VERIFICAR ACCESO A KEYS
-- ========================================

-- Intentar acceso directo a keys
SELECT 
    'ACCESO KEYS' as seccion,
    COUNT(*) as total_keys_accesibles,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ ACCESO A KEYS FUNCIONA'
        ELSE '❌ ACCESO A KEYS FALLA'
    END as estado_acceso
FROM keys 
WHERE store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
);

-- ========================================
-- PASO 6: VERIFICAR RELACIONES
-- ========================================

-- Verificar foreign keys
SELECT 
    'RELACIONES' as seccion,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN tc.table_name = 'keys' THEN '🔑 TABLA CLAVES'
        WHEN tc.table_name = 'qr_codes' THEN '📱 TABLA QR'
        ELSE '📋 OTRA TABLA'
    END as tipo_tabla
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name = 'qr_codes' OR tc.table_name = 'keys');

-- ========================================
-- PASO 7: RESUMEN DEL DIAGNÓSTICO
-- ========================================

DO $$
DECLARE
    usuario_autenticado BOOLEAN;
    tabla_keys_existe BOOLEAN;
    rls_habilitado BOOLEAN;
    columna_private_key_existe BOOLEAN;
    politicas_correctas BOOLEAN;
    usuario_tiene_tiendas BOOLEAN;
BEGIN
    -- Verificar cada condición
    usuario_autenticado := (auth.uid() IS NOT NULL);
    tabla_keys_existe := EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'keys');
    rls_habilitado := EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'keys' AND rowsecurity = true);
    columna_private_key_existe := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'keys' AND column_name = 'private_key');
    politicas_correctas := EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'keys' AND roles = '{authenticated}');
    usuario_tiene_tiendas := EXISTS (SELECT 1 FROM stores WHERE owner_id = auth.uid());
    
    RAISE NOTICE '🔍 DIAGNÓSTICO COMPLETO COMPLETADO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'USUARIO AUTENTICADO: %', CASE WHEN usuario_autenticado THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'TABLA KEYS EXISTE: %', CASE WHEN tabla_keys_existe THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'RLS HABILITADO: %', CASE WHEN rls_habilitado THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'COLUMNA PRIVATE_KEY: %', CASE WHEN columna_private_key_existe THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'POLÍTICAS CORRECTAS: %', CASE WHEN politicas_correctas THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'USUARIO TIENE TIENDAS: %', CASE WHEN usuario_tiene_tiendas THEN '✅' ELSE '❌' END;
    RAISE NOTICE '========================================';
    
    IF NOT usuario_autenticado THEN
        RAISE NOTICE '❌ PROBLEMA: Usuario no autenticado';
    ELSIF NOT tabla_keys_existe THEN
        RAISE NOTICE '❌ PROBLEMA: Tabla keys no existe';
    ELSIF NOT rls_habilitado THEN
        RAISE NOTICE '❌ PROBLEMA: RLS no habilitado en keys';
    ELSIF NOT columna_private_key_existe THEN
        RAISE NOTICE '❌ PROBLEMA: Falta columna private_key';
    ELSIF NOT politicas_correctas THEN
        RAISE NOTICE '❌ PROBLEMA: Políticas RLS incorrectas';
    ELSIF NOT usuario_tiene_tiendas THEN
        RAISE NOTICE '❌ PROBLEMA: Usuario no tiene tiendas';
    ELSE
        RAISE NOTICE '✅ TODO ESTÁ CORRECTO! El problema debe estar en otro lugar';
    END IF;
END $$;

