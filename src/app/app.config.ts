// Importar Mapbox GL sin asignarlo a una variable
import 'mapbox-gl';

// Token de Mapbox 
const MAPBOX_TOKEN = 'pk.eyJ1IjoianVhbmpvc2VydWl6IiwiYSI6ImNtOWlkdmdjYTAxNWIyanF3Mmg4NmJjeDkifQ.i1uWtbQazE35o9Vtyv_oBA';

// Acceder a mapboxgl a través del objeto window
const mapboxgl = (window as any).mapboxgl;

// Configurar token de Mapbox globalmente
if (mapboxgl) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
  console.log('Mapbox token configurado globalmente:', mapboxgl.accessToken);
} else {
  console.warn('mapboxgl no está disponible en window, el token no se ha configurado');
} 