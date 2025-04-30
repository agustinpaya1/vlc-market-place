const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Variables
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;
const PORT = process.env.PORT || 3000;

// HuggingFace API para sugerencias
app.post('/api/ai-suggestions', async (req, res) => {
  const { query } = req.body;
  
  if (!query || query.trim().length < 2) {
    return res.json({ suggestions: [] });
  }
  
  try {
    console.log(`Generando sugerencias para: "${query}"`);
    
    // Llamada a HuggingFace API
    const response = await fetch(
      "https://api-inference.huggingface.co/models/google/flan-t5-base",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${HF_TOKEN}`
        },
        body: JSON.stringify({
          inputs: `Genera 5 sugerencias de búsqueda para un mercado de alimentos basadas en: "${query}". 
                  Las sugerencias deben estar relacionadas con productos alimenticios, tiendas locales
                  o categorías de alimentos en Valencia. Responde SOLO con una lista de 5 elementos.`,
          parameters: {
            max_length: 200,
            temperature: 0.7
          }
        }),
      }
    );
    
    const result = await response.json();
    
    // Procesamiento de la respuesta
    if (result.error) {
      console.error("Error de HuggingFace:", result.error);
      throw new Error(result.error);
    }
    
    let suggestions = [];
    
    if (result.generated_text) {
      // Procesamos el texto generado para extraer las sugerencias
      suggestions = result.generated_text
        .split('\n')
        .map(line => line.replace(/^\d+\.?\s*/, '').trim()) // Elimina numeración
        .filter(line => line.length > 0)
        .slice(0, 5);
    }
    
    // Si no obtuvimos suficientes sugerencias, generamos algunas basadas en reglas
    if (suggestions.length < 3) {
      console.log("Pocas sugerencias de IA, usando fallback...");
      suggestions = generateFallbackSuggestions(query);
    }
    
    console.log("Sugerencias generadas:", suggestions);
    res.json({ suggestions });
    
  } catch (error) {
    console.error('Error al obtener sugerencias de HuggingFace:', error);
    
    // Usamos sugerencias de respaldo en caso de error
    const fallbackSuggestions = generateFallbackSuggestions(query);
    res.json({ suggestions: fallbackSuggestions });
  }
});

// Función para generar sugerencias de respaldo cuando la IA falla
function generateFallbackSuggestions(query) {
  // Categorías comunes de alimentos
  const categorias = ['Frutas', 'Verduras', 'Carnes', 'Lácteos', 'Panadería', 'Pescado', 
                      'Dulces', 'Vinos', 'Quesos', 'Embutidos', 'Especias'];
  
  // Productos populares
  const productos = ['Pan', 'Leche', 'Huevos', 'Queso', 'Jamón', 'Aceite de oliva', 
                    'Tomates', 'Manzanas', 'Naranjas', 'Pollo', 'Yogur', 'Arroz', 'Pasta'];
  
  // Adjetivos para combinar
  const adjetivos = ['fresco', 'local', 'artesanal', 'orgánico', 'gourmet', 'casero', 'tradicional', 'ecológico'];
  
  // Lugares
  const lugares = ['Valencia', 'Mercado Central', 'tiendas locales', 'mercado'];
  
  const suggestions = [];
  
  // 1. Búsqueda directa
  suggestions.push(`${query} en ${lugares[Math.floor(Math.random() * lugares.length)]}`);
  
  // 2. Con adjetivo
  const randomAdj = adjetivos[Math.floor(Math.random() * adjetivos.length)];
  suggestions.push(`${query} ${randomAdj}`);
  
  // 3. Mejor/ofertas
  suggestions.push(`Mejor ${query} en Valencia`);
  suggestions.push(`${query} en oferta`);
  
  // 4. Categoría relacionada (si coincide)
  const matchingCategories = categorias.filter(cat => 
    cat.toLowerCase().includes(query.toLowerCase()) || 
    query.toLowerCase().includes(cat.toLowerCase())
  );
  
  if (matchingCategories.length > 0) {
    suggestions.push(`${matchingCategories[0]} frescos`);
  } else {
    suggestions.push(`${query} de calidad`);
  }
  
  // Devolvemos 5 sugerencias únicas
  return [...new Set(suggestions)].slice(0, 5);
}

// Ruta de estado
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servicio de sugerencias IA activo' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor de sugerencias ejecutándose en puerto ${PORT}`);
  console.log(`Prueba la API: http://localhost:${PORT}/health`);
}); 