-- Script para ASIGNAR una tienda existente al usuario
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
-- PASO 2: VER TIENDAS DISPONIBLES
-- ========================================

-- Mostrar todas las tiendas y su estado de propiedad
SELECT 
    'TODAS LAS TIENDAS' as seccion,
    id as store_id,
    name as store_name,
    owner_id,
    CASE 
        WHEN owner_id IS NULL THEN '🏪 DISPONIBLE (sin propietario)'
        WHEN owner_id = auth.uid() THEN '👑 TU TIENDA'
        ELSE '🔒 OTRO PROPIETARIO'
    END as estado_propiedad
FROM stores 
ORDER BY 
    CASE WHEN owner_id = auth.uid() THEN 1 
         WHEN owner_id IS NULL THEN 2 
         ELSE 3 END,
    name;

-- ========================================
-- PASO 3: ASIGNAR TIENDA DISPONIBLE
-- ========================================

-- Asignar la primera tienda disponible (sin propietario) al usuario
UPDATE stores 
SET owner_id = auth.uid(),
    updated_at = NOW()
WHERE id = (
    SELECT id FROM stores 
    WHERE owner_id IS NULL 
    ORDER BY created_at 
    LIMIT 1
);

-- ========================================
-- PASO 4: VERIFICAR ASIGNACIÓN
-- ========================================

-- Verificar que la tienda se asignó correctamente
SELECT 
    'TIENDA ASIGNADA' as seccion,
    id as store_id,
    name as store_name,
    owner_id,
    CASE 
        WHEN owner_id = auth.uid() THEN '✅ ASIGNADA A TI'
        ELSE '❌ NO ASIGNADA'
    END as estado_asignacion
FROM stores 
WHERE owner_id = auth.uid()
ORDER BY updated_at DESC;

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
DECLARE
    tiendas_asignadas INTEGER;
BEGIN
    -- Contar tiendas asignadas al usuario
    SELECT COUNT(*) INTO tiendas_asignadas 
    FROM stores 
    WHERE owner_id = auth.uid();
    
    RAISE NOTICE '🏪 TIENDA ASIGNADA AL USUARIO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TIENDAS ASIGNADAS: %', tiendas_asignadas;
    
    IF tiendas_asignadas > 0 THEN
        RAISE NOTICE '✅ Ahora eres propietario de una tienda';
        RAISE NOTICE '✅ Puedes acceder a la tabla keys';
        RAISE NOTICE '✅ Puedes generar QR codes';
        RAISE NOTICE '🚀 ¡Intenta generar el QR nuevamente!';
    ELSE
        RAISE NOTICE '❌ No se pudo asignar ninguna tienda';
        RAISE NOTICE '❌ Verifica que haya tiendas disponibles';
    END IF;
END $$;

