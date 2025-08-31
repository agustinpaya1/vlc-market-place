-- Script FINAL para corregir qr_codes
-- Elimina fk_key_id y cambia key_id a TEXT

-- 1. Verificar estructura actual
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
AND column_name IN ('key_id', 'public_key', 'updated_at')
ORDER BY column_name;

-- 2. Verificar restricciones existentes
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

-- 3. ELIMINAR la restricción fk_key_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_key_id' 
        AND table_name = 'qr_codes'
    ) THEN
        RAISE NOTICE 'Eliminando restricción fk_key_id...';
        EXECUTE 'ALTER TABLE qr_codes DROP CONSTRAINT fk_key_id';
        RAISE NOTICE '✅ Restricción fk_key_id eliminada';
    ELSE
        RAISE NOTICE 'No se encontró restricción fk_key_id';
    END IF;
END $$;

-- 4. Cambiar key_id de UUID a TEXT
DO $$
BEGIN
    RAISE NOTICE 'Cambiando key_id de UUID a TEXT...';
    ALTER TABLE qr_codes ALTER COLUMN key_id TYPE TEXT;
    RAISE NOTICE '✅ Tipo de key_id cambiado a TEXT';
END $$;

-- 5. Asegurar que public_key y updated_at existen
DO $$
BEGIN
    -- Agregar public_key si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' 
        AND column_name = 'public_key'
    ) THEN
        RAISE NOTICE 'Agregando columna public_key...';
        ALTER TABLE qr_codes ADD COLUMN public_key TEXT;
        RAISE NOTICE '✅ Columna public_key agregada';
    ELSE
        RAISE NOTICE 'Columna public_key ya existe';
    END IF;
    
    -- Agregar updated_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' 
        AND column_name = 'updated_at'
    ) THEN
        RAISE NOTICE 'Agregando columna updated_at...';
        ALTER TABLE qr_codes ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE '✅ Columna updated_at agregada';
    ELSE
        RAISE NOTICE 'Columna updated_at ya existe';
    END IF;
END $$;

-- 6. Crear índices necesarios
CREATE INDEX IF NOT EXISTS idx_qr_codes_key_id ON qr_codes(key_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_public_key ON qr_codes(public_key);
CREATE INDEX IF NOT EXISTS idx_qr_codes_code ON qr_codes(code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_is_valid ON qr_codes(is_valid);

-- 7. Verificar estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
AND column_name IN ('key_id', 'public_key', 'updated_at', 'code')
ORDER BY column_name;

-- 8. Verificar restricciones finales
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

-- 9. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Script completado. qr_codes.key_id ahora es TEXT y fk_key_id eliminada.';
END $$;
