-- Script SIMPLE para cambiar key_id de UUID a TEXT
-- Sin operadores regex problemáticos

-- 1. Verificar el tipo actual de key_id
DO $$
BEGIN
    RAISE NOTICE 'Tipo actual de key_id: %', (
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'qr_codes' 
        AND column_name = 'key_id'
    );
END $$;

-- 2. Verificar si existe la restricción de clave foránea fk_key_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_key_id' 
        AND table_name = 'qr_codes'
    ) THEN
        RAISE NOTICE 'Encontrada restricción fk_key_id, eliminándola...';
        EXECUTE 'ALTER TABLE qr_codes DROP CONSTRAINT fk_key_id';
        RAISE NOTICE '✅ Restricción fk_key_id eliminada';
    ELSE
        RAISE NOTICE 'No se encontró restricción fk_key_id';
    END IF;
END $$;

-- 3. Cambiar key_id de UUID a TEXT (sin verificar contenido)
RAISE NOTICE 'Cambiando key_id de UUID a TEXT...';
ALTER TABLE qr_codes ALTER COLUMN key_id TYPE TEXT;
RAISE NOTICE '✅ Tipo de key_id cambiado a TEXT';

-- 4. Verificar el cambio
DO $$
BEGIN
    RAISE NOTICE 'Nuevo tipo de key_id: %', (
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'qr_codes' 
        AND column_name = 'key_id'
    );
END $$;

-- 5. Crear índice para key_id
CREATE INDEX IF NOT EXISTS idx_qr_codes_key_id ON qr_codes(key_id);

-- 6. Verificar la estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
AND column_name IN ('key_id', 'public_key', 'updated_at')
ORDER BY column_name;

RAISE NOTICE 'Script completado. key_id ahora es de tipo TEXT.';
