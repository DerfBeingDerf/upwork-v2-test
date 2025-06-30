import React, { useState, useRef } from 'react';
import { Upload, X, Image, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CoverImageUploaderProps = {
  currentCoverUrl?: string;
  onImageUpload: (file: File) => Promise<string>;
  onImageRemove?: () => Promise<void>;
  isOwner: boolean;
};

export default function CoverImageUploader({ 
  currentCoverUrl, 
  onImageUpload, 
  onImageRemove,
  isOwner 
}: CoverImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      await onImageUpload(file);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = async () => {
    if (!onImageRemove) return;
    
    try {
      setIsUploading(true);
      setError(null);
      await onImageRemove();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove image');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOwner) {
    return currentCoverUrl ? (
      <div className="aspect-square w-full max-w-xs mx-auto rounded-2xl overflow-hidden border border-white/10">
        <img 
          src={currentCoverUrl} 
          alt="Collection cover" 
          className="w-full h-full object-cover"
        />
      </div>
    ) : (
      <div className="aspect-square w-full max-w-xs mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Image size={48} className="text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Image or Upload Area */}
      <div className="relative">
        {currentCoverUrl ? (
          <div className="aspect-square w-full max-w-xs mx-auto rounded-2xl overflow-hidden border border-white/10 relative group">
            <img 
              src={currentCoverUrl} 
              alt="Collection cover" 
              className="w-full h-full object-cover"
            />
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors disabled:opacity-50"
                >
                  <Upload size={20} />
                </motion.button>
                
                {onImageRemove && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRemove}
                    disabled={isUploading}
                    className="bg-red-500/80 hover:bg-red-500 text-white p-3 rounded-full transition-colors disabled:opacity-50"
                  >
                    <X size={20} />
                  </motion.button>
                )}
              </div>
            </div>
            
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="spinner-apple" style={{ width: '32px', height: '32px' }} />
              </div>
            )}
          </div>
        ) : (
          <motion.div
            className={`aspect-square w-full max-w-xs mx-auto rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 flex flex-col items-center justify-center p-8 ${
              isDragging 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-white/20 hover:border-blue-500/50 hover:bg-white/5'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isUploading ? (
              <div className="spinner-apple" style={{ width: '32px', height: '32px' }} />
            ) : (
              <>
                <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                  <Image size={32} className="text-blue-500" />
                </div>
                <h3 className="text-white font-semibold mb-2 text-center">Add Cover Image</h3>
                <p className="text-gray-400 text-sm text-center">
                  Drop an image here or click to browse
                </p>
                <p className="text-gray-500 text-xs mt-2 text-center">
                  JPG, PNG, GIF, WebP (Max 5MB)
                </p>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Status Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="status-apple-error p-3 rounded-xl text-sm text-center"
          >
            {error}
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="status-apple-success p-3 rounded-xl text-sm text-center flex items-center justify-center"
          >
            <Check size={16} className="mr-2" />
            Cover image updated successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}