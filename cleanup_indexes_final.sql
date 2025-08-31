-- Script FINAL para limpiar índices duplicados en qr_codes
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

-- Mostrar índices finales optimizados usando información del sistema
SELECT 
    i.relname as index_name,
    t.relname as table_name,
    a.attname as column_name
FROM pg_class i
JOIN pg_index ix ON i.oid = ix.indexrelid
JOIN pg_class t ON ix.indrelid = t.oid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relname = 'qr_codes'
ORDER BY i.relname;

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
