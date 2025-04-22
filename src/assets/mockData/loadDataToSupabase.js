const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar credenciales de Supabase (debes proporcionar tu URL y clave anónima)
const supabaseUrl = 'SUPABASE_URL';
const supabaseKey = 'SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Leer los datos de ejemplo
const storesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'storesData.json'), 'utf8'));
const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'productsData.json'), 'utf8'));

async function loadData() {
  console.log('Comenzando la carga de datos a Supabase...');

  // Insertar tiendas
  console.log('Insertando tiendas...');
  const { data: storesResult, error: storesError } = await supabase
    .from('stores')
    .insert(storesData)
    .select();

  if (storesError) {
    console.error('Error al insertar tiendas:', storesError);
    return;
  }

  console.log(`${storesResult.length} tiendas insertadas correctamente.`);

  // Mapear los IDs de las tiendas
  const storeIdMap = {};
  storesResult.forEach((store, index) => {
    const storeIdPlaceholder = `STORE_ID_${index + 1}`;
    storeIdMap[storeIdPlaceholder] = store.id;
  });

  // Reemplazar los IDs de placeholder en los productos
  const productsWithValidIds = productsData.map(product => {
    const storeId = storeIdMap[product.store_id];
    if (!storeId) {
      console.warn(`No se encontró ID para la tienda placeholder ${product.store_id}`);
      return null;
    }
    return {
      ...product,
      store_id: storeId
    };
  }).filter(Boolean); // Eliminar cualquier producto nulo

  // Insertar productos
  console.log('Insertando productos...');
  const { data: productsResult, error: productsError } = await supabase
    .from('products')
    .insert(productsWithValidIds)
    .select();

  if (productsError) {
    console.error('Error al insertar productos:', productsError);
    return;
  }

  console.log(`${productsResult.length} productos insertados correctamente.`);
  console.log('Carga de datos completada con éxito.');
}

// Ejecutar la carga de datos
loadData().catch(error => {
  console.error('Error inesperado durante la carga:', error);
}); 