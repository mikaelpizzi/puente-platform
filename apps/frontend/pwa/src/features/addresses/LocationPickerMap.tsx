import React, { useState, useCallback, useEffect, useRef } from 'react';

interface LocationPickerMapProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
}

/**
 * Simple map-based location picker using Leaflet.
 * Users can drag a pin to select their exact location.
 */
export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  initialLatitude,
  initialLongitude,
  onLocationChange,
}) => {
  // Default to Venezuela center
  const defaultLat = initialLatitude ?? 8.0;
  const defaultLng = initialLongitude ?? -66.0;

  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: defaultLat,
    lng: defaultLng,
  });
  const [isLoading, setIsLoading] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Get current location from browser
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocalización no disponible');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPosition(newPos);
        onLocationChange(newPos.lat, newPos.lng);

        // Update map and marker if initialized
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([newPos.lat, newPos.lng], 15);
          markerRef.current.setLatLng([newPos.lat, newPos.lng]);
        }

        setIsLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('No se pudo obtener la ubicación');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [onLocationChange]);

  // Initialize Leaflet map
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Dynamically import Leaflet
    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      // Fix default marker icon issue
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (mapRef.current) return; // Already initialized

      const map = L.map(mapContainerRef.current!).setView(
        [position.lat, position.lng],
        initialLatitude ? 15 : 6,
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const marker = L.marker([position.lat, position.lng], {
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const latlng = marker.getLatLng();
        setPosition({ lat: latlng.lat, lng: latlng.lng });
        onLocationChange(latlng.lat, latlng.lng);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
        onLocationChange(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="location-picker-container">
      <div className="location-picker-header">
        <label>📍 Ubicación exacta</label>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLoading}
          className="gps-button"
        >
          {isLoading ? '📍...' : '📍 Mi ubicación'}
        </button>
      </div>

      <div ref={mapContainerRef} className="map-container" />

      <div className="coordinates-display">
        <span>Lat: {position.lat.toFixed(6)}</span>
        <span>Lng: {position.lng.toFixed(6)}</span>
      </div>

      <p className="map-help">Arrastra el pin o haz clic en el mapa para ajustar la ubicación</p>

      <style>{`
        .location-picker-container {
          margin-bottom: 1rem;
        }
        .location-picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .location-picker-header label {
          font-weight: 600;
          color: #1a1a2e;
        }
        .gps-button {
          padding: 0.375rem 0.75rem;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8125rem;
        }
        .gps-button:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .map-container {
          height: 250px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        .coordinates-display {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
          font-family: monospace;
          font-size: 0.75rem;
          color: #6b7280;
        }
        .map-help {
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default LocationPickerMap;
