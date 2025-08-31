-- Script para corregir las políticas RLS de auth.users
-- Resuelve el error "permission denied for table users"

-- 1. Verificar el estado actual de auth.users
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'users';

-- 2. Verificar si ya existen políticas RLS
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

-- 3. Crear políticas RLS básicas para auth.users
-- Política para SELECT: Usuarios autenticados pueden ver su propio perfil
CREATE POLICY "auth_users_select_policy" ON auth.users
    FOR SELECT
    USING (auth.uid() = id);

-- Política para INSERT: Usuarios autenticados pueden crear su perfil
CREATE POLICY "auth_users_insert_policy" ON auth.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Política para UPDATE: Usuarios autenticados pueden actualizar su propio perfil
CREATE POLICY "auth_users_update_policy" ON auth.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Política para DELETE: Usuarios autenticados pueden eliminar su propio perfil
CREATE POLICY "auth_users_delete_policy" ON auth.users
    FOR DELETE
    USING (auth.uid() = id);

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
WHERE schemaname = 'auth' AND tablename = 'users';

-- 5. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Políticas RLS creadas para auth.users. Ahora los usuarios autenticados pueden acceder a su perfil.';
    RAISE NOTICE 'El error "permission denied for table users" debería estar resuelto.';
END $$;
