import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useUploadImageMutation } from './productsApi';
import toast from 'react-hot-toast';

interface MultiImageDropzoneProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export const MultiImageDropzone: React.FC<MultiImageDropzoneProps> = ({
  images,
  onChange,
  maxImages = 5,
}) => {
  const [uploadImage] = useUploadImageMutation();
  const [isUploading, setIsUploading] = useState(false);

  // If incoming images is undefined/null, default to empty array
  const currentImages = images || [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (currentImages.length + files.length > maxImages) {
      toast.error(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(`Subiendo ${files.length} imagen(es)...`);

    try {
      const uploadPromises = Array.from(files).map((file) => uploadImage(file).unwrap());
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((res) => res.secure_url);

      onChange([...currentImages, ...newUrls]);
      toast.success('Imágenes subidas', { id: toastId });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Error al subir imágenes', { id: toastId });
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    onChange(currentImages.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    if (currentImages.length + files.length > maxImages) {
      toast.error(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Subiendo imagen(es)...');

    try {
      const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
      if (validFiles.length < files.length) {
        toast('Algunos archivos no eran imágenes y fueron ignorados', { icon: '⚠️' });
      }

      const uploadPromises = validFiles.map((file) => uploadImage(file).unwrap());
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((res) => res.secure_url);

      onChange([...currentImages, ...newUrls]);
      toast.success('Imágenes subidas', { id: toastId });
    } catch (error) {
      toast.error('Error al subir', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Grid of existing images */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {currentImages.map((url, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', idx.toString());
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault(); // Necessary to allow dropping
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const sourceIdx = Number(e.dataTransfer.getData('text/plain'));
                if (sourceIdx === idx || isNaN(sourceIdx)) return;

                const newImages = [...currentImages];
                const [movedImage] = newImages.splice(sourceIdx, 1);
                newImages.splice(idx, 0, movedImage);
                onChange(newImages);
              }}
              className="relative aspect-square group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-move transition-transform active:scale-95 hover:shadow-md"
            >
              <img
                src={url}
                alt={`Preview ${idx}`}
                className="w-full h-full object-cover pointer-events-none"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-10"
              >
                <X className="w-3 h-3" />
              </button>
              {/* Cover Badge for first image */}
              {idx === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-emerald-600/90 text-white text-[10px] text-center py-0.5 backdrop-blur-sm font-medium">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone */}
      {currentImages.length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 transition-colors text-center ${
            isUploading
              ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10 cursor-wait'
              : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
          }`}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            id="multi-image-input"
            disabled={isUploading}
          />
          <label htmlFor="multi-image-input" className="cursor-pointer w-full h-full block">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400">
                {isUploading ? (
                  <Upload className="w-6 h-6 animate-bounce" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {isUploading ? 'Subiendo...' : 'Haz click o arrastra imágenes'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {currentImages.length}/{maxImages} imágenes (JPG, PNG, WEBP)
                </p>
              </div>
            </div>
          </label>
        </div>
      )}
    </div>
  );
};
