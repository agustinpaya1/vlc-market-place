-- Script para configurar RLS en la tabla keys
-- IMPORTANTE: Ejecutar en Supabase Dashboard

-- ========================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- ========================================

-- Verificar si RLS está habilitado en keys
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'keys';

-- Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'keys'
ORDER BY policyname;

-- ========================================
-- PASO 2: CONFIGURAR POLÍTICAS RLS
-- ========================================

-- Habilitar RLS en keys (por si acaso)
ALTER TABLE keys ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Usuarios pueden ver claves de sus tiendas
CREATE POLICY "keys_select_policy" ON keys
    FOR SELECT USING (
        store_id IN (
            SELECT id FROM stores WHERE owner_id = auth.uid()
        )
    );

-- Política para INSERT: Usuarios pueden crear claves para sus tiendas
CREATE POLICY "keys_insert_policy" ON keys
    FOR INSERT WITH CHECK (
        store_id IN (
            SELECT id FROM stores WHERE owner_id = auth.uid()
        )
    );

-- Política para UPDATE: Usuarios pueden actualizar claves de sus tiendas
CREATE POLICY "keys_update_policy" ON keys
    FOR UPDATE USING (
        store_id IN (
            SELECT id FROM stores WHERE owner_id = auth.uid()
        )
    );

-- Política para DELETE: Usuarios pueden eliminar claves de sus tiendas
CREATE POLICY "keys_delete_policy" ON keys
    FOR DELETE USING (
        store_id IN (
            SELECT id FROM stores WHERE owner_id = auth.uid()
        )
    );

-- ========================================
-- PASO 3: VERIFICAR POLÍTICAS CREADAS
-- ========================================

-- Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'keys'
ORDER BY policyname;

-- ========================================
-- PASO 4: MENSAJE DE COMPLETADO
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '🔐 POLÍTICAS RLS CONFIGURADAS EN KEYS!';
    RAISE NOTICE '✅ SELECT: Usuarios pueden ver claves de sus tiendas';
    RAISE NOTICE '✅ INSERT: Usuarios pueden crear claves para sus tiendas';
    RAISE NOTICE '✅ UPDATE: Usuarios pueden actualizar claves de sus tiendas';
    RAISE NOTICE '✅ DELETE: Usuarios pueden eliminar claves de sus tiendas';
    RAISE NOTICE '🚀 La tabla keys ahora es accesible para usuarios autenticados!';
END $$;
