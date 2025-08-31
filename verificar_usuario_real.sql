-- VERIFICAR USUARIO REAL DESDE LA APP
-- IMPORTANTE: Este script debe ejecutarse DESDE TU APP ANGULAR
-- NO desde Supabase Dashboard (que usa usuario postgres)

-- ========================================
-- PASO 1: VERIFICAR USUARIO AUTENTICADO
-- ========================================

-- Verificar quién es el usuario actual en SQL
SELECT 
    'USUARIO REAL EN APP' as seccion,
    current_user,
    session_user,
    auth.uid() as auth_uid,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ USUARIO AUTENTICADO'
        ELSE '❌ USUARIO NO AUTENTICADO'
    END as estado_autenticacion;

-- ========================================
-- PASO 2: VER TIENDAS DEL USUARIO REAL
-- ========================================

-- Verificar tiendas del usuario autenticado
SELECT 
    'TIENDAS DEL USUARIO REAL' as seccion,
    COUNT(*) as total_tiendas,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ USUARIO TIENE TIENDAS'
        ELSE '❌ USUARIO NO TIENE TIENDAS'
    END as estado_tiendas
FROM stores 
WHERE owner_id = auth.uid();

-- Mostrar tiendas del usuario real
SELECT 
    'DETALLE TIENDAS USUARIO REAL' as seccion,
    id as store_id,
    name as store_name,
    owner_id,
    created_at
FROM stores 
WHERE owner_id = auth.uid()
ORDER BY name;

-- ========================================
-- PASO 3: VER ACCESO A KEYS CON USUARIO REAL
-- ========================================

-- Intentar acceso a keys con el usuario real
SELECT 
    'ACCESO A KEYS CON USUARIO REAL' as seccion,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM keys 
            WHERE store_id IN (
                SELECT id FROM stores WHERE owner_id = auth.uid()
            )
        ) THEN '✅ ACCESO A KEYS FUNCIONA'
        ELSE '❌ ACCESO A KEYS FALLA'
    END as estado_acceso_keys;

-- Contar claves accesibles para el usuario real
SELECT 
    'CLAVES ACCESIBLES PARA USUARIO REAL' as seccion,
    COUNT(*) as total_claves_accesibles
FROM keys 
WHERE store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
);

-- ========================================
-- PASO 4: RESUMEN FINAL
-- ========================================

DO $$
DECLARE
    usuario_autenticado BOOLEAN;
    tiendas_usuario INTEGER;
    claves_accesibles INTEGER;
BEGIN
    usuario_autenticado := (auth.uid() IS NOT NULL);
    SELECT COUNT(*) INTO tiendas_usuario FROM stores WHERE owner_id = auth.uid();
    SELECT COUNT(*) INTO claves_accesibles FROM keys WHERE store_id IN (
        SELECT id FROM stores WHERE owner_id = auth.uid()
    );
    
    RAISE NOTICE '🔍 VERIFICACIÓN USUARIO REAL COMPLETADA!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'USUARIO AUTENTICADO: %', CASE WHEN usuario_autenticado THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'TIENDAS DEL USUARIO: %', tiendas_usuario;
    RAISE NOTICE 'CLAVES ACCESIBLES: %', claves_accesibles;
    RAISE NOTICE '========================================';
    
    IF NOT usuario_autenticado THEN
        RAISE NOTICE '❌ PROBLEMA: Usuario no autenticado en la app';
        RAISE NOTICE '💡 SOLUCIÓN: Verificar login en Angular';
    ELSIF tiendas_usuario = 0 THEN
        RAISE NOTICE '❌ PROBLEMA: El usuario no tiene tiendas';
        RAISE NOTICE '💡 SOLUCIÓN: Asignar tiendas al usuario';
    ELSIF claves_accesibles = 0 THEN
        RAISE NOTICE '❌ PROBLEMA: No hay claves para las tiendas del usuario';
        RAISE NOTICE '💡 SOLUCIÓN: Crear claves para las tiendas';
    ELSE
        RAISE NOTICE '✅ TODO ESTÁ CORRECTO! El usuario tiene tiendas y claves';
    END IF;
END $$;

