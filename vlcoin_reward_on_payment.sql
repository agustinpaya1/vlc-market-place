-- Script para actualizar la función add_vlcoins_on_order
-- Esta función se ejecutará cuando se complete un pago y asignará VLcoins basados en el valor de la compra

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
  
  -- Calcular la recompensa: 10 VLcoins por cada euro
  -- Aseguramos que sea un número entero usando FLOOR
  -- Para evitar fracciones de moneda
  v_reward_amount := FLOOR(v_total_price * 10);
  
  -- Aplicar un mínimo de recompensa (para compras muy pequeñas)
  IF v_reward_amount < 10 AND v_total_price > 0 THEN
    v_reward_amount := 10; -- Mínimo de 10 VLcoins para cualquier compra
  END IF;
  
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

-- Asociar un trigger a la tabla orders para ejecutar automáticamente cuando el estado cambie a 'paid'
CREATE OR REPLACE FUNCTION trigger_add_vlcoins_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo ejecutar cuando el estado cambie a 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Llamar a la función para añadir VLcoins
    PERFORM add_vlcoins_on_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear o reemplazar el trigger en la tabla orders
DROP TRIGGER IF EXISTS trg_add_vlcoins_on_payment ON orders;
CREATE TRIGGER trg_add_vlcoins_on_payment
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_add_vlcoins_on_payment();

-- Verificar si existen otros triggers que puedan estar interfiriendo
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  RAISE NOTICE 'Verificando triggers existentes en la tabla orders:';
  FOR trigger_record IN
    SELECT trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'orders'
  LOOP
    RAISE NOTICE 'Trigger: %, Evento: %, Acción: %', 
      trigger_record.trigger_name, 
      trigger_record.event_manipulation,
      trigger_record.action_statement;
  END LOOP;
END $$; 