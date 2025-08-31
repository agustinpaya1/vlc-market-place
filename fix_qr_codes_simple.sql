-- Script SQL SIMPLE para ejecutar directamente en Supabase Dashboard
-- Solo agrega las columnas faltantes SIN cambiar tipos problemáticos

-- 1. Agregar columna public_key (TEXT) - COLUMNA CRÍTICA
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS public_key TEXT;

-- 2. Agregar columna updated_at (TIMESTAMP)
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Hacer code NOT NULL si no lo es
ALTER TABLE qr_codes 
ALTER COLUMN code SET NOT NULL;

-- 4. Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_qr_codes_public_key ON qr_codes(public_key);
CREATE INDEX IF NOT EXISTS idx_qr_codes_updated_at ON qr_codes(updated_at);

-- 5. Actualizar registros existentes
UPDATE qr_codes 
SET updated_at = COALESCE(updated_at, created_at)
WHERE updated_at IS NULL;

-- 6. Verificar la estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
ORDER BY ordinal_position;

-- 7. Verificar que public_key se agregó correctamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' 
        AND column_name = 'public_key'
    ) THEN
        RAISE NOTICE '✅ Columna public_key agregada correctamente';
    ELSE
        RAISE NOTICE '❌ Error: Columna public_key no se pudo agregar';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'qr_codes' 
        AND column_name = 'updated_at'
    ) THEN
        RAISE NOTICE '✅ Columna updated_at agregada correctamente';
    ELSE
        RAISE NOTICE '❌ Error: Columna updated_at no se pudo agregar';
    END IF;
    
    RAISE NOTICE 'Script simple completado.';
END $$;
