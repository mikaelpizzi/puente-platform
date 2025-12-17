import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, MapPin, CreditCard, ArrowLeft, Trash2, CheckCircle } from 'lucide-react';
import { selectCartItems, selectCartTotal, clearCart, removeFromCart } from '../checkout/cartSlice';
import { useCreateOrderMutation } from '../orders/ordersApi';
import { useGetAddressesQuery } from '../addresses/addressesApi';
import toast from 'react-hot-toast';

export const BuyerCheckoutPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
  const { data: addresses } = useGetAddressesQuery();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [step, setStep] = useState<'cart' | 'address' | 'confirm' | 'success'>('cart');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const selectedAddress = addresses?.find((a: any) => a._id === selectedAddressId);

  const handleProceedToAddress = () => {
    if (cartItems.length === 0) {
      toast.error(t('checkout.emptyCart'));
      return;
    }
    setStep('address');
  };

  const handleProceedToConfirm = () => {
    if (!selectedAddressId) {
      toast.error(t('checkout.selectAddress'));
      return;
    }
    setStep('confirm');
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress || cartItems.length === 0) return;

    try {
      // Group items by seller (for now, we assume single seller - TODO: multi-seller orders)
      // Get sellerId from the first cart item (assumes all items from same seller)
      const orderData = {
        sellerId: cartItems[0].sellerId,
        items: cartItems.map((item) => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total,
        shippingAddress: {
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state || '',
          zipCode: selectedAddress.zipCode,
          country: selectedAddress.country,
        },
      };

      const order = await createOrder(orderData).unwrap();
      setCreatedOrderId(order._id);
      dispatch(clearCart());
      setStep('success');
      toast.success(t('checkout.orderSuccess'));
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.data?.message || t('errors.generic'));
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            ¡Pedido Realizado!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Tu pedido ha sido creado exitosamente. Puedes seguir su estado en "Mis Compras".
          </p>
          <div className="space-y-3">
            {createdOrderId && (
              <button
                onClick={() => navigate(`/orders/${createdOrderId}`)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5" />
                Ver Tracking
              </button>
            )}
            <button
              onClick={() => navigate('/orders')}
              className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium"
            >
              Ir a Mis Compras
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              className="w-full py-3 text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Seguir comprando
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => {
              if (step === 'cart') navigate('/marketplace');
              else if (step === 'address') setStep('cart');
              else if (step === 'confirm') setStep('address');
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {step === 'cart' && 'Tu Carrito'}
              {step === 'address' && 'Dirección de Envío'}
              {step === 'confirm' && 'Confirmar Pedido'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Paso {step === 'cart' ? 1 : step === 'address' ? 2 : 3} de 3
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {['cart', 'address', 'confirm'].map((s, index) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === s || ['cart', 'address', 'confirm'].indexOf(step) >= index
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {index + 1}
              </div>
              {index < 2 && (
                <div
                  className={`flex-1 h-1 ${
                    ['cart', 'address', 'confirm'].indexOf(step) > index
                      ? 'bg-emerald-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Cart Step */}
        {step === 'cart' && (
          <div className="space-y-4">
            {cartItems.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Tu carrito está vacío
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Explora el marketplace para agregar productos
                </p>
                <button
                  onClick={() => navigate('/marketplace')}
                  className="px-6 py-2 bg-emerald-500 text-white rounded-xl"
                >
                  Ir al Marketplace
                </button>
              </div>
            ) : (
              <>
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex items-center gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.quantity} x ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-600">
                      ${(item.quantity * item.price).toFixed(2)}
                    </span>
                    <button
                      onClick={() => dispatch(removeFromCart(item.id))}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleProceedToAddress}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  Continuar
                  <MapPin className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Address Step */}
        {step === 'address' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Selecciona una dirección de envío
                </h3>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  + Agregar nueva
                </button>
              </div>

              {!addresses || addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No tienes direcciones guardadas
                  </p>
                  <button
                    onClick={() => navigate('/profile')}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg"
                  >
                    Agregar dirección
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((address: any) => (
                    <div
                      key={address._id}
                      onClick={() => setSelectedAddressId(address._id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAddressId === address._id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                            selectedAddressId === address._id
                              ? 'border-emerald-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedAddressId === address._id && (
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {address.label === 'home'
                                ? '🏠 Casa'
                                : address.label === 'work'
                                  ? '💼 Trabajo'
                                  : address.customName || '📍 Otro'}
                            </span>
                            {address.isDefault && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                                Predeterminada
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {address.street}
                          </p>
                          <p className="text-sm text-gray-500">
                            {address.city}, {address.state}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleProceedToConfirm}
              disabled={!selectedAddressId}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              Continuar
              <CreditCard className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Confirm Step */}
        {step === 'confirm' && (
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Resumen del Pedido</h3>
              <div className="space-y-2 border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${(item.quantity * item.price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-900 dark:text-white">Total</span>
                <span className="text-xl font-bold text-emerald-600">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Shipping Address */}
            {selectedAddress && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Enviar a</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {selectedAddress.label && (
                    <span className="font-medium">{selectedAddress.label}: </span>
                  )}
                  {selectedAddress.street}, {selectedAddress.city}
                </p>
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={isCreatingOrder}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              {isCreatingOrder ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Confirmar Pedido
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
