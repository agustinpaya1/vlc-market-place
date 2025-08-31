-- VERIFICAR ESTADO ACTUAL DE LA TABLA KEYS
-- IMPORTANTE: Ejecutar en Supabase Dashboard

-- ========================================
-- PASO 1: VERIFICAR TABLA KEYS
-- ========================================

-- Verificar si la tabla keys existe y su estado
SELECT 
    'ESTADO TABLA KEYS' as seccion,
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
-- PASO 2: VER POLÍTICAS RLS EN KEYS
-- ========================================

-- Ver todas las políticas RLS en keys
SELECT 
    'POLÍTICAS RLS EN KEYS' as seccion,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN '✅ CONDICIÓN DEFINIDA'
        ELSE '❌ SIN CONDICIÓN'
    END as tiene_condicion
FROM pg_policies 
WHERE tablename = 'keys'
ORDER BY policyname;

-- ========================================
-- PASO 3: VER DATOS EN KEYS
-- ========================================

-- Contar registros en keys
SELECT 
    'DATOS EN KEYS' as seccion,
    COUNT(*) as total_registros
FROM keys;

-- Mostrar algunos registros de keys
SELECT 
    'MUESTRA DE KEYS' as seccion,
    id,
    store_id,
    public_key,
    CASE 
        WHEN private_key IS NOT NULL THEN '✅ TIENE CLAVE PRIVADA'
        ELSE '❌ SIN CLAVE PRIVADA'
    END as estado_clave_privada,
    is_active,
    created_at
FROM keys 
LIMIT 5;

-- ========================================
-- PASO 4: VER RELACIONES CON STORES
-- ========================================

-- Verificar relación keys-stores
SELECT 
    'RELACIÓN KEYS-STORES' as seccion,
    k.id as key_id,
    k.store_id,
    s.name as store_name,
    s.owner_id,
    CASE 
        WHEN s.owner_id IS NOT NULL THEN '✅ TIENDA CON PROPIETARIO'
        ELSE '❌ TIENDA SIN PROPIETARIO'
    END as estado_propietario
FROM keys k
LEFT JOIN stores s ON k.store_id = s.id
ORDER BY k.created_at DESC
LIMIT 5;
