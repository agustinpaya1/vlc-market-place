-- Script SIMPLIFICADO para limpiar índices duplicados en qr_codes
-- IMPORTANTE: Ejecutar en Supabase Dashboard

-- ========================================
-- PASO 1: ELIMINAR ÍNDICES DUPLICADOS
-- ========================================

-- Eliminar índice duplicado en code (mantener el UNIQUE)
DROP INDEX IF EXISTS idx_qr_codes_code;

-- Eliminar índice duplicado en order_id (mantener el compuesto)
DROP INDEX IF EXISTS idx_qr_codes_order_id;

-- Eliminar índice en signature (no es necesario para performance)
DROP INDEX IF EXISTS idx_qr_codes_signature;

-- ========================================
-- PASO 2: VERIFICAR ÍNDICES FINALES
-- ========================================

-- Mostrar índices finales optimizados
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE tablename = 'qr_codes'
ORDER BY indexname;

-- ========================================
-- PASO 3: MENSAJE DE COMPLETADO
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '🎯 ÍNDICES OPTIMIZADOS!';
    RAISE NOTICE '✅ Eliminados índices duplicados';
    RAISE NOTICE '✅ Mantenidos índices esenciales para performance';
    RAISE NOTICE '✅ Estructura lista para el sistema criptográfico';
END $$;
