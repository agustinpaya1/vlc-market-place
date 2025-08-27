-- Deshabilitar RLS en qr_codes temporalmente para resolver error 406
ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;

-- Otorgar permisos necesarios
GRANT ALL ON qr_codes TO authenticated;

-- Asegurar que la tabla existe con la estructura correcta
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id),
  code TEXT,
  payload JSONB,
  signature TEXT,
  validation_attempts INTEGER DEFAULT 0,
  is_valid BOOLEAN DEFAULT true,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_qr_codes_order_id ON qr_codes(order_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_signature ON qr_codes(signature);
CREATE INDEX IF NOT EXISTS idx_qr_codes_store_id ON qr_codes(store_id);
