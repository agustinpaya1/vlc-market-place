-- Script para ELIMINAR solo las políticas RLS problemáticas en keys
-- IMPORTANTE: Ejecutar en Supabase Dashboard

-- ========================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- ========================================

-- Verificar políticas existentes
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
-- PASO 2: ELIMINAR SOLO POLÍTICAS PROBLEMÁTICAS
-- ========================================

-- Eliminar políticas con roles {public} (problemáticas)
DROP POLICY IF EXISTS "keys_select_policy" ON keys;
DROP POLICY IF EXISTS "keys_insert_policy" ON keys;
DROP POLICY IF EXISTS "keys_update_policy" ON keys;
DROP POLICY IF EXISTS "keys_delete_policy" ON keys;

-- ========================================
-- PASO 3: VERIFICAR POLÍTICAS RESTANTES
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
-- PASO 4: MENSAJE DE COMPLETADO
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '🔐 POLÍTICAS PROBLEMÁTICAS ELIMINADAS!';
    RAISE NOTICE '✅ Eliminadas políticas con roles {public}';
    RAISE NOTICE '✅ Mantenidas políticas con roles {authenticated}';
    RAISE NOTICE '✅ Mantenidas políticas con roles {service_role}';
    RAISE NOTICE '🚀 La tabla keys ahora es accesible para usuarios autenticados!';
END $$;
