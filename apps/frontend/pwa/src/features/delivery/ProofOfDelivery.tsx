import React, { useState, useCallback } from 'react';
import { SignatureCanvas } from './SignatureCanvas';
import { CameraCapture } from './CameraCapture';

interface ProofOfDeliveryProps {
  orderId: string;
  onSubmit: (data: ProofOfDeliveryData) => Promise<void>;
  onCancel?: () => void;
}

export interface ProofOfDeliveryData {
  photoBase64?: string;
  signatureBase64?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Proof of Delivery form component.
 * Allows courier to capture photo, signature, notes, and GPS location.
 */
export const ProofOfDelivery: React.FC<ProofOfDeliveryProps> = ({
  orderId,
  onSubmit,
  onCancel,
}) => {
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasEvidence = photoBase64 || signatureBase64;

  const getLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no disponible en este dispositivo');
      return;
    }

    setIsGettingLocation(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    } catch (err) {
      console.error('Error getting location:', err);
      setError('No se pudo obtener la ubicación. Verifica los permisos.');
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!hasEvidence) {
      setError('Debes capturar al menos una foto o firma');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data: ProofOfDeliveryData = {
        notes: notes || undefined,
        latitude: location?.lat,
        longitude: location?.lng,
      };

      if (photoBase64) {
        data.photoBase64 = photoBase64;
      }

      if (signatureBase64) {
        data.signatureBase64 = signatureBase64;
      }

      await onSubmit(data);
    } catch (err) {
      console.error('Error submitting POD:', err);
      setError('Error al enviar la prueba de entrega. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }, [hasEvidence, photoBase64, signatureBase64, notes, location, onSubmit]);

  return (
    <div className="pod-container">
      <div className="pod-header">
        <h2>Prueba de Entrega</h2>
        <p className="order-id">Pedido: #{orderId.slice(-8).toUpperCase()}</p>
      </div>

      {error && <div className="pod-error">{error}</div>}

      <div className="pod-section">
        <CameraCapture onPhotoCapture={setPhotoBase64} />
      </div>

      <div className="pod-section">
        <SignatureCanvas onSignatureChange={setSignatureBase64} />
      </div>

      <div className="pod-section">
        <label className="notes-label">📝 Notas (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Entregado en portería, recibió el vigilante..."
          className="notes-textarea"
          rows={3}
        />
      </div>

      <div className="pod-section location-section">
        <label className="location-label">📍 Ubicación</label>
        {location ? (
          <div className="location-captured">
            ✓ Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
          </div>
        ) : (
          <button
            type="button"
            onClick={getLocation}
            disabled={isGettingLocation}
            className="location-button"
          >
            {isGettingLocation ? 'Obteniendo ubicación...' : 'Capturar ubicación GPS'}
          </button>
        )}
      </div>

      <div className="pod-actions">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="cancel-button"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasEvidence || isSubmitting}
          className="submit-button"
        >
          {isSubmitting ? 'Enviando...' : 'Confirmar Entrega'}
        </button>
      </div>

      <style>{`
        .pod-container {
          max-width: 480px;
          margin: 0 auto;
          padding: 1.5rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .pod-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .pod-header h2 {
          margin: 0;
          color: #1a1a2e;
          font-size: 1.5rem;
        }
        .order-id {
          margin: 0.5rem 0 0;
          color: #666;
          font-size: 0.875rem;
          font-family: monospace;
        }
        .pod-error {
          background: #fee2e2;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        .pod-section {
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #eee;
        }
        .pod-section:last-of-type {
          border-bottom: none;
        }
        .notes-label,
        .location-label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #1a1a2e;
        }
        .notes-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          resize: vertical;
          font-family: inherit;
        }
        .notes-textarea:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .location-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .location-button {
          padding: 0.75rem 1rem;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        .location-button:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .location-captured {
          color: #22c55e;
          font-size: 0.875rem;
          font-family: monospace;
        }
        .pod-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .cancel-button {
          flex: 1;
          padding: 0.875rem;
          background: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
        }
        .submit-button {
          flex: 2;
          padding: 0.875rem;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
        }
        .submit-button:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }
        .submit-button:not(:disabled):hover {
          background: linear-gradient(135deg, #16a34a, #15803d);
        }
      `}</style>
    </div>
  );
};

export default ProofOfDelivery;
