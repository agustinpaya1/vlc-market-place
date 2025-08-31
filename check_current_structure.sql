-- Script para verificar la estructura actual de las tablas
-- Ejecutar en Supabase Dashboard para ver el estado actual

-- 1. Verificar estructura de keys_public
SELECT 
    'keys_public' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'keys_public' 
ORDER BY ordinal_position;

-- 2. Verificar estructura de qr_codes
SELECT 
    'qr_codes' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
ORDER BY ordinal_position;

-- 3. Verificar foreign keys existentes
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('keys_public', 'qr_codes')
ORDER BY tc.table_name, kcu.column_name;

-- 4. Verificar índices existentes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('keys_public', 'qr_codes')
ORDER BY tablename, indexname;

-- 5. Verificar RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('keys_public', 'qr_codes')
ORDER BY tablename, policyname;
