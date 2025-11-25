import React from 'react';
import { Delete, ArrowRight } from 'lucide-react';

interface PosKeypadProps {
  amount: string;
  onKeyPress: (key: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export const PosKeypad: React.FC<PosKeypadProps> = ({
  amount,
  onKeyPress,
  onClear,
  onSubmit,
  isLoading,
}) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  const formatAmount = (val: string) => {
    if (!val) return '$0.00';
    const num = parseFloat(val);
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Display */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white dark:bg-gray-800 p-8 shadow-sm mb-1 transition-colors duration-200">
        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">
          Total a Cobrar
        </span>
        <div className="text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
          {amount ? `$${amount}` : '$0'}
          <span className="text-gray-300 dark:text-gray-600 text-4xl">.00</span>
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-px bg-gray-200 dark:bg-gray-700 p-px flex-grow max-h-[60vh] transition-colors duration-200">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 text-3xl font-semibold text-gray-700 dark:text-gray-200 py-6 flex items-center justify-center transition-colors"
          >
            {key}
          </button>
        ))}

        {/* Backspace Button */}
        <button
          onClick={onClear}
          className="bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/40 text-gray-500 dark:text-gray-400 py-6 flex items-center justify-center transition-colors"
        >
          <Delete size={32} />
        </button>
      </div>

      {/* Submit Button */}
      <div className="p-4 bg-white dark:bg-gray-800 transition-colors duration-200">
        <button
          onClick={onSubmit}
          disabled={!amount || parseFloat(amount) === 0 || isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white text-xl font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="animate-pulse">Generando Orden...</span>
          ) : (
            <>
              Cobrar <ArrowRight size={24} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
