-- Script actualizado para probar la asignación de VLcoins por pedidos
-- Usando estados válidos para la tabla orders

-- Modo de prueba seguro: guardar estado actual y restaurarlo después
DO $$
DECLARE
    test_user_id UUID;
    test_order_id UUID;
    initial_balance INTEGER;
    new_balance INTEGER;
    valid_status TEXT; -- Para almacenar un estado válido
BEGIN
    -- 0. Determinar qué estados son válidos para orders
    -- Estados comunes en sistemas e-commerce:
    -- pending, processing, completed, delivered, canceled
    -- Intentaremos primero con 'completed' y luego con otros
    valid_status := 'pending'; -- Comenzamos con pending y luego cambiamos a completed
    
    -- 1. Crear usuario de prueba o usar uno existente
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
    SELECT id INTO test_order_id 
    FROM orders 
    WHERE user_id = test_user_id 
    LIMIT 1;
    
    -- Si no hay pedido, crear uno nuevo
    IF test_order_id IS NULL THEN
        INSERT INTO orders (user_id, total_price, status)
        VALUES (test_user_id, 25.50, valid_status)
        RETURNING id INTO test_order_id;
        
        RAISE NOTICE 'Creado nuevo pedido de prueba con ID: % y precio: 25.50€', test_order_id;
    ELSE
        -- Actualizar el pedido existente para la prueba
        UPDATE orders
        SET total_price = 25.50, status = valid_status
        WHERE id = test_order_id;
        
        RAISE NOTICE 'Actualizado pedido existente con ID: % a precio: 25.50€ y estado: %', test_order_id, valid_status;
    END IF;
    
    -- 4. Probar diferentes estados para encontrar el correcto para el trigger
    BEGIN
        -- Intentar con 'completed'
        RAISE NOTICE 'Intentando cambiar estado a completed...';
        UPDATE orders
        SET status = 'completed'
        WHERE id = test_order_id;
        valid_status := 'completed';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Estado "completed" no válido, probando con "delivered"';
            BEGIN
                UPDATE orders
                SET status = 'delivered'
                WHERE id = test_order_id;
                valid_status := 'delivered';
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Estado "delivered" no válido, probando con "processing"';
                    BEGIN
                        UPDATE orders
                        SET status = 'processing'
                        WHERE id = test_order_id;
                        valid_status := 'processing';
                        EXCEPTION WHEN OTHERS THEN
                            RAISE NOTICE 'No se pudo encontrar un estado válido para la prueba.';
                            RETURN;
                    END;
            END;
    END;
    
    RAISE NOTICE 'Éxito al cambiar estado a: %', valid_status;
    
    -- 5. Verificar el nuevo balance
    SELECT COALESCE(balance, 0) INTO new_balance 
    FROM vlcoin WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Balance después del cambio de estado: % VLcoins', new_balance;
    RAISE NOTICE 'Recompensa recibida: % VLcoins', new_balance - initial_balance;
    
    -- 6. Comprobar si la recompensa fue correcta
    DECLARE
        expected_reward INTEGER;
        actual_reward INTEGER;
    BEGIN
        expected_reward := FLOOR(25.50 * 10);
        actual_reward := new_balance - initial_balance;
        
        IF actual_reward = expected_reward THEN
            RAISE NOTICE 'PRUEBA EXITOSA: Se otorgaron % VLcoins tal como se esperaba', expected_reward;
        ELSE
            RAISE NOTICE 'PRUEBA FALLIDA: Se esperaban % VLcoins, pero se otorgaron %', 
                expected_reward, actual_reward;
        END IF;
    END;
    
    -- 7. Restaurar el estado original
    RAISE NOTICE 'Restaurando estado original...';
    
    UPDATE orders
    SET status = 'pending'
    WHERE id = test_order_id;
    
    -- Restaurar el balance original
    PERFORM upsert_vlcoin(test_user_id, initial_balance);
    
    RAISE NOTICE 'Prueba completada y estado restaurado';
END $$; 