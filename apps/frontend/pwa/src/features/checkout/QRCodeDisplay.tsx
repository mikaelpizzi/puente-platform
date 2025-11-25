import React from 'react';
import QRCode from 'react-qr-code';

interface QRCodeDisplayProps {
  value: string;
  title?: string;
  amount?: number;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ value, title, amount }) => {
  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg animate-fade-in">
      {title && <h3 className="text-lg font-bold mb-4 text-gray-800">{title}</h3>}
      <div className="p-4 bg-white border-2 border-gray-100 rounded-lg">
        <QRCode value={value} size={200} />
      </div>
      {amount && (
        <div className="mt-4 text-2xl font-bold text-indigo-600">${amount.toFixed(2)}</div>
      )}
      <p className="mt-2 text-sm text-gray-500 text-center">Escanea para pagar</p>
    </div>
  );
};
