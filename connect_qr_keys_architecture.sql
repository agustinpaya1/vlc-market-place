-- Script para conectar qr_codes con keys_public y optimizar la arquitectura
-- IMPORTANTE: Ejecutar en Supabase Dashboard

-- 1. Agregar columna key_id a qr_codes para conectar con keys_public
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS key_id UUID REFERENCES keys_public(id);

-- 2. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_qr_codes_key_id ON qr_codes(key_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_store_key ON qr_codes(store_id, key_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_order_key ON qr_codes(order_id, key_id);

-- 3. Asegurar que las columnas críticas existen
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS public_key TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Hacer code NOT NULL y UNIQUE
ALTER TABLE qr_codes 
ALTER COLUMN code SET NOT NULL;

-- Agregar constraint UNIQUE si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'qr_codes_code_key'
    ) THEN
        ALTER TABLE qr_codes ADD CONSTRAINT qr_codes_code_key UNIQUE (code);
        RAISE NOTICE '✅ Constraint UNIQUE agregado a code';
    ELSE
        RAISE NOTICE 'Constraint UNIQUE ya existe en code';
    END IF;
END $$;

-- 5. Crear índices adicionales para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_qr_codes_public_key ON qr_codes(public_key);
CREATE INDEX IF NOT EXISTS idx_qr_codes_updated_at ON qr_codes(updated_at);
CREATE INDEX IF NOT EXISTS idx_qr_codes_is_valid ON qr_codes(is_valid);
CREATE INDEX IF NOT EXISTS idx_qr_codes_used_at ON qr_codes(used_at);

-- 6. Verificar estructura final
SELECT 
    'qr_codes' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
ORDER BY ordinal_position;
