-- Script para limpiar todas las políticas RLS existentes en qr_codes
-- IMPORTANTE: Ejecutar en Supabase Dashboard

-- 1. Eliminar todas las políticas existentes en qr_codes
DROP POLICY IF EXISTS "Staff can validate QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Users can view their own QR codes" ON qr_codes;
DROP POLICY IF EXISTS "qr_code_access" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_delete_policy" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_insert_auth" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_insert_own" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_insert_policy" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_select_auth" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_select_own" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_select_policy" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_update_auth" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_update_own" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_update_policy" ON qr_codes;

-- 2. Verificar que se eliminaron todas las políticas
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename = 'qr_codes'
ORDER BY policyname;

-- 3. Verificar que no hay políticas duplicadas
SELECT 
    policyname,
    COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'qr_codes'
GROUP BY policyname
HAVING COUNT(*) > 1;
