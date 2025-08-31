-- Script de diagnóstico para verificar acceso a la tabla keys
-- IMPORTANTE: Ejecutar en Supabase Dashboard DESPUÉS de fix_keys_rls_targeted.sql

-- ========================================
-- PASO 1: VERIFICAR POLÍTICAS FINALES
-- ========================================

-- Verificar que solo quedan las políticas correctas
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
-- PASO 2: VERIFICAR ACCESO DEL USUARIO
-- ========================================

-- Verificar que el usuario autenticado puede ver sus tiendas
SELECT 
    id as store_id,
    name as store_name,
    owner_id
FROM stores 
WHERE owner_id = auth.uid();

-- ========================================
-- PASO 3: VERIFICAR CLAVES EXISTENTES
-- ========================================

-- Verificar si hay claves para las tiendas del usuario
SELECT 
    k.id as key_id,
    k.store_id,
    s.name as store_name,
    k.public_key,
    k.is_active,
    k.created_at
FROM keys k
JOIN stores s ON k.store_id = s.id
WHERE s.owner_id = auth.uid()
ORDER BY k.created_at DESC;

-- ========================================
-- PASO 4: MENSAJE DE DIAGNÓSTICO
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '🔍 DIAGNÓSTICO COMPLETADO!';
    RAISE NOTICE '✅ Verifica que aparezcan tus tiendas en el PASO 2';
    RAISE NOTICE '✅ Verifica que puedas ver claves en el PASO 3 (si existen)';
    RAISE NOTICE '🚀 Si todo está bien, intenta generar el QR nuevamente!';
END $$;
