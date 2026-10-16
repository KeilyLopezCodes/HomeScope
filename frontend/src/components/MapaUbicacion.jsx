import React, { useState } from 'react';
import { MapContainer as MapReact, TileLayer as TileReact, Marker as MarkerReact, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Corregir icono por defecto de Leaflet en React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Coordenadas centrales por defecto (Guatemala)
const GUATEMALA_CENTER = [14.634915, -90.506882];

function ManejadorArrastre({ posicion, setPosicion, onCoordenadasChange }) {
  useMapEvents({
    click(e) {
      const nuevaPos = [e.latlng.lat, e.latlng.lng];
      setPosicion(nuevaPos);
      if (onCoordenadasChange) onCoordenadasChange(e.latlng.lat, e.latlng.lng);
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
          setPosicion([pos.lat, pos.lng]);
          if (onCoordenadasChange) onCoordenadasChange(pos.lat, pos.lng);
        }
      }}
    />
  );
}

export default function MapaUbicacion({ onCoordenadasChange }) {
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
          />
        </MapReact>
      </div>
      <p className="text-xs text-gray-500">
        Coordenadas seleccionadas: Lat: {posicion[0].toFixed(5)}, Lng: {posicion[1].toFixed(5)}
      </p>
    </div>
  );
}