import mapboxgl from 'mapbox-gl';

// Token de Mapbox 
const MAPBOX_TOKEN = 'pk.eyJ1IjoianVhbmpvc2VydWl6IiwiYSI6ImNtOWlkdmdjYTAxNWIyanF3Mmg4NmJjeDkifQ.i1uWtbQazE35o9Vtyv_oBA';

// Configurar token de Mapbox globalmente
mapboxgl.accessToken = MAPBOX_TOKEN;
console.log('Mapbox token configurado globalmente:', mapboxgl.accessToken); 