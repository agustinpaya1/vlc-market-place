-- Script para cambiar key_id de UUID a TEXT
-- IMPORTANTE: Este script maneja la restricción de clave foránea fk_key_id

-- 1. Verificar si existe la restricción de clave foránea fk_key_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_key_id' 
        AND table_name = 'qr_codes'
    ) THEN
        RAISE NOTICE 'Encontrada restricción fk_key_id, eliminándola...';
        -- Eliminar la restricción de clave foránea
        EXECUTE 'ALTER TABLE qr_codes DROP CONSTRAINT fk_key_id';
        RAISE NOTICE '✅ Restricción fk_key_id eliminada';
    ELSE
        RAISE NOTICE 'No se encontró restricción fk_key_id';
    END IF;
END $$;

-- 2. Verificar el tipo actual de key_id
DO $$
BEGIN
    RAISE NOTICE 'Tipo actual de key_id: %', (
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'qr_codes' 
        AND column_name = 'key_id'
    );
END $$;

-- 3. Cambiar key_id de UUID a TEXT
DO $$
BEGIN
    -- Verificar si hay datos en key_id que puedan causar problemas
    IF EXISTS (
        SELECT 1 FROM qr_codes 
        WHERE key_id IS NOT NULL 
        AND key_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    ) THEN
        RAISE NOTICE 'Convirtiendo UUIDs existentes a texto...';
        -- Convertir UUIDs existentes a texto
        UPDATE qr_codes 
        SET key_id = key_id::text 
        WHERE key_id IS NOT NULL;
        RAISE NOTICE '✅ UUIDs existentes convertidos a texto';
    ELSE
        RAISE NOTICE 'No hay UUIDs existentes para convertir';
    END IF;
    
    -- Ahora cambiar el tipo de columna
    ALTER TABLE qr_codes ALTER COLUMN key_id TYPE TEXT;
    RAISE NOTICE '✅ Tipo de key_id cambiado a TEXT';
END $$;

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

-- 5. Crear índice para key_id si no existe
CREATE INDEX IF NOT EXISTS idx_qr_codes_key_id ON qr_codes(key_id);

-- 6. Verificar la estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
AND column_name IN ('key_id', 'public_key', 'updated_at')
ORDER BY column_name;

-- 7. Verificar que no haya restricciones problemáticas
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'qr_codes';

RAISE NOTICE 'Script completado. key_id ahora es de tipo TEXT.';
