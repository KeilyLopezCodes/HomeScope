
import React, { useState } from 'react';
import { MapContainer as MapReact, TileLayer as TileReact, Marker as MarkerReact, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const GUATEMALA_CENTER = [14.634915, -90.506882];

function ManejadorArrastre({ posicion, setPosicion, onCoordenadasChange, onUbicacionDetectada }) {
  const consultarGeocoding = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`,
        { headers: { 'Accept-Language': 'es' } }
      );

      if (!response.ok) throw new Error('Error en coordenadas');

      const data = await response.json();

      if (data && onUbicacionDetectada) {
        const address = data.address || {};

        // Extraer departamento eliminando "Departamento de"
        let deptoRaw = address.state || address.province || address.county || '';
        deptoRaw = deptoRaw.replace(/departamento de/i, '').trim();

        // Extraer municipio
        let muniRaw = address.city || address.town || address.municipality || address.village || address.county || '';
        muniRaw = muniRaw.replace(/municipio de/i, '').trim();

        // Extraer zona/sector
        let zona = '1';
        const sectorTexto = address.suburb || address.neighbourhood || address.quarter || '';
        const matchZona = sectorTexto.match(/\d+/);
        if (matchZona) {
          zona = matchZona[0];
        } else if (sectorTexto) {
          zona = sectorTexto;
        }

        // Dirección formateada
        const direccion = data.display_name || '';

        onUbicacionDetectada({
          direccion,
          departamento: deptoRaw,
          municipio: muniRaw,
          zona
        });
      }
    } catch (error) {
      console.error('Error al autocompletar dirección:', error);
    }
  };

  const actualizarPosicion = (lat, lng) => {
    setPosicion([lat, lng]);
    if (onCoordenadasChange) onCoordenadasChange(lat, lng);
    consultarGeocoding(lat, lng);
  };

  useMapEvents({
    click(e) {
      actualizarPosicion(e.latlng.lat, e.latlng.lng);
    }
  });

  return (
    <MarkerReact
      draggable={true}
      position={posicion}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          actualizarPosicion(pos.lat, pos.lng);
        }
      }}
    />
  );
}

export default function MapaUbicacion({ onCoordenadasChange, onUbicacionDetectada }) {
  const [posicion, setPosicion] = useState(GUATEMALA_CENTER);
  const [capaSatelite, setCapaSatelite] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-[#222A33]">
          Ubicación en el mapa (Arrastra el pin para fijar la posición exacta)
        </label>
        <button
          type="button"
          onClick={() => setCapaSatelite(!capaSatelite)}
          className="text-xs bg-gray-100 border px-3 py-1 rounded-md text-[#1E4273] hover:bg-gray-200 font-medium"
        >
          {capaSatelite ? 'Vista Mapa / Calles' : 'Vista Satelital'}
        </button>
      </div>

      <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-300 relative z-0">
        <MapReact center={posicion} zoom={13} style={{ height: '100%', width: '100%' }}>
          {capaSatelite ? (
            <TileReact
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Esri World Imagery"
            />
          ) : (
            <TileReact
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />
          )}
          <ManejadorArrastre
            posicion={posicion}
            setPosicion={setPosicion}
            onCoordenadasChange={onCoordenadasChange}
            onUbicacionDetectada={onUbicacionDetectada}
          />
        </MapReact>
      </div>
      <p className="text-xs text-gray-500">
        Coordenadas seleccionadas: Lat: {posicion[0].toFixed(5)}, Lng: {posicion[1].toFixed(5)}
      </p>
    </div>
  );
}