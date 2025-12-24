import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Create default icon
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for different marker types
const createCustomIcon = (emoji: string, bgColor: string, size: number = 36) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${bgColor};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.5}px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">
        ${emoji}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const courierIcon = createCustomIcon('🛵', 'linear-gradient(135deg, #10b981, #059669)', 40);
const pickupIcon = createCustomIcon('📦', 'linear-gradient(135deg, #3b82f6, #2563eb)', 32);
const dropoffIcon = createCustomIcon('🏠', 'linear-gradient(135deg, #f59e0b, #d97706)', 32);

export interface Location {
  lat: number;
  lng: number;
}

interface DeliveryMapProps {
  pickup?: Location;
  dropoff?: Location;
  courierLocation?: Location;
  className?: string;
  showRoute?: boolean;
}

// Component to update map bounds to fit all markers
const FitBounds: React.FC<{ locations: Location[] }> = ({ locations }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;

    const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  }, [locations, map]);

  return null;
};

// Component to smoothly animate courier marker
const AnimatedCourierMarker: React.FC<{ location: Location }> = ({ location }) => {
  const map = useMap();

  useEffect(() => {
    // Pan to courier location with animation
    map.panTo([location.lat, location.lng], { animate: true, duration: 0.5 });
  }, [location, map]);

  return (
    <Marker position={[location.lat, location.lng]} icon={courierIcon}>
      <Popup>
        <div className="text-center">
          <span className="font-bold">🛵 Tu Repartidor</span>
          <br />
          <span className="text-xs text-gray-500">En camino hacia ti</span>
        </div>
      </Popup>
    </Marker>
  );
};

export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  pickup,
  dropoff,
  courierLocation,
  className,
  showRoute = true,
}) => {
  // Default center (e.g., Mexico City) if no location is provided
  const defaultCenter: Location = { lat: 19.4326, lng: -99.1332 };

  // Calculate center based on available locations
  const getCenter = (): Location => {
    if (courierLocation) return courierLocation;
    if (pickup && dropoff) {
      return {
        lat: (pickup.lat + dropoff.lat) / 2,
        lng: (pickup.lng + dropoff.lng) / 2,
      };
    }
    if (pickup) return pickup;
    if (dropoff) return dropoff;
    return defaultCenter;
  };

  const center = getCenter();

  // Collect all valid locations for bounds fitting
  const allLocations = [pickup, dropoff, courierLocation].filter(
    (loc): loc is Location => loc !== undefined,
  );

  // Create route polyline if we have pickup and dropoff
  const routePositions: [number, number][] = [];
  if (showRoute && pickup && dropoff) {
    if (courierLocation) {
      // Courier -> Dropoff (current leg)
      routePositions.push([courierLocation.lat, courierLocation.lng]);
      routePositions.push([dropoff.lat, dropoff.lng]);
    } else {
      // Full route: Pickup -> Dropoff
      routePositions.push([pickup.lat, pickup.lng]);
      routePositions.push([dropoff.lat, dropoff.lng]);
    }
  }

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

        {/* Fit bounds to show all markers */}
        {allLocations.length > 1 && <FitBounds locations={allLocations} />}

        {/* Route line */}
        {routePositions.length >= 2 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#10b981',
              weight: 4,
              opacity: 0.7,
              dashArray: '10, 10',
            }}
          />
        )}

        {/* Courier marker with animation */}
        {courierLocation && <AnimatedCourierMarker location={courierLocation} />}

        {/* Pickup marker */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <span className="font-bold">📦 Punto de Recolección</span>
            </Popup>
          </Marker>
        )}

        {/* Dropoff marker */}
        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
            <Popup>
              <span className="font-bold">🏠 Tu Dirección</span>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
