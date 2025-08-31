-- DIAGNÓSTICO KEYS - PARTE 2: ACCESO Y ESTRUCTURA
-- IMPORTANTE: Ejecutar en Supabase Dashboard

-- ========================================
-- PASO 4: INTENTAR ACCESO DIRECTO
-- ========================================

-- Intentar acceso directo a keys (sin RLS)
SELECT 
    'ACCESO DIRECTO A KEYS' as seccion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM keys LIMIT 1) THEN '✅ ACCESO FUNCIONA'
        ELSE '❌ ACCESO FALLA'
    END as estado_acceso;

-- ========================================
-- PASO 5: VER ESTRUCTURA DE KEYS
-- ========================================

-- Mostrar columnas de keys (si existe)
SELECT 
    'COLUMNAS KEYS' as seccion,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'keys' 
ORDER BY ordinal_position;

-- ========================================
-- PASO 6: VER DATOS EN KEYS
-- ========================================

-- Intentar contar registros en keys
SELECT 
    'DATOS EN KEYS' as seccion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'keys') THEN
            (SELECT COUNT(*)::TEXT FROM keys)
        ELSE 'TABLA NO EXISTE'
    END as total_registros;

