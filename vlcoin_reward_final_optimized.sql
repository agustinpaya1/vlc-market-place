-- Script optimizado para asignar VLcoins en pedidos
-- Considerando la estructura completa de la tabla orders

-- Función para calcular VLcoins: 10 monedas por euro
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

-- Función principal para procesar pedidos
CREATE OR REPLACE FUNCTION add_vlcoins_on_order(order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_total_price DECIMAL;
  v_store_id TEXT;
  v_vlcoin_used INTEGER;
  v_reward_amount INTEGER;
  v_current_balance INTEGER;
  v_order_info RECORD;
BEGIN
  -- Obtener toda la información relevante del pedido
  SELECT 
    o.user_id,
    o.total_price,
    o.store_id,
    COALESCE(o.vlcoin_used, 0) as vlcoin_used
  INTO v_order_info
  FROM orders o 
  WHERE o.id = order_id;
  
  -- Extraer valores para mejor legibilidad
  v_user_id := v_order_info.user_id;
  v_total_price := v_order_info.total_price;
  v_store_id := v_order_info.store_id;
  v_vlcoin_used := v_order_info.vlcoin_used;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID not found for order %', order_id;
  END IF;
  
  -- Calcular la recompensa usando la función auxiliar
  v_reward_amount := calculate_vlcoin_reward(v_total_price);
  
  -- Obtener el balance actual
  SELECT COALESCE(balance, 0) INTO v_current_balance
  FROM vlcoin WHERE user_id = v_user_id;
  
  -- Si no hay registro, inicializar en 0
  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;
  
  -- Usar upsert_vlcoin para modificar el balance
  PERFORM upsert_vlcoin(v_user_id, v_current_balance + v_reward_amount);
  
  -- Actualizar updated_at de la orden para mantener un registro
  UPDATE orders
  SET updated_at = NOW()
  WHERE id = order_id;
  
  -- Registrar información detallada de la operación
  RAISE NOTICE 'VLCoin Reward Details:';
  RAISE NOTICE '- Added % VLcoins to user %', v_reward_amount, v_user_id;
  RAISE NOTICE '- Order ID: %', order_id;
  RAISE NOTICE '- Total price: %', v_total_price;
  RAISE NOTICE '- Store ID: %', v_store_id;
  RAISE NOTICE '- VLCoins used in order: %', v_vlcoin_used;
  RAISE NOTICE '- Previous balance: %', v_current_balance;
  RAISE NOTICE '- New balance: %', v_current_balance + v_reward_amount;
END;
$$ LANGUAGE plpgsql;

-- Función de trigger adaptada para los pedidos completados
CREATE OR REPLACE FUNCTION trigger_add_vlcoins_on_order_delivered()
RETURNS TRIGGER AS $$
BEGIN
  -- Detectar cuando un pedido cambia a estado 'delivered'
  -- Estado confirmado en las imágenes proporcionadas
  IF (NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered')) THEN
    -- Verificar que tenga un precio válido
    IF NEW.total_price IS NULL OR NEW.total_price <= 0 THEN
      RAISE NOTICE 'Skipping VLCoin reward for order % - Invalid price: %', NEW.id, NEW.total_price;
      RETURN NEW;
    END IF;
    
    -- Verificar que tenga un user_id válido
    IF NEW.user_id IS NULL THEN
      RAISE NOTICE 'Skipping VLCoin reward for order % - Missing user', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Llamar a la función para añadir VLcoins
    PERFORM add_vlcoins_on_order(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS trg_add_vlcoins_on_order_delivered ON orders;

-- Crear trigger nuevo
CREATE TRIGGER trg_add_vlcoins_on_order_delivered
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_add_vlcoins_on_order_delivered();
  
-- Verificar la implementación
DO $$
BEGIN
  RAISE NOTICE '✅ Implementada la función de recompensa de VLcoins:';
  RAISE NOTICE '- 10 monedas por cada euro gastado';
  RAISE NOTICE '- Se otorgan automáticamente cuando el pedido cambia a estado "delivered"';
  RAISE NOTICE '- Se actualiza la fecha de modificación del pedido';
  RAISE NOTICE '- Se verifican datos válidos antes de la recompensa';
  RAISE NOTICE '- Se genera un registro detallado de cada recompensa';
END $$; 