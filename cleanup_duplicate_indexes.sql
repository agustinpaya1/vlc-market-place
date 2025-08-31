-- Script para limpiar índices duplicados en qr_codes
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
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'qr_codes'
ORDER BY indexname;

-- ========================================
-- PASO 3: VERIFICAR PERFORMANCE
-- ========================================

-- Mostrar estadísticas de uso de índices
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE tablename = 'qr_codes'
ORDER BY idx_scan DESC;

-- ========================================
-- PASO 4: MENSAJE DE COMPLETADO
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '🎯 ÍNDICES OPTIMIZADOS!';
    RAISE NOTICE '✅ Eliminados índices duplicados';
    RAISE NOTICE '✅ Mantenidos índices esenciales para performance';
    RAISE NOTICE '✅ Estructura lista para el sistema criptográfico';
END $$;
