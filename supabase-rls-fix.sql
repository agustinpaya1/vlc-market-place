-- Habilitar RLS en la tabla stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir SELECT a todos los usuarios en la tabla stores
CREATE POLICY "Allow SELECT for all users on stores" 
ON stores FOR SELECT 
USING (true);

-- Habilitar RLS en la tabla products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir SELECT a todos los usuarios en la tabla products
CREATE POLICY "Allow SELECT for all users on products" 
ON products FOR SELECT 
USING (true);

-- Si las políticas ya existen y deseas reemplazarlas, primero elimínalas:
-- DROP POLICY IF EXISTS "Allow SELECT for all users on stores" ON stores;
-- DROP POLICY IF EXISTS "Allow SELECT for all users on products" ON products; 