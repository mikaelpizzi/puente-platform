import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PosKeypad } from './PosKeypad';
import { PaymentQR } from './PaymentQR';
import { useCreateOrderMutation, useGetOrderStatusQuery } from './financeApi';
import { selectCurrentUser } from '../auth/authSlice';
import { CartItem } from '../checkout/cartSlice';
import toast from 'react-hot-toast';

export interface PaymentFlowProps {
  initialAmount?: number;
  cartItems?: CartItem[];
  onBack?: () => void;
  onComplete?: () => void;
}

export const PaymentFlow: React.FC<PaymentFlowProps> = ({
  initialAmount,
  cartItems,
  onBack,
  onComplete,
}) => {
  // 1. State Local: Controlamos el flujo con el ID de la orden actual
  const user = useSelector(selectCurrentUser);

  // Initialize state from localStorage if available
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(() => {
    return localStorage.getItem('pos_current_order_id');
  });

  const [amount, setAmount] = useState(initialAmount ? initialAmount.toString() : '');
  const hasAttemptedAutoCreate = React.useRef(false);

  // Persist currentOrderId to localStorage whenever it changes
  useEffect(() => {
    if (currentOrderId) {
      localStorage.setItem('pos_current_order_id', currentOrderId);
    } else {
      localStorage.removeItem('pos_current_order_id');
    }
  }, [currentOrderId]);

  // API Mutations
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();

  // Polling Query: Solo buscamos la orden actual si existe
  const { data: orderStatus } = useGetOrderStatusQuery(currentOrderId!, {
    skip: !currentOrderId,
    pollingInterval: 3000,
  });

  // Auto-create order if initialAmount is provided
  useEffect(() => {
    // Only auto-create if we don't already have an active order ID (from state or localStorage)
    if (initialAmount && !currentOrderId && !isCreating && !hasAttemptedAutoCreate.current) {
      hasAttemptedAutoCreate.current = true;

      const items =
        cartItems && cartItems.length > 0
          ? cartItems.map((item) => ({
              productId: String(item.id),
              quantity: item.quantity,
              price: item.price,
            }))
          : [{ productId: 'manual-pos', quantity: 1, price: initialAmount }];

      createOrder({
        sellerId: user?.id || 'unknown',
        items,
      })
        .unwrap()
        .then((result) => setCurrentOrderId(result.id))
        .catch((err) => {
          console.error('Error creating order:', err);
          const errorMessage = err.data?.message
            ? Array.isArray(err.data.message)
              ? err.data.message.join(', ')
              : err.data.message
            : 'Error desconocido';
          toast.error(`Error: ${errorMessage}`);
          if (onBack) onBack();
        });
    }
  }, [initialAmount, currentOrderId, isCreating, createOrder, onBack, cartItems, user]);

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
        sellerId: user?.id || 'unknown',
        items: [{ productId: 'manual-pos', quantity: 1, price: parseFloat(amount) }],
      }).unwrap();

      setCurrentOrderId(result.id);
    } catch (err: any) {
      console.error('Error creating order:', err);
      const errorMessage = err.data?.message
        ? Array.isArray(err.data.message)
          ? err.data.message.join(', ')
          : err.data.message
        : 'Error desconocido';
      toast.error(`Error: ${errorMessage}`);
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
