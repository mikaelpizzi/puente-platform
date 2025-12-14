import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLoginMutation } from './authApi';
import { useAppDispatch } from '../../app/hooks';
import { setCredentials } from './authSlice';
import toast from 'react-hot-toast';
import {
  Loader2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ChevronRight,
  UserPlus,
  Store,
  ShoppingBag,
  Truck,
} from 'lucide-react';

// Demo accounts from README.md
const DEMO_ACCOUNTS = [
  {
    id: 'maria',
    name: 'María Vendedora',
    email: 'maria_vendedora@puente.com',
    role: 'SELLER',
    icon: Store,
    color: 'bg-emerald-500',
    description: 'Gestiona inventario y ventas',
  },
  {
    id: 'carlos',
    name: 'Carlos Cliente',
    email: 'carlos_cliente@puente.com',
    role: 'BUYER',
    icon: ShoppingBag,
    color: 'bg-blue-500',
    description: 'Compra y recibe productos',
  },
  {
    id: 'luis',
    name: 'Luis Repartidor',
    email: 'luis_repartidor@puente.com',
    role: 'COURIER',
    icon: Truck,
    color: 'bg-purple-500',
    description: 'Entrega pedidos en tiempo real',
  },
];

const DEMO_PASSWORD = 'password123';

export const LoginPage: React.FC = () => {
  const [showAccountSelector, setShowAccountSelector] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleAccountSelect = async (account: (typeof DEMO_ACCOUNTS)[0]) => {
    // Auto-fill and submit with demo credentials
    const loadingToast = toast.loading(`Entrando como ${account.name}...`);

    try {
      const loginResponse = await login({
        email: account.email,
        password: DEMO_PASSWORD,
      }).unwrap();

      // Decode token to get user info
      const token = loginResponse.accessToken;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      const decoded = JSON.parse(jsonPayload);

      const user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        name: account.name,
      };

      dispatch(setCredentials({ user, token }));
      toast.success(`¡Bienvenido, ${account.name}!`, {
        id: loadingToast,
        style: { background: '#10B981', color: '#fff' },
        iconTheme: { primary: '#fff', secondary: '#10B981' },
      });

      // Role-based redirection
      if (user.role === 'SELLER') navigate('/inventory');
      else if (user.role === 'COURIER') navigate('/logistics');
      else if (user.role === 'BUYER') navigate('/marketplace');
      else navigate('/');
    } catch (err: any) {
      console.error('Failed to login:', err);
      let errorMessage = 'Error al iniciar sesión';
      if (err.status === 'FETCH_ERROR') {
        errorMessage = 'Error de conexión. Verifica que el backend esté corriendo.';
      } else if (err.data?.message) {
        errorMessage = err.data.message;
      }
      toast.error(errorMessage, { id: loadingToast });
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Iniciando sesión...');

    try {
      const loginResponse = await login({ email: email.trim(), password }).unwrap();

      const token = loginResponse.accessToken;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      const decoded = JSON.parse(jsonPayload);

      const user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        name: decoded.email.split('@')[0],
      };

      dispatch(setCredentials({ user, token }));
      toast.success(`¡Bienvenido de vuelta!`, { id: loadingToast });

      if (user.role === 'SELLER') navigate('/inventory');
      else if (user.role === 'COURIER') navigate('/logistics');
      else if (user.role === 'BUYER') navigate('/marketplace');
      else navigate('/');
    } catch (err: any) {
      console.error('Failed to login:', err);
      let errorMessage = 'Credenciales incorrectas';
      if (err.status === 'FETCH_ERROR') {
        errorMessage = 'Error de conexión. Verifica que el backend esté corriendo.';
      } else if (err.data?.message) {
        errorMessage = err.data.message;
      }
      toast.error(errorMessage, { id: loadingToast });
    }
  };

  // Account Selector View (Welcome Back)
  if (showAccountSelector) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20">
              <span className="text-white font-bold text-3xl">P</span>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Bienvenido
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">¿Quién eres hoy?</p>
          </div>

          {/* Account Cards */}
          <div className="space-y-3 mt-8">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon;
              return (
                <button
                  key={account.id}
                  onClick={() => handleAccountSelect(account)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div
                    className={`w-12 h-12 ${account.color} rounded-xl flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">{account.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {account.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        account.role === 'SELLER'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : account.role === 'BUYER'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}
                    >
                      {account.role}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Other account link */}
          <div className="pt-4 text-center">
            <button
              onClick={() => setShowAccountSelector(false)}
              className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Usar otra cuenta o registrarse
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Manual Login Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div>
          <div className="mx-auto h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Ingresa con tu cuenta
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleManualSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full pl-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link to="/register" className="text-sm text-emerald-600 hover:text-emerald-500">
              Crear cuenta
            </Link>
            <Link to="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-500">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/30 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                Ingresando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>

          {/* Back to account selector */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowAccountSelector(true)}
              className="text-sm text-gray-500 hover:text-emerald-600 transition-colors"
            >
              ← Volver a selección rápida
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
