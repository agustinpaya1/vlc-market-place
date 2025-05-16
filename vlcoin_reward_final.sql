-- Script final para asignar VLcoins en pedidos
-- Adaptado para los estados reales observados en la tabla orders

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
  v_reward_amount INTEGER;
  v_current_balance INTEGER;
BEGIN
  -- Obtener el user_id y el precio total de la orden
  SELECT o.user_id, o.total_price
  INTO v_user_id, v_total_price
  FROM orders o 
  WHERE o.id = order_id;
  
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
  
  -- Registrar la operación (opcional)
  RAISE NOTICE 'Added % VLcoins to user % for order % (total price: %)', 
    v_reward_amount, v_user_id, order_id, v_total_price;
END;
$$ LANGUAGE plpgsql;

-- Función de trigger adaptada para los estados reales observados
CREATE OR REPLACE FUNCTION trigger_add_vlcoins_on_order_delivered()
RETURNS TRIGGER AS $$
BEGIN
  -- Detectar cuando un pedido cambia a estado 'delivered'
  -- De las imágenes observamos que 'delivered' es un estado válido
  IF (NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered')) THEN
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
  RAISE NOTICE 'Implementada la función de recompensa de VLcoins:';
  RAISE NOTICE '- 10 monedas por cada euro gastado';
  RAISE NOTICE '- Se otorgan cuando el pedido cambia a estado "delivered"';
  RAISE NOTICE '- Se utiliza upsert_vlcoin para evitar duplicados';
END $$; 