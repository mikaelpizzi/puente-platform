import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { selectCurrentUser } from '../auth/authSlice';
import { User, Mail, Shield, Save, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { AddressSelector } from '../addresses/AddressSelector';
import { AddressForm } from '../addresses/AddressForm';
import {
  useGetAddressesQuery,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  useCreateAddressMutation,
} from '../addresses/addressesApi';

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>();

  const {
    data: addresses = [],
    isLoading: addressesLoading,
    refetch: refetchAddresses,
  } = useGetAddressesQuery();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();
  const [createAddress] = useCreateAddressMutation();

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock update
    toast.success(t('profile.profileUpdated'));
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock password change
    toast.success(t('profile.passwordUpdated'));
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleAddressSelect = (address: { _id: string }) => {
    setSelectedAddressId(address._id);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id).unwrap();
      toast.success(t('profile.defaultAddressUpdated'));
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress(id).unwrap();
      toast.success(t('profile.addressDeleted'));
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <User className="w-6 h-6" />
        {t('profile.title')}
      </h2>

      <div className="space-y-6">
        {/* Personal Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('profile.personalInfo')}
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('profile.fullName')}
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
                {t('auth.email')}
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
                {t('inventory.saveChanges')}
              </button>
            </div>
          </form>
        </div>

        {/* Saved Addresses */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t('profile.myAddresses')}
          </h3>

          {showAddressForm ? (
            <AddressForm
              onSubmit={async (data) => {
                try {
                  await createAddress(data).unwrap();
                  await refetchAddresses();
                  setShowAddressForm(false);
                  toast.success(t('profile.addressSaved'));
                } catch (error) {
                  console.error('Error creating address:', error);
                  toast.error(t('errors.generic'));
                  throw error;
                }
              }}
              onCancel={() => setShowAddressForm(false)}
            />
          ) : (
            <>
              <AddressSelector
                addresses={addresses}
                selectedId={selectedAddressId}
                onSelect={handleAddressSelect}
                onAddNew={() => setShowAddressForm(true)}
                isLoading={addressesLoading}
              />
              {selectedAddressId && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleSetDefault(selectedAddressId)}
                    className="flex-1 py-2 text-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                  >
                    {t('profile.setAsDefault')}
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(selectedAddressId)}
                    className="py-2 px-4 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Security */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('profile.security')}
          </h3>
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
