import React, { useState } from 'react';
import { useGetTagsQuery, useCreateTagMutation, useDeleteTagMutation } from './tagsApi';
import { X, Plus, Trash2, Tag as TagIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TagManager: React.FC<TagManagerProps> = ({ isOpen, onClose }) => {
  const { data: tags, isLoading } = useGetTagsQuery();
  const [createTag, { isLoading: isCreating }] = useCreateTagMutation();
  const [deleteTag] = useDeleteTagMutation();
  const [newTagName, setNewTagName] = useState('');
  const [tagToDelete, setTagToDelete] = useState<{ id: string; name: string } | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      await createTag({ name: newTagName }).unwrap();
      setNewTagName('');
      toast.success('Etiqueta creada');
    } catch (error) {
      toast.error('Error al crear etiqueta');
    }
  };

  const confirmDelete = async () => {
    if (!tagToDelete) return;
    try {
      await deleteTag(tagToDelete.id).unwrap();
      toast.success('Etiqueta eliminada');
      setTagToDelete(null);
    } catch (error) {
      toast.error('Error al eliminar etiqueta');
    }
  };

  const tagCount = tags?.length || 0;
  const MAX_TAGS = 30;
  const isLimitReached = tagCount >= MAX_TAGS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-emerald-500" />
            Gestionar Etiquetas
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${isLimitReached ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}
            >
              {tagCount}/{MAX_TAGS}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder={
                isLimitReached ? 'Límite de etiquetas alcanzado' : 'Nueva etiqueta (ej. Ofertas)'
              }
              disabled={isLimitReached}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newTagName.trim() || isCreating || isLimitReached}
              className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </form>
          {isLimitReached && (
            <p className="text-xs text-red-500 text-center">
              Has alcanzado el límite máximo de {MAX_TAGS} etiquetas. Elimina algunas para crear
              nuevas.
            </p>
          )}

          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="text-center py-4 text-gray-400">Cargando...</div>
            ) : tags?.length === 0 ? (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">
                No tienes etiquetas personalizadas
              </div>
            ) : (
              tags?.map((tag) => (
                <div
                  key={tag._id}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-200">{tag.name}</span>
                  <button
                    onClick={() => setTagToDelete({ id: tag._id, name: tag.name })}
                    className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!tagToDelete}
        onClose={() => setTagToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar Etiqueta"
        message={`¿Estás seguro de que deseas eliminar la etiqueta "${tagToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
};
