-- Script simplificado para diagnosticar permisos
-- Se ejecuta en una sola consulta

WITH table_info AS (
    SELECT 
        schemaname,
        tablename,
        rowsecurity
    FROM pg_tables 
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
),
policy_info AS (
    SELECT 
        schemaname,
        tablename,
        policyname,
        cmd,
        qual
    FROM pg_policies
),
user_tables AS (
    SELECT * FROM table_info WHERE tablename = 'users'
),
auth_users AS (
    SELECT * FROM table_info WHERE schemaname = 'auth' AND tablename = 'users'
),
user_policies AS (
    SELECT * FROM policy_info WHERE tablename = 'users'
)
SELECT 
    'TABLAS EN LA BD' as tipo,
    schemaname,
    tablename,
    rowsecurity,
    NULL as policyname,
    NULL as cmd,
    NULL as qual
FROM table_info
UNION ALL
SELECT 
    'TABLA USERS (SI EXISTE)' as tipo,
    schemaname,
    tablename,
    rowsecurity,
    NULL as policyname,
    NULL as cmd,
    NULL as qual
FROM user_tables
UNION ALL
SELECT 
    'AUTH.USERS' as tipo,
    schemaname,
    tablename,
    rowsecurity,
    NULL as policyname,
    NULL as cmd,
    NULL as qual
FROM auth_users
UNION ALL
SELECT 
    'POLITICAS RLS DE USERS' as tipo,
    schemaname,
    tablename,
    NULL as rowsecurity,
    policyname,
    cmd,
    qual
FROM user_policies
ORDER BY tipo, schemaname, tablename;
