-- Función auxiliar para calcular VLcoins por un pedido
-- Esta función puede ser llamada desde la app para mostrar el premio esperado

CREATE OR REPLACE FUNCTION calculate_vlcoin_reward(price DECIMAL)
RETURNS INTEGER AS $$
DECLARE
  reward INTEGER;
BEGIN
  -- Calcular la recompensa: 10 VLcoins por cada euro
  reward := FLOOR(price * 10);
  
  -- Aplicar un mínimo de recompensa para compras pequeñas
  IF reward < 10 AND price > 0 THEN
    reward := 10;
  END IF;
  
  RETURN reward;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT calculate_vlcoin_reward(25.50);  -- Devuelve 255 