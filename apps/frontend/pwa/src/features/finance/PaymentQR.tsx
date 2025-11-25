import React from 'react';
import QRCode from 'react-qr-code';
import { CheckCircle, Loader2, Share2 } from 'lucide-react';

interface PaymentQRProps {
  qrData: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  onCancel: () => void;
  onReset: () => void;
}

export const PaymentQR: React.FC<PaymentQRProps> = ({
  qrData,
  amount,
  status,
  onCancel,
  onReset,
}) => {
  if (status === 'PAID') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-green-50 dark:bg-green-900/20 animate-in fade-in zoom-in duration-500 transition-colors duration-200">
        <div className="w-32 h-32 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle className="w-20 h-20 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-green-800 dark:text-green-300 mb-2">
          ¡Pago Exitoso!
        </h2>
        <p className="text-green-600 dark:text-green-400 text-lg mb-8">
          Se han recibido ${amount.toFixed(2)}
        </p>
        <button
          onClick={onReset}
          className="w-full max-w-xs bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg transition-colors"
        >
          Nuevo Cobro
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-6 text-center">
        <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total a Pagar</p>
        <h2 className="text-4xl font-bold text-white">${amount.toFixed(2)}</h2>
      </div>

      {/* QR Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-4 rounded-2xl shadow-2xl mb-8">
          <QRCode
            value={qrData}
            size={256}
            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
            viewBox={`0 0 256 256`}
          />
        </div>

        <div className="flex items-center gap-3 text-indigo-300 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium">Esperando pago del cliente...</span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 space-y-3">
        <button
          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          onClick={() => {
            if (navigator.share) {
              navigator
                .share({
                  title: 'Enlace de Pago',
                  text: `Paga $${amount} aquí:`,
                  url: qrData,
                })
                .catch(console.error);
            } else {
              alert('Compartir no soportado en este navegador');
            }
          }}
        >
          <Share2 size={18} /> Compartir Enlace
        </button>

        <button
          onClick={onCancel}
          className="w-full text-red-400 hover:text-red-300 font-medium py-3 transition-colors"
        >
          Cancelar Cobro
        </button>
      </div>
    </div>
  );
};
