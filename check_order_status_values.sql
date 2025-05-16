-- Script para verificar los valores permitidos en la columna status de orders

-- Verificar la restricción check
SELECT pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE t.relname = 'orders'
AND c.conname = 'orders_status_check'
AND n.nspname = 'public';

-- Obtener los valores únicos que están actualmente en uso
SELECT DISTINCT status FROM orders WHERE status IS NOT NULL;

-- Verificar por otros posibles estados utilizados en la aplicación
SELECT column_name, data_type, character_maximum_length, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'status';

-- Ver un ejemplo de registro para entender la estructura
SELECT * FROM orders LIMIT 1; 