import React from 'react';

export type AddressLabel = 'home' | 'work' | 'other';

interface SavedAddress {
  _id: string;
  label: AddressLabel;
  customName?: string;
  street: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  phone?: string;
}

interface AddressSelectorProps {
  addresses: SavedAddress[];
  selectedId?: string;
  onSelect: (address: SavedAddress) => void;
  onAddNew: () => void;
  isLoading?: boolean;
}

/**
 * Get label display text.
 */
const getLabelDisplay = (label: AddressLabel, customName?: string): string => {
  if (label === 'home') return '🏠 Casa';
  if (label === 'work') return '💼 Trabajo';
  return customName ? `📍 ${customName}` : '📍 Otro';
};

/**
 * Address selector for checkout flow.
 * Displays saved addresses and allows selection.
 */
export const AddressSelector: React.FC<AddressSelectorProps> = ({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="address-selector loading">
        <div className="spinner" />
        <p>Cargando direcciones...</p>
      </div>
    );
  }

  return (
    <div className="address-selector">
      <div className="selector-header">
        <h4>Dirección de entrega</h4>
        <button type="button" onClick={onAddNew} className="add-new-button">
          + Agregar nueva
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="no-addresses">
          <p>No tienes direcciones guardadas</p>
          <button type="button" onClick={onAddNew} className="add-first-button">
            Agregar primera dirección
          </button>
        </div>
      ) : (
        <div className="addresses-list">
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`address-item ${selectedId === address._id ? 'selected' : ''}`}
              onClick={() => onSelect(address)}
              role="radio"
              aria-checked={selectedId === address._id}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(address)}
            >
              <div className="address-radio">
                <span className={`radio-circle ${selectedId === address._id ? 'checked' : ''}`} />
              </div>
              <div className="address-content">
                <div className="address-label">
                  {getLabelDisplay(address.label, address.customName)}
                  {address.isDefault && <span className="default-badge">Predeterminada</span>}
                </div>
                <div className="address-street">{address.street}</div>
                <div className="address-city">
                  {address.city}, {address.state}
                </div>
                {address.phone && <div className="address-phone">📞 {address.phone}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .address-selector {
          margin-bottom: 1.5rem;
        }
        .address-selector.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          color: #6b7280;
        }
        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #e5e7eb;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .selector-header h4 {
          margin: 0;
          font-size: 1rem;
          color: #1a1a2e;
        }
        .add-new-button {
          background: none;
          border: none;
          color: #6366f1;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .add-new-button:hover {
          text-decoration: underline;
        }
        .no-addresses {
          text-align: center;
          padding: 2rem 1rem;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px dashed #d1d5db;
        }
        .no-addresses p {
          margin: 0 0 1rem;
          color: #6b7280;
        }
        .add-first-button {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9375rem;
          font-weight: 500;
        }
        .addresses-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .address-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .address-item:hover {
          border-color: #c7d2fe;
          background: #fafafa;
        }
        .address-item.selected {
          border-color: #6366f1;
          background: #eff6ff;
        }
        .address-radio {
          display: flex;
          align-items: flex-start;
          padding-top: 0.125rem;
        }
        .radio-circle {
          width: 18px;
          height: 18px;
          border: 2px solid #d1d5db;
          border-radius: 50%;
          position: relative;
        }
        .radio-circle.checked {
          border-color: #6366f1;
        }
        .radio-circle.checked::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 8px;
          height: 8px;
          background: #6366f1;
          border-radius: 50%;
        }
        .address-content {
          flex: 1;
        }
        .address-label {
          font-weight: 600;
          font-size: 0.9375rem;
          color: #111827;
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .default-badge {
          font-size: 0.625rem;
          font-weight: 600;
          background: #dcfce7;
          color: #15803d;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .address-street {
          font-size: 0.875rem;
          color: #374151;
        }
        .address-city {
          font-size: 0.8125rem;
          color: #6b7280;
        }
        .address-phone {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
};

export default AddressSelector;
