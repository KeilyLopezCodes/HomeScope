const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const fetch = require('node-fetch');

const API_KEY = process.env.GOOGLE_MAPS_API_KEY ? process.env.GOOGLE_MAPS_API_KEY.trim() : '';

//Prueba de Geocoding API 
async function probarGeocoding() {
    const direccion = 'Guatemala';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(direccion)}&key=${API_KEY}`;
    
    console.log('--- Prueba de Geocoding API ---');
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Status de respuesta:', data.status);
        if (data.results && data.results.length > 0) {
            console.log('Coordenadas encontradas:', data.results[0].geometry.location);
        }
    } catch (error) {
        console.error('Error en Geocoding:', error);
    }
}

//Prueba de Places API 
async function probarPlaces() {
    const query = 'Restaurantes en Guatemala';
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;
    
    console.log('\n--- Prueba de Places API ---');
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Status de respuesta:', data.status);
        if (data.results && data.results.length > 0) {
            console.log('Lugar encontrado:', data.results[0].name);
            console.log('Dirección:', data.results[0].formatted_address);
        }
    } catch (error) {
        console.error('Error en Places:', error);
    }
}

async function ejecutarPruebas() {
    await probarGeocoding();
    console.log('-----------------------------------');
    await probarPlaces();
}

ejecutarPruebas();