import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../auth/authSlice';
import { User, Mail, Shield, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock update
    toast.success('Perfil actualizado correctamente');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock password change
    toast.success('Contraseña actualizada');
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <User className="w-6 h-6" />
        Mi Perfil
      </h2>

      <div className="space-y-6">
        {/* Personal Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Información Personal
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 p-2.5"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed p-2.5"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>

        {/* Security */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Seguridad</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña Actual
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 p-2.5"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 p-2.5"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Actualizar Contraseña
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
