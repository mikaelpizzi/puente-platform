import React, { useState, useEffect } from 'react';
import { PosKeypad } from './PosKeypad';
import { PaymentQR } from './PaymentQR';
import { useCreateOrderMutation, useGetOrderStatusQuery } from './financeApi';

export interface PaymentFlowProps {
  initialAmount?: number;
  onBack?: () => void;
  onComplete?: () => void;
}

export const PaymentFlow: React.FC<PaymentFlowProps> = ({ initialAmount, onBack, onComplete }) => {
  const [step, setStep] = useState<'AMOUNT' | 'QR' | 'SUCCESS'>(initialAmount ? 'QR' : 'AMOUNT');
  const [amount, setAmount] = useState(initialAmount ? initialAmount.toString() : '');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // API Mutations
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();

  // Polling Query
  // Only poll if we have an Order ID and we are in the QR step
  const { data: orderStatus, stopPolling } = useGetOrderStatusQuery(currentOrderId!, {
    skip: !currentOrderId || step !== 'QR',
    pollingInterval: 5000, // Poll every 5s
  });

  // Auto-create order if initialAmount is provided and we haven't created one yet
  useEffect(() => {
    if (initialAmount && step === 'QR' && !currentOrderId && !isCreating) {
      createOrder({
        amount: initialAmount,
        description: 'Venta desde Carrito',
      })
        .unwrap()
        .then((result) => setCurrentOrderId(result.id))
        .catch((err) => {
          console.error('Error creating order:', err);
          alert('Error al generar la orden.');
          if (onBack) onBack();
        });
    }
  }, [initialAmount, step, currentOrderId, isCreating, createOrder, onBack]);

  // Effect: Handle Status Changes
  useEffect(() => {
    if (orderStatus?.status === 'PAID') {
      setStep('SUCCESS');
      // Haptic Feedback for Success
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    }
  }, [orderStatus]);

  // Effect: Handle Visibility Change (Screen Off/On)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && step === 'QR' && currentOrderId) {
        // Force a refetch when coming back to foreground to check status immediately
        // RTK Query handles polling resume automatically, but a manual refetch is good for UX
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [step, currentOrderId]);

  const handleKeyPress = (key: string) => {
    if (key === '.' && amount.includes('.')) return;
    if (amount.length >= 8) return; // Max length
    // Prevent multiple leading zeros
    if (amount === '0' && key !== '.') {
      setAmount(key);
      return;
    }
    setAmount((prev) => prev + key);
  };

  const handleClear = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  const handleSubmitAmount = async () => {
    try {
      const result = await createOrder({
        amount: parseFloat(amount),
        description: 'Venta en mostrador',
      }).unwrap();

      setCurrentOrderId(result.id);
      setStep('QR');
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Error al generar la orden. Intente nuevamente.');
    }
  };

  const handleCancel = () => {
    if (onBack) {
      onBack();
    } else {
      setStep('AMOUNT');
      setCurrentOrderId(null);
    }
    // Ideally call an API to cancel the order on backend too
  };

  const handleReset = () => {
    if (onComplete) {
      onComplete();
    } else {
      setStep('AMOUNT');
      setAmount('');
      setCurrentOrderId(null);
    }
  };

  if (step === 'AMOUNT') {
    return (
      <PosKeypad
        amount={amount}
        onKeyPress={handleKeyPress}
        onClear={handleClear}
        onSubmit={handleSubmitAmount}
        isLoading={isCreating}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {onBack && step === 'QR' && (
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
};
