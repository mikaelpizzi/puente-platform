import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'es', name: 'Español', flag: '🇻🇪' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

interface LanguageSwitcherProps {
  showLabel?: boolean;
  className?: string;
}

/**
 * Language Switcher Component
 *
 * Toggles between Spanish and English.
 * Stores preference in localStorage.
 */
export function LanguageSwitcher({ showLabel = true, className = '' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const handleChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div className={`language-switcher ${className}`}>
      <div className="flex items-center gap-2">
        {showLabel && (
          <span className="text-sm text-gray-500 dark:text-gray-400">{currentLang.flag}</span>
        )}
        <select
          value={i18n.language}
          onChange={(e) => handleChange(e.target.value)}
          className="bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          aria-label="Select language"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * Compact language toggle (just flags).
 */
export function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggle = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];
  const otherLang = languages.find((l) => l.code !== i18n.language) || languages[1];

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={`Switch to ${otherLang.name}`}
      aria-label={`Switch language to ${otherLang.name}`}
    >
      <span className="text-lg">{currentLang.flag}</span>
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
        />
      </svg>
    </button>
  );
}

export default LanguageSwitcher;
