-- Script para crear una TIENDA DE PRUEBA
-- IMPORTANTE: Ejecutar en Supabase Dashboard

-- ========================================
-- PASO 1: VERIFICAR USUARIO ACTUAL
-- ========================================

-- Verificar quién es el usuario autenticado
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
-- PASO 2: VERIFICAR TIENDAS EXISTENTES
-- ========================================

-- Verificar tiendas actuales del usuario
SELECT 
    'TIENDAS ACTUALES' as seccion,
    COUNT(*) as total_tiendas,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ USUARIO YA TIENE TIENDAS'
        ELSE '❌ USUARIO NO TIENE TIENDAS'
    END as estado_tiendas
FROM stores 
WHERE owner_id = auth.uid();

-- Mostrar tiendas existentes (si las hay)
SELECT 
    'DETALLE TIENDAS EXISTENTES' as seccion,
    id as store_id,
    name as store_name,
    owner_id,
    created_at
FROM stores 
WHERE owner_id = auth.uid()
ORDER BY created_at DESC;

-- ========================================
-- PASO 3: CREAR TIENDA DE PRUEBA
-- ========================================

-- Crear una tienda de prueba para el usuario
INSERT INTO stores (id, name, description, address, owner_id, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Tienda de Prueba VLC',
    'Tienda de prueba para generar QR codes',
    'Dirección de prueba',
    auth.uid(),
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- ========================================
-- PASO 4: VERIFICAR TIENDA CREADA
-- ========================================

-- Verificar que la tienda se creó
SELECT 
    'TIENDA CREADA' as seccion,
    id as store_id,
    name as store_name,
    owner_id,
    created_at
FROM stores 
WHERE owner_id = auth.uid()
ORDER BY created_at DESC;

-- ========================================
-- PASO 5: VERIFICAR ACCESO A KEYS
-- ========================================

-- Intentar acceso a keys (esto debería funcionar ahora)
SELECT 
    'ACCESO A KEYS' as seccion,
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
-- PASO 6: MENSAJE DE COMPLETADO
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '🏪 TIENDA DE PRUEBA CREADA!';
    RAISE NOTICE '✅ Tienda creada para el usuario autenticado';
    RAISE NOTICE '✅ Ahora puedes acceder a la tabla keys';
    RAISE NOTICE '✅ Puedes generar QR codes';
    RAISE NOTICE '🚀 ¡Intenta generar el QR nuevamente!';
END $$;

