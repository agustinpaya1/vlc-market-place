-- Script para diagnosticar el error "permission denied for table users"
-- Identifica exactamente qué está causando el problema de permisos

-- 1. Verificar todas las tablas en la base de datos
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY schemaname, tablename;

-- 2. Verificar si existe la tabla users en algún esquema
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename = 'users';

-- 3. Verificar la tabla auth.users (usuarios de Supabase)
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'users';

-- 4. Verificar todas las políticas RLS existentes
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
ORDER BY schemaname, tablename, policyname;

-- 5. Verificar si hay políticas RLS en auth.users
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
WHERE schemaname = 'auth' AND tablename = 'users';

-- 6. Verificar la estructura de auth.users
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users' 
ORDER BY ordinal_position;

-- 7. Verificar si el usuario actual tiene permisos en auth.users
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'auth' AND table_name = 'users';

-- 8. Verificar el rol del usuario actual
SELECT 
    current_user,
    session_user,
    current_setting('role');

-- 9. Verificar si hay triggers o funciones que acceden a users
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users';

-- 10. Mensaje de diagnóstico
DO $$
BEGIN
    RAISE NOTICE 'Diagnóstico completado. Revisa los resultados para identificar la causa del error de permisos.';
    RAISE NOTICE 'Si no hay tabla users, el error puede venir de otra tabla o de una función/trigger.';
END $$;
