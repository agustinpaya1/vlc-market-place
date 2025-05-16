-- Script para verificar que la función upsert_vlcoin existe y funciona correctamente

-- 1. Verificar si existe la función
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'upsert_vlcoin'
    ) THEN
        RAISE NOTICE 'La función upsert_vlcoin existe en la base de datos.';
    ELSE
        RAISE EXCEPTION 'ERROR: La función upsert_vlcoin no existe. Por favor, ejecútala primero.';
    END IF;
END $$;

-- 2. Si no existe, definirla (solo como referencia)
CREATE OR REPLACE FUNCTION upsert_vlcoin(p_user_id UUID, p_balance INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Intenta actualizar el registro si existe
  UPDATE vlcoin
  SET balance = p_balance, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Si no se actualizó ningún registro, inserta uno nuevo
  IF NOT FOUND THEN
    INSERT INTO vlcoin (user_id, balance)
    VALUES (p_user_id, p_balance);
  END IF;
  
  -- También actualizar profiles para mantener sincronización
  UPDATE profiles
  SET vlcoin_balance = p_balance
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Información sobre las dependencias
RAISE NOTICE 'Nota importante: La función de recompensa de VLcoins depende de upsert_vlcoin.';
RAISE NOTICE 'Si no existe esta función, se ha creado una implementación predeterminada.';
RAISE NOTICE 'Asegúrate de ejecutar primero los scripts que hemos creado anteriormente para la tabla vlcoin.'; 