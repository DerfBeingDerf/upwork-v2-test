import React, { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type DeleteCollectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  collectionTitle: string;
  trackCount: number;
};

export default function DeleteCollectionModal({
  isOpen,
  onClose,
  onConfirm,
  collectionTitle,
  trackCount
}: DeleteCollectionModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const expectedText = 'DELETE';
  const canDelete = confirmText === expectedText && !isDeleting;

  const handleConfirm = async () => {
    if (!canDelete) return;

    try {
      setIsDeleting(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete collection');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmText('');
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative modal-apple modal-responsive"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/20 mr-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white text-apple-title">Delete Collection</h3>
              </div>
              <button
                onClick={handleClose}
                disabled={isDeleting}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {error && (
                <div className="status-apple-error p-3 rounded-xl mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <p className="text-gray-300 mb-2 text-apple-body">
                  You are about to permanently delete the collection:
                </p>
                <p className="font-semibold text-white bg-white/5 p-3 rounded-xl border-l-4 border-red-500 responsive-text">
                  "{collectionTitle}"
                </p>
              </div>

              {trackCount > 0 && (
                <div className="mb-4 p-3 status-apple-warning rounded-xl">
                  <p className="text-yellow-200 text-sm text-apple-body">
                    <strong>Warning:</strong> This collection contains {trackCount} track{trackCount !== 1 ? 's' : ''}. 
                    The tracks will be removed from this collection but the audio files themselves will remain in your library.
                  </p>
                </div>
              )}

              <div className="mb-6">
                <p className="text-gray-300 text-sm mb-2 text-apple-body">
                  This action cannot be undone. To confirm, type <strong>DELETE</strong> below:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type DELETE to confirm"
                  disabled={isDeleting}
                  className="input-apple input-responsive disabled:opacity-50"
                />
              </div>

              {/* Actions */}
              <div className="responsive-flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  disabled={isDeleting}
                  className="btn-apple-secondary btn-responsive disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!canDelete}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 btn-responsive ${
                    canDelete
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center">
                      <div className="spinner-apple mr-2" />
                      Deleting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Trash2 size={16} className="mr-1" />
                      Delete Collection
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}