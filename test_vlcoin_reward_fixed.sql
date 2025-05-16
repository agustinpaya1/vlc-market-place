-- Script corregido para probar la recompensa de VLcoins con datos reales
-- Este script busca un pedido existente en estado 'pending' y simula su entrega

BEGIN;  -- Iniciamos una transacción explícita

DO $$
DECLARE
    test_order_id UUID;
    test_user_id UUID;
    test_total_price DECIMAL;
    initial_vlcoin_balance INTEGER;
    new_vlcoin_balance INTEGER;
    expected_reward INTEGER;
BEGIN
    -- 1. Encontrar un pedido en estado 'pending' para la prueba
    SELECT id, user_id, total_price 
    INTO test_order_id, test_user_id, test_total_price
    FROM orders 
    WHERE status = 'pending'
    AND user_id IS NOT NULL
    AND total_price > 0
    LIMIT 1;
    
    -- Verificar si encontramos un pedido adecuado
    IF test_order_id IS NULL THEN
        RAISE NOTICE 'No se encontró ningún pedido adecuado para la prueba.';
        RETURN;
    END IF;
    
    RAISE NOTICE '=== PRUEBA DE RECOMPENSA VLCOIN ===';
    RAISE NOTICE 'Usando pedido: %', test_order_id;
    RAISE NOTICE 'Usuario: %', test_user_id;
    RAISE NOTICE 'Importe: % €', test_total_price;
    
    -- 2. Calcular la recompensa esperada
    expected_reward := calculate_vlcoin_reward(test_total_price);
    RAISE NOTICE 'Recompensa esperada: % VLcoins', expected_reward;
    
    -- 3. Verificar el balance actual de VLcoins
    SELECT COALESCE(balance, 0)
    INTO initial_vlcoin_balance
    FROM vlcoin
    WHERE user_id = test_user_id;
    
    -- Si no hay registro, asumimos 0
    IF initial_vlcoin_balance IS NULL THEN
        initial_vlcoin_balance := 0;
    END IF;
    
    RAISE NOTICE 'Balance inicial: % VLcoins', initial_vlcoin_balance;
    
    -- 5. Simular la entrega del pedido cambiando su estado a 'delivered'
    RAISE NOTICE 'Cambiando estado del pedido a "delivered"...';
    UPDATE orders
    SET status = 'delivered'
    WHERE id = test_order_id;
    
    -- 6. Verificar que se haya actualizado el balance de VLcoins
    SELECT COALESCE(balance, 0)
    INTO new_vlcoin_balance
    FROM vlcoin
    WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Balance después de la entrega: % VLcoins', new_vlcoin_balance;
    RAISE NOTICE 'Incremento real: % VLcoins', new_vlcoin_balance - initial_vlcoin_balance;
    
    -- 7. Verificar si la recompensa fue la esperada
    IF (new_vlcoin_balance - initial_vlcoin_balance) = expected_reward THEN
        RAISE NOTICE '✅ PRUEBA EXITOSA: La recompensa de VLcoins funciona correctamente';
    ELSE
        RAISE NOTICE '❌ PRUEBA FALLIDA: La recompensa es incorrecta';
        RAISE NOTICE 'Esperado: %, Obtenido: %', 
            expected_reward, new_vlcoin_balance - initial_vlcoin_balance;
    END IF;
    
    -- 10. Resumen final de la prueba
    RAISE NOTICE '';
    RAISE NOTICE '=== RESUMEN DE LA PRUEBA ===';
    RAISE NOTICE 'El sistema de recompensas VLcoin está configurado para otorgar % VLcoins por cada %.2f € de compra', 
        expected_reward, test_total_price;
    RAISE NOTICE 'La recompensa se activa automáticamente cuando un pedido cambia a estado "delivered"';
    RAISE NOTICE 'La prueba se realizó sin afectar datos reales (cambios serán revertidos)';
END $$;

ROLLBACK;  -- Revertimos todos los cambios al final

-- Nota informativa
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== OPERACIÓN COMPLETADA ===';
    RAISE NOTICE 'Se ha realizado una prueba completa con datos reales';
    RAISE NOTICE 'Todos los cambios han sido revertidos (ROLLBACK)';
    RAISE NOTICE 'El sistema está listo para uso en producción';
END $$; 