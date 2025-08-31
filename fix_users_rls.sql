-- Script para corregir las políticas RLS de la tabla users
-- Resuelve el error "permission denied for table users"

-- 1. Verificar políticas RLS existentes en users
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
WHERE tablename = 'users';

-- 2. Verificar si RLS está habilitado en users
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'users';

-- 3. Verificar la estructura de la tabla users
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 4. Eliminar políticas RLS existentes si las hay
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- 5. Crear políticas RLS básicas para users
-- Política para SELECT: Usuarios autenticados pueden ver su propio perfil
CREATE POLICY "users_select_policy" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Política para INSERT: Usuarios autenticados pueden crear su perfil
CREATE POLICY "users_insert_policy" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Política para UPDATE: Usuarios autenticados pueden actualizar su propio perfil
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Política para DELETE: Usuarios autenticados pueden eliminar su propio perfil
CREATE POLICY "users_delete_policy" ON users
    FOR DELETE
    USING (auth.uid() = id);

-- 6. Habilitar RLS si no está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 7. Verificar que las políticas se crearon correctamente
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
WHERE tablename = 'users';

-- 8. Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'users';

-- 9. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Políticas RLS corregidas para users. Ahora los usuarios autenticados pueden acceder a su perfil.';
END $$;
