-- Script para probar la asignación de VLcoins por pedidos

-- Modo de prueba seguro: guardar estado actual y restaurarlo después
DO $$
DECLARE
    test_user_id UUID;
    test_order_id UUID;
    initial_balance INTEGER;
    new_balance INTEGER;
BEGIN
    -- 1. Crear usuario de prueba o usar uno existente
    -- Obtener un usuario existente si es posible
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    -- Verificar si se encontró un usuario
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No se encontraron usuarios para la prueba';
        RETURN;
    END IF;
    
    -- 2. Guardar balance inicial
    SELECT COALESCE(balance, 0) INTO initial_balance 
    FROM vlcoin WHERE user_id = test_user_id;
    
    IF initial_balance IS NULL THEN
        initial_balance := 0;
    END IF;
    
    RAISE NOTICE 'Balance inicial del usuario %: % VLcoins', test_user_id, initial_balance;
    
    -- 3. Crear un pedido de prueba o usar uno existente
    -- Intentar obtener un pedido existente del usuario
    SELECT id INTO test_order_id 
    FROM orders 
    WHERE user_id = test_user_id 
    LIMIT 1;
    
    -- Si no hay pedido, crear uno nuevo
    IF test_order_id IS NULL THEN
        INSERT INTO orders (user_id, total_price, status)
        VALUES (test_user_id, 25.50, 'pending')
        RETURNING id INTO test_order_id;
        
        RAISE NOTICE 'Creado nuevo pedido de prueba con ID: % y precio: 25.50€', test_order_id;
    ELSE
        -- Actualizar el pedido existente para la prueba
        UPDATE orders
        SET total_price = 25.50, status = 'pending'
        WHERE id = test_order_id;
        
        RAISE NOTICE 'Actualizado pedido existente con ID: % a precio: 25.50€', test_order_id;
    END IF;
    
    -- 4. Ejecutar la prueba simulando el cambio de estado a 'paid'
    RAISE NOTICE 'Simulando pago del pedido (cambio a estado paid)...';
    
    UPDATE orders
    SET status = 'paid'
    WHERE id = test_order_id;
    
    -- 5. Verificar el nuevo balance
    SELECT COALESCE(balance, 0) INTO new_balance 
    FROM vlcoin WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Balance después del pago: % VLcoins', new_balance;
    RAISE NOTICE 'Recompensa recibida: % VLcoins', new_balance - initial_balance;
    
    -- 6. Comprobar si la recompensa fue correcta (10 VLcoins por euro)
    DECLARE
        expected_reward INTEGER;
        actual_reward INTEGER;
    BEGIN
        -- Calcular la recompensa esperada (10 VLcoins por euro)
        expected_reward := FLOOR(25.50 * 10);
        actual_reward := new_balance - initial_balance;
        
        IF actual_reward = expected_reward THEN
            RAISE NOTICE 'PRUEBA EXITOSA: Se otorgaron % VLcoins tal como se esperaba', expected_reward;
        ELSE
            RAISE NOTICE 'PRUEBA FALLIDA: Se esperaban % VLcoins, pero se otorgaron %', 
                expected_reward, actual_reward;
        END IF;
    END;
    
    -- 7. Restaurar el estado original (opcional)
    RAISE NOTICE 'Restaurando estado original...';
    
    -- Restaurar el pedido a pendiente
    UPDATE orders
    SET status = 'pending'
    WHERE id = test_order_id;
    
    -- Restaurar el balance original
    PERFORM upsert_vlcoin(test_user_id, initial_balance);
    
    RAISE NOTICE 'Prueba completada y estado restaurado';
END $$; 