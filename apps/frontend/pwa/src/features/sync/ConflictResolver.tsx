import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectActiveConflict,
  resolveConflict,
  dismissConflict,
  setResolving,
} from './conflictSlice';

interface ConflictResolverProps {
  onResolve?: (
    resolution: 'local' | 'server' | 'merge',
    data?: Record<string, unknown>,
  ) => Promise<void>;
}

/**
 * Conflict Resolver Component
 *
 * Shows side-by-side diff when a 409 conflict is detected.
 * Allows user to choose local, server, or merged version.
 */
export function ConflictResolver({ onResolve }: ConflictResolverProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const conflict = useSelector(selectActiveConflict);
  const [mergeData, setMergeData] = useState<Record<string, unknown>>({});
  const [selectedResolution, setSelectedResolution] = useState<'local' | 'server' | 'merge'>(
    'server',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!conflict) return null;

  const handleResolve = async () => {
    setIsSubmitting(true);
    dispatch(setResolving(true));

    try {
      const finalData =
        selectedResolution === 'merge'
          ? mergeData
          : selectedResolution === 'local'
            ? conflict.localVersion
            : conflict.serverVersion;

      await onResolve?.(selectedResolution, finalData);
      dispatch(resolveConflict({ conflictId: conflict.id, resolution: selectedResolution }));
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setIsSubmitting(false);
      dispatch(setResolving(false));
    }
  };

  const handleDismiss = () => {
    dispatch(dismissConflict(conflict.id));
  };

  const handleFieldMerge = (field: string, source: 'local' | 'server') => {
    const value = source === 'local' ? conflict.localVersion[field] : conflict.serverVersion[field];
    setMergeData((prev) => ({ ...prev, [field]: value }));
    setSelectedResolution('merge');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-yellow-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h2 className="text-lg font-bold text-white">{t('errors.conflict')}</h2>
              <p className="text-yellow-100 text-sm">
                {conflict.resourceType} #{conflict.resourceId}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Este recurso fue modificado por otro usuario. Elige qué versión conservar o combina los
            cambios.
          </p>

          {/* Side by side comparison */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Local Version */}
            <div
              className={`border-2 rounded-lg p-4 ${selectedResolution === 'local' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-blue-600 dark:text-blue-400">📱 Tu versión</h3>
                <span className="text-xs text-gray-500">
                  {new Date(conflict.localTimestamp).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedResolution('local')}
                className={`w-full py-2 px-3 rounded-lg text-sm font-medium mb-3 ${
                  selectedResolution === 'local'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Usar esta versión
              </button>
              <div className="space-y-2">
                {conflict.fields.map((field) => (
                  <div key={field} className="text-sm">
                    <span className="text-gray-500">{field}:</span>
                    <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 break-all">
                      {JSON.stringify(conflict.localVersion[field], null, 2)}
                    </div>
                    <button
                      onClick={() => handleFieldMerge(field, 'local')}
                      className="text-xs text-blue-500 hover:underline mt-1"
                    >
                      Usar este valor →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Server Version */}
            <div
              className={`border-2 rounded-lg p-4 ${selectedResolution === 'server' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-green-600 dark:text-green-400">
                  ☁️ Versión del servidor
                </h3>
                <span className="text-xs text-gray-500">
                  {new Date(conflict.serverTimestamp).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedResolution('server')}
                className={`w-full py-2 px-3 rounded-lg text-sm font-medium mb-3 ${
                  selectedResolution === 'server'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Usar esta versión
              </button>
              <div className="space-y-2">
                {conflict.fields.map((field) => (
                  <div key={field} className="text-sm">
                    <span className="text-gray-500">{field}:</span>
                    <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 break-all">
                      {JSON.stringify(conflict.serverVersion[field], null, 2)}
                    </div>
                    <button
                      onClick={() => handleFieldMerge(field, 'server')}
                      className="text-xs text-green-500 hover:underline mt-1"
                    >
                      ← Usar este valor
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Merge Preview */}
          {selectedResolution === 'merge' && Object.keys(mergeData).length > 0 && (
            <div className="border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-3">
                🔀 Versión combinada
              </h3>
              <pre className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
                {JSON.stringify(mergeData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <button
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleResolve}
            disabled={isSubmitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? t('common.loading') : t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConflictResolver;
