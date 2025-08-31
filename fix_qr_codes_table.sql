-- Script SQL para ejecutar directamente en Supabase Dashboard
-- Agregar columnas faltantes a la tabla qr_codes existente
-- IMPORTANTE: Este script maneja las restricciones de clave foránea

-- 1. Primero, verificar si existe la restricción de clave foránea fk_key_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_key_id' 
        AND table_name = 'qr_codes'
    ) THEN
        -- Eliminar la restricción de clave foránea si existe
        ALTER TABLE qr_codes DROP CONSTRAINT IF EXISTS fk_key_id;
        RAISE NOTICE 'Restricción fk_key_id eliminada';
    ELSE
        RAISE NOTICE 'No se encontró restricción fk_key_id';
    END IF;
END $$;

-- 2. Agregar columna public_key (TEXT)
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS public_key TEXT;

-- 3. Agregar columna updated_at (TIMESTAMP)
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Cambiar key_id de UUID a TEXT para almacenar hash SHA256
-- Primero verificar si hay datos en key_id que puedan causar problemas
DO $$
BEGIN
    -- Si key_id tiene datos UUID válidos, convertirlos a texto
    IF EXISTS (
        SELECT 1 FROM qr_codes 
        WHERE key_id IS NOT NULL 
        AND key_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    ) THEN
        -- Convertir UUIDs existentes a texto
        UPDATE qr_codes 
        SET key_id = key_id::text 
        WHERE key_id IS NOT NULL;
        RAISE NOTICE 'UUIDs existentes convertidos a texto';
    END IF;
END $$;

-- Ahora cambiar el tipo de columna
ALTER TABLE qr_codes 
ALTER COLUMN key_id TYPE TEXT;

-- 5. Hacer code NOT NULL si no lo es
ALTER TABLE qr_codes 
ALTER COLUMN code SET NOT NULL;

-- 6. Agregar constraint UNIQUE a code si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'qr_codes_code_key'
    ) THEN
        ALTER TABLE qr_codes ADD CONSTRAINT qr_codes_code_key UNIQUE (code);
        RAISE NOTICE 'Constraint UNIQUE agregado a code';
    ELSE
        RAISE NOTICE 'Constraint UNIQUE ya existe en code';
    END IF;
END $$;

-- 7. Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_qr_codes_public_key ON qr_codes(public_key);
CREATE INDEX IF NOT EXISTS idx_qr_codes_updated_at ON qr_codes(updated_at);
CREATE INDEX IF NOT EXISTS idx_qr_codes_key_id ON qr_codes(key_id);

-- 8. Actualizar registros existentes
UPDATE qr_codes 
SET updated_at = COALESCE(updated_at, created_at)
WHERE updated_at IS NULL;

-- 9. Verificar la estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
ORDER BY ordinal_position;

-- 10. Verificar que no haya restricciones problemáticas
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
