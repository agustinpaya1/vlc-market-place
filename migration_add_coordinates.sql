-- Añadir columnas de coordenadas a la tabla de tiendas
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Actualizar tiendas existentes con coordenadas (Valencia, España)
UPDATE stores 
SET 
    latitude = 39.469 + (random() * 0.02 - 0.01),
    longitude = -0.376 + (random() * 0.02 - 0.01),
    address = CASE 
        WHEN category = 'Mercado' THEN 'Calle del Mercado, ' || floor(random() * 100)::text
        WHEN category = 'Panadería' THEN 'Avenida de la Constitución, ' || floor(random() * 100)::text
        WHEN category = 'Frutas y Verduras' THEN 'Plaza Mayor, ' || floor(random() * 20)::text
        WHEN category = 'Carnicería' THEN 'Calle Mayor, ' || floor(random() * 50)::text
        WHEN category = 'Pescadería' THEN 'Calle del Mar, ' || floor(random() * 30)::text
        WHEN category = 'Supermercado' THEN 'Avenida del Puerto, ' || floor(random() * 80)::text
        WHEN category = 'Bodega' THEN 'Calle del Vino, ' || floor(random() * 40)::text
        WHEN category = 'Especialidad' THEN 'Calle Colón, ' || floor(random() * 60)::text
        ELSE 'Gran Vía, ' || floor(random() * 100)::text
    END,
    contact_phone = '+34 9' || floor(random() * 10)::text || floor(random() * 10)::text || ' ' || 
                   floor(random() * 10)::text || floor(random() * 10)::text || floor(random() * 10)::text || ' ' || 
                   floor(random() * 10)::text || floor(random() * 10)::text || floor(random() * 10)::text
WHERE latitude IS NULL;

-- Insertar nuevas tiendas de ejemplo si no hay suficientes
INSERT INTO stores (name, description, category, image_url, location_text, open_time, rating, latitude, longitude, address, contact_phone)
SELECT 
    'Tienda ' || i || ' ' || CASE 
                                WHEN i % 7 = 0 THEN 'Mercado'
                                WHEN i % 7 = 1 THEN 'Panadería'
                                WHEN i % 7 = 2 THEN 'Frutas y Verduras'
                                WHEN i % 7 = 3 THEN 'Carnicería'
                                WHEN i % 7 = 4 THEN 'Pescadería'
                                WHEN i % 7 = 5 THEN 'Supermercado'
                                WHEN i % 7 = 6 THEN 'Especialidad'
                             END,
    'Descripción de la tienda ' || i,
    CASE 
        WHEN i % 7 = 0 THEN 'Mercado'
        WHEN i % 7 = 1 THEN 'Panadería'
        WHEN i % 7 = 2 THEN 'Frutas y Verduras'
        WHEN i % 7 = 3 THEN 'Carnicería'
        WHEN i % 7 = 4 THEN 'Pescadería'
        WHEN i % 7 = 5 THEN 'Supermercado'
        WHEN i % 7 = 6 THEN 'Especialidad'
    END,
    CASE 
        WHEN i % 7 = 0 THEN 'mercado-default.jpg'
        WHEN i % 7 = 1 THEN 'panaderia-default.jpg'
        WHEN i % 7 = 2 THEN 'fruteria-default.jpg'
        WHEN i % 7 = 3 THEN 'carniceria-default.jpg'
        WHEN i % 7 = 4 THEN 'pescaderia-default.jpg'
        WHEN i % 7 = 5 THEN 'supermercado-default.jpg'
        WHEN i % 7 = 6 THEN 'tienda-default.jpg'
    END,
    'Valencia, España',
    CASE 
        WHEN i % 3 = 0 THEN '8:00 - 20:00'
        WHEN i % 3 = 1 THEN '9:00 - 21:00'
        WHEN i % 3 = 2 THEN '7:30 - 19:30'
    END,
    round((random() * 3 + 2)::numeric, 1),
    39.469 + (random() * 0.02 - 0.01),
    -0.376 + (random() * 0.02 - 0.01),
    CASE 
        WHEN i % 7 = 0 THEN 'Calle del Mercado, ' || floor(random() * 100)::text
        WHEN i % 7 = 1 THEN 'Avenida de la Constitución, ' || floor(random() * 100)::text
        WHEN i % 7 = 2 THEN 'Plaza Mayor, ' || floor(random() * 20)::text
        WHEN i % 7 = 3 THEN 'Calle Mayor, ' || floor(random() * 50)::text
        WHEN i % 7 = 4 THEN 'Calle del Mar, ' || floor(random() * 30)::text
        WHEN i % 7 = 5 THEN 'Avenida del Puerto, ' || floor(random() * 80)::text
        WHEN i % 7 = 6 THEN 'Calle Colón, ' || floor(random() * 60)::text
    END,
    '+34 9' || floor(random() * 10)::text || floor(random() * 10)::text || ' ' || 
    floor(random() * 10)::text || floor(random() * 10)::text || floor(random() * 10)::text || ' ' || 
    floor(random() * 10)::text || floor(random() * 10)::text || floor(random() * 10)::text
FROM generate_series(1, 15) i
WHERE (SELECT COUNT(*) FROM stores) < 15;

-- Insertar productos para las tiendas recién creadas
INSERT INTO products (name, description, price, image_url, category, stock, store_id)
SELECT 
    CASE 
        WHEN s.category = 'Mercado' THEN 
            CASE WHEN random() < 0.33 THEN 'Tomates' 
                 WHEN random() < 0.66 THEN 'Plátanos' 
                 ELSE 'Naranjas' END
        WHEN s.category = 'Panadería' THEN 
            CASE WHEN random() < 0.33 THEN 'Pan de pueblo' 
                 WHEN random() < 0.66 THEN 'Croissant' 
                 ELSE 'Baguette' END
        WHEN s.category = 'Frutas y Verduras' THEN 
            CASE WHEN random() < 0.33 THEN 'Manzanas' 
                 WHEN random() < 0.66 THEN 'Lechugas' 
                 ELSE 'Pimientos' END
        WHEN s.category = 'Carnicería' THEN 
            CASE WHEN random() < 0.33 THEN 'Lomo de cerdo' 
                 WHEN random() < 0.66 THEN 'Pechuga de pollo' 
                 ELSE 'Carne picada' END
        WHEN s.category = 'Pescadería' THEN 
            CASE WHEN random() < 0.33 THEN 'Merluza' 
                 WHEN random() < 0.66 THEN 'Gambas' 
                 ELSE 'Salmón' END
        WHEN s.category = 'Supermercado' THEN 
            CASE WHEN random() < 0.33 THEN 'Leche' 
                 WHEN random() < 0.66 THEN 'Arroz' 
                 ELSE 'Pasta' END
        WHEN s.category = 'Especialidad' THEN 
            CASE WHEN random() < 0.33 THEN 'Queso manchego' 
                 WHEN random() < 0.66 THEN 'Jamón ibérico' 
                 ELSE 'Aceite de oliva' END
        ELSE 'Producto genérico'
    END || ' ' || i,
    'Descripción del producto ' || i,
    round((random() * 15 + 1)::numeric, 2),
    'producto-default.jpg',
    s.category,
    floor(random() * 100 + 10)::integer,
    s.id
FROM stores s, generate_series(1, 5) i
WHERE NOT EXISTS (
    SELECT 1 FROM products p WHERE p.store_id = s.id
); 