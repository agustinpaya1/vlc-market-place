-- Asegurar que las políticas RLS en orders permitan actualizaciones
-- Deshabilitar RLS temporalmente en orders para permitir actualizaciones
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Otorgar permisos necesarios
GRANT ALL ON orders TO authenticated;

-- Crear políticas simples si es necesario
DROP POLICY IF EXISTS orders_select_policy ON orders;
DROP POLICY IF EXISTS orders_update_policy ON orders;
DROP POLICY IF EXISTS orders_insert_policy ON orders;

-- Política para seleccionar pedidos (cualquier usuario autenticado puede ver)
CREATE POLICY orders_select_policy ON orders
  FOR SELECT TO authenticated
  USING (true);

-- Política para actualizar pedidos (cualquier usuario autenticado puede actualizar)
CREATE POLICY orders_update_policy ON orders
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para insertar pedidos (cualquier usuario autenticado puede insertar)
CREATE POLICY orders_insert_policy ON orders
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Re-habilitar RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
