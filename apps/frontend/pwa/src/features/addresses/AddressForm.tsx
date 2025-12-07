import React, { useState, useCallback } from 'react';
import { LocationPickerMap } from './LocationPickerMap';

export type AddressLabel = 'home' | 'work' | 'other';

interface AddressFormProps {
  initialData?: Partial<AddressFormData>;
  onSubmit: (data: AddressFormData) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
}

export interface AddressFormData {
  label: AddressLabel;
  customName?: string;
  street: string;
  city: string;
  state: string;
  zipCode?: string;
  details?: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  phone?: string;
  deliveryNotes?: string;
}

/**
 * Address form component with map-based coordinate selection.
 */
export const AddressForm: React.FC<AddressFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}) => {
  const [label, setLabel] = useState<AddressLabel>(initialData?.label || 'home');
  const [customName, setCustomName] = useState(initialData?.customName || '');
  const [street, setStreet] = useState(initialData?.street || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [state, setState] = useState(initialData?.state || '');
  const [zipCode, setZipCode] = useState(initialData?.zipCode || '');
  const [details, setDetails] = useState(initialData?.details || '');
  const [latitude, setLatitude] = useState(initialData?.latitude || 0);
  const [longitude, setLongitude] = useState(initialData?.longitude || 0);
  const [isDefault, setIsDefault] = useState(initialData?.isDefault || false);
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [deliveryNotes, setDeliveryNotes] = useState(initialData?.deliveryNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLocation = latitude !== 0 || longitude !== 0;

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  const handleSubmit = useCallback(async () => {
    // Validate required fields
    if (!street.trim()) {
      setError('La calle es requerida');
      return;
    }
    if (!city.trim()) {
      setError('La ciudad es requerida');
      return;
    }
    if (!state.trim()) {
      setError('El estado es requerido');
      return;
    }
    if (!hasLocation) {
      setError('Debes seleccionar la ubicación en el mapa');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        label,
        customName: customName.trim() || undefined,
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim() || undefined,
        details: details.trim() || undefined,
        latitude,
        longitude,
        isDefault,
        phone: phone.trim() || undefined,
        deliveryNotes: deliveryNotes.trim() || undefined,
      });
    } catch (err) {
      console.error('Error saving address:', err);
      setError('Error al guardar la dirección');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    label,
    customName,
    street,
    city,
    state,
    zipCode,
    details,
    latitude,
    longitude,
    isDefault,
    phone,
    deliveryNotes,
    hasLocation,
    onSubmit,
  ]);

  const labelOptions = [
    { value: 'home', label: '🏠 Casa', emoji: '🏠' },
    { value: 'work', label: '💼 Trabajo', emoji: '💼' },
    { value: 'other', label: '📍 Otro', emoji: '📍' },
  ];

  return (
    <div className="address-form">
      <h3>{isEditing ? 'Editar dirección' : 'Nueva dirección'}</h3>

      {error && <div className="form-error">{error}</div>}

      {/* Label selector */}
      <div className="form-group">
        <label>Tipo de dirección</label>
        <div className="label-buttons">
          {labelOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`label-button ${label === opt.value ? 'active' : ''}`}
              onClick={() => setLabel(opt.value as AddressLabel)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {label === 'other' && (
        <div className="form-group">
          <label htmlFor="customName">Nombre personalizado</label>
          <input
            id="customName"
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Ej: Casa de mamá, Oficina Centro..."
            maxLength={100}
          />
        </div>
      )}

      {/* Address fields */}
      <div className="form-group">
        <label htmlFor="street">Calle y número *</label>
        <input
          id="street"
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="Av. Libertador 123"
          required
          maxLength={200}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="city">Ciudad *</label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Caracas"
            required
            maxLength={100}
          />
        </div>
        <div className="form-group">
          <label htmlFor="state">Estado *</label>
          <input
            id="state"
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="Distrito Capital"
            required
            maxLength={100}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="zipCode">Código postal</label>
          <input
            id="zipCode"
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="1010"
            maxLength={20}
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Teléfono</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+58 412 123 4567"
            maxLength={20}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="details">Detalles (piso, apto, referencia)</label>
        <input
          id="details"
          type="text"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Piso 5, Apto 5B, al lado del banco"
          maxLength={200}
        />
      </div>

      {/* Map picker for coordinates */}
      <LocationPickerMap
        initialLatitude={initialData?.latitude}
        initialLongitude={initialData?.longitude}
        onLocationChange={handleLocationChange}
      />

      <div className="form-group">
        <label htmlFor="deliveryNotes">Notas para el courier</label>
        <textarea
          id="deliveryNotes"
          value={deliveryNotes}
          onChange={(e) => setDeliveryNotes(e.target.value)}
          placeholder="Portón azul, tocar timbre 2 veces..."
          rows={2}
          maxLength={500}
        />
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          Establecer como dirección predeterminada
        </label>
      </div>

      {/* Actions */}
      <div className="form-actions">
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
          className="submit-button"
          disabled={isSubmitting || !hasLocation}
        >
          {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar dirección'}
        </button>
      </div>

      <style>{`
        .address-form {
          max-width: 500px;
          padding: 1.5rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .address-form h3 {
          margin: 0 0 1.5rem;
          text-align: center;
          color: #1a1a2e;
        }
        .form-error {
          background: #fee2e2;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-group label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.375rem;
          font-size: 0.875rem;
        }
        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.625rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9375rem;
          font-family: inherit;
        }
        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .label-buttons {
          display: flex;
          gap: 0.5rem;
        }
        .label-button {
          flex: 1;
          padding: 0.625rem;
          background: #f3f4f6;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.15s ease;
        }
        .label-button:hover {
          background: #e5e7eb;
        }
        .label-button.active {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #1d4ed8;
        }
        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .checkbox-group input[type="checkbox"] {
          width: auto;
        }
        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .cancel-button {
          flex: 1;
          padding: 0.75rem;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
        }
        .submit-button {
          flex: 2;
          padding: 0.75rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
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
      `}</style>
    </div>
  );
};

export default AddressForm;
