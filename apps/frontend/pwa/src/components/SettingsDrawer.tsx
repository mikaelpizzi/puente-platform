import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import {
  X,
  User,
  Shield,
  MapPin,
  CreditCard,
  Globe,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Truck,
  Settings,
  Bell,
  Wallet,
  Building2,
} from 'lucide-react';
import { selectCurrentUser } from '../features/auth/authSlice';
import { useTheme } from '../app/ThemeContext';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const ROLE_LABELS: Record<string, { labelKey: string; color: string }> = {
  SELLER: { labelKey: 'settingsDrawer.roles.SELLER', color: 'bg-emerald-500' },
  BUYER: { labelKey: 'settingsDrawer.roles.BUYER', color: 'bg-blue-500' },
  COURIER: { labelKey: 'settingsDrawer.roles.COURIER', color: 'bg-purple-500' },
  ADMIN: { labelKey: 'settingsDrawer.roles.ADMIN', color: 'bg-red-500' },
};

const LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const { isDarkMode, toggleTheme } = useTheme();
  const [currentLang, setCurrentLang] = useState(i18n.language || 'es');

  const roleInfo = user?.role ? ROLE_LABELS[user.role] : null;

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setCurrentLang(langCode);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Drawer - Slides from LEFT */}
      <div className="fixed left-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user?.name || 'Usuario'}</h2>
                <p className="text-emerald-100 text-sm truncate max-w-[180px]">{user?.email}</p>
                {roleInfo && (
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}
                  >
                    {t(roleInfo.labelKey)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* General Section */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
              {t('settingsDrawer.general')}
            </h3>
            <div className="space-y-1">
              {/* Language Selector */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('settingsDrawer.language')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentLang.startsWith(lang.code)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Moon className="w-5 h-5 text-indigo-500" />
                  ) : (
                    <Sun className="w-5 h-5 text-amber-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('settingsDrawer.theme')}
                  </span>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isDarkMode
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                      : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {isDarkMode ? t('settingsDrawer.themeDark') : t('settingsDrawer.themeLight')}
                </div>
              </button>

              {/* Notifications */}
              <button
                onClick={() => handleNavigate('/notifications')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('settingsDrawer.notifications')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Account Section */}
          <div className="p-4 pt-0">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
              {t('settingsDrawer.account')}
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => handleNavigate('/profile')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('settingsDrawer.editProfile')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                onClick={() => handleNavigate('/profile#security')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('settingsDrawer.security')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Finance Section */}
          <div className="p-4 pt-0">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
              {t('settingsDrawer.finance')}
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => handleNavigate('/finance/accounts')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-500" />
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                      {t('settingsDrawer.bankAccounts')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {t('settingsDrawer.bankAccountsDesc')}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                onClick={() => handleNavigate('/finance/wallets')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-gray-500" />
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                      {t('settingsDrawer.cryptoWallets')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {t('settingsDrawer.cryptoWalletsDesc')}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                onClick={() => handleNavigate('/finance/methods')}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('settingsDrawer.paymentMethods')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Role-Specific Section */}
          {user?.role === 'BUYER' && (
            <div className="p-4 pt-0">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
                {t('settingsDrawer.buyer')}
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigate('/profile#addresses')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('settingsDrawer.savedAddresses')}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          )}

          {user?.role === 'COURIER' && (
            <div className="p-4 pt-0">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
                {t('settingsDrawer.courier')}
              </h3>
              <div className="space-y-1">
                <div className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-purple-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        {t('settingsDrawer.availability')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {t('settingsDrawer.availabilityDesc')}
                      </span>
                    </div>
                  </div>
                  {/* Toggle Switch */}
                  <button
                    className="relative w-12 h-6 bg-emerald-500 rounded-full transition-colors"
                    onClick={() => {
                      /* TODO: Toggle availability */
                    }}
                  >
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform" />
                  </button>
                </div>

                <button
                  onClick={() => handleNavigate('/logistics/history')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('settingsDrawer.gpsSettings')}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          )}

          {user?.role === 'SELLER' && (
            <div className="p-4 pt-0">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
                {t('settingsDrawer.seller')}
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigate('/inventory/settings')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('settingsDrawer.storeSettings')}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t('settingsDrawer.logout')}
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">{t('settingsDrawer.version')}</p>
        </div>
      </div>
    </>
  );
};

export default SettingsDrawer;
