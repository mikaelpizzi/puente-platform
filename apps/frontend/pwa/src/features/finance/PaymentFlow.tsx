import React, { useState, useEffect } from 'react';
import { PosKeypad } from './PosKeypad';
import { PaymentQR } from './PaymentQR';
import { useCreateOrderMutation, useGetOrderStatusQuery } from './financeApi';
import toast from 'react-hot-toast';

export interface PaymentFlowProps {
  initialAmount?: number;
  onBack?: () => void;
  onComplete?: () => void;
}

export const PaymentFlow: React.FC<PaymentFlowProps> = ({ initialAmount, onBack, onComplete }) => {
  // 1. State Local: Controlamos el flujo con el ID de la orden actual
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [amount, setAmount] = useState(initialAmount ? initialAmount.toString() : '');

  // API Mutations
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();

  // Polling Query: Solo buscamos la orden actual si existe
  const { data: orderStatus } = useGetOrderStatusQuery(currentOrderId!, {
    skip: !currentOrderId,
    pollingInterval: 3000,
  });

  // Auto-create order if initialAmount is provided
  useEffect(() => {
    if (initialAmount && !currentOrderId && !isCreating) {
      createOrder({
        amount: initialAmount,
        description: 'Venta desde Carrito',
      })
        .unwrap()
        .then((result) => setCurrentOrderId(result.id))
        .catch((err) => {
          console.error('Error creating order:', err);
          toast.error('Error al generar la orden');
          if (onBack) onBack();
        });
    }
  }, [initialAmount, currentOrderId, isCreating, createOrder, onBack]);

  // Haptic Feedback on Success
  useEffect(() => {
    if (orderStatus?.status === 'PAID' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }, [orderStatus?.status]);

  const handleKeyPress = (key: string) => {
    if (key === '.' && amount.includes('.')) return;
    if (amount.length >= 8) return;
    if (amount === '0' && key !== '.') {
      setAmount(key);
      return;
    }
    setAmount((prev) => prev + key);
  };

  const handleClear = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  // 2. Al Crear: Guardamos el ID en el estado local
  const handleSubmitAmount = async () => {
    try {
      const result = await createOrder({
        amount: parseFloat(amount),
        description: 'Venta en mostrador',
      }).unwrap();

      setCurrentOrderId(result.id);
    } catch (err) {
      console.error('Error creating order:', err);
      toast.error('Error al generar la orden');
    }
  };

  const handleCancel = () => {
    if (onBack) {
      onBack();
    } else {
      setCurrentOrderId(null);
    }
  };

  // 4. Reset: Limpiamos el estado para una nueva venta
  const handleReset = () => {
    setCurrentOrderId(null);
    setAmount('');
    if (onComplete) {
      onComplete();
    }
  };

  // 3. Renderizado Condicional: Si hay orden, mostramos QR/Éxito. Si no, el teclado.
  if (currentOrderId) {
    return (
      <div className="h-full flex flex-col">
        {onBack && (
          <button onClick={onBack} className="p-4 text-white bg-gray-900 font-bold">
            &larr; Volver
          </button>
        )}
        <PaymentQR
          qrData={
            orderStatus?.qrCode ||
            orderStatus?.paymentLink ||
            `https://puente.app/pay/${currentOrderId}`
          }
          amount={parseFloat(amount)}
          status={orderStatus?.status || 'PENDING'}
          onCancel={handleCancel}
          onReset={handleReset}
        />
      </div>
    );
  }

  return (
    <PosKeypad
      amount={amount}
      onKeyPress={handleKeyPress}
      onClear={handleClear}
      onSubmit={handleSubmitAmount}
      isLoading={isCreating}
    />
  );
};
