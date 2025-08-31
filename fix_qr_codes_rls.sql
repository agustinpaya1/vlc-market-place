-- Script para corregir las políticas RLS de qr_codes
-- Permite UPDATE para dueños de tiendas

-- 1. Verificar políticas RLS existentes
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
WHERE tablename = 'qr_codes';

-- 2. Eliminar políticas RLS problemáticas
DROP POLICY IF EXISTS "qr_codes_select_policy" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_update_policy" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_delete_policy" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_insert_policy" ON qr_codes;

-- 3. Crear políticas RLS corregidas
-- Política para SELECT: Solo dueños de tiendas pueden ver QRs de sus tiendas
CREATE POLICY "qr_codes_select_policy" ON qr_codes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = qr_codes.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

-- Política para INSERT: Usuarios autenticados pueden crear QRs
CREATE POLICY "qr_codes_insert_policy" ON qr_codes
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE: Solo dueños de tiendas pueden actualizar QRs de sus tiendas
CREATE POLICY "qr_codes_update_policy" ON qr_codes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = qr_codes.store_id 
            AND stores.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = qr_codes.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

-- Política para DELETE: Solo dueños de tiendas pueden eliminar QRs de sus tiendas
CREATE POLICY "qr_codes_delete_policy" ON qr_codes
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = qr_codes.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

-- 4. Verificar que las políticas se crearon correctamente
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
WHERE tablename = 'qr_codes';

-- 5. Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'qr_codes';

-- 6. Habilitar RLS si no está habilitado
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

RAISE NOTICE 'Políticas RLS corregidas para qr_codes. Ahora los dueños de tiendas pueden actualizar sus QRs.';
