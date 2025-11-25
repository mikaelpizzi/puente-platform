import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Webpack/Vite
// We need to manually import the images and set them as default
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Create a custom icon instance to avoid issues with the default one
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

// Apply it globally
L.Marker.prototype.options.icon = DefaultIcon;

export interface Location {
  lat: number;
  lng: number;
}

interface DeliveryMapProps {
  pickup?: Location;
  dropoff?: Location;
  courierLocation?: Location;
  className?: string;
}

// Component to update map center when courier moves
const RecenterMap: React.FC<{ location?: Location }> = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], map.getZoom());
    }
  }, [location, map]);
  return null;
};

export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  pickup,
  dropoff,
  courierLocation,
  className,
}) => {
  // Default center (e.g., Mexico City) if no location is provided
  const defaultCenter = { lat: 19.4326, lng: -99.1332 };
  const center = courierLocation || defaultCenter;

  return (
    <div className={`h-full w-full relative z-0 ${className || ''}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {courierLocation && (
          <>
            <Marker position={[courierLocation.lat, courierLocation.lng]}>
              <Popup>Tu ubicación</Popup>
            </Marker>
            <RecenterMap location={courierLocation} />
          </>
        )}

        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]}>
            <Popup>Recolección</Popup>
          </Marker>
        )}

        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]}>
            <Popup>Entrega</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
