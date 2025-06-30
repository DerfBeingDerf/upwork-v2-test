import React, { useState, useEffect } from 'react';
import { Move, Trash2, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Collection, CollectionTrack } from '../../types';

type TrackActionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  track: CollectionTrack | null;
  currentCollectionId: string;
  userCollections: Collection[];
  onMoveTrack: (trackId: string, toCollectionId: string) => Promise<void>;
  onDeleteTrack: (trackId: string) => Promise<void>;
};

export default function TrackActionsModal({
  isOpen,
  onClose,
  track,
  currentCollectionId,
  userCollections,
  onMoveTrack,
  onDeleteTrack
}: TrackActionsModalProps) {
  const [selectedAction, setSelectedAction] = useState<'move' | 'delete' | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Filter out the current collection from available collections
  const availableCollections = userCollections.filter(c => c.id !== currentCollectionId);

  useEffect(() => {
    if (isOpen) {
      setSelectedAction(null);
      setSelectedCollectionId('');
      setConfirmDelete(false);
      setError(null);
    }
  }, [isOpen]);

  const handleMove = async () => {
    if (!track || !selectedCollectionId) return;

    try {
      setIsProcessing(true);
      setError(null);
      await onMoveTrack(track.id, selectedCollectionId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move track');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!track || !confirmDelete) return;

    try {
      setIsProcessing(true);
      setError(null);
      await onDeleteTrack(track.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete track');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    onClose();
  };

  if (!track) return null;

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
              <h3 className="text-lg font-semibold text-white text-apple-title">Track Actions</h3>
              <button
                onClick={handleClose}
                disabled={isProcessing}
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

              {/* Track Info */}
              <div className="mb-6 p-3 bg-white/5 rounded-xl">
                <h4 className="font-medium text-white text-apple-caption responsive-text">{track.audio_file.title}</h4>
                <p className="text-sm text-gray-400 text-apple-body responsive-text">{track.audio_file.artist || 'Unknown Artist'}</p>
              </div>

              {!selectedAction && (
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedAction('move')}
                    disabled={availableCollections.length === 0}
                    className="w-full p-3 text-left bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center border border-white/10"
                  >
                    <Move size={18} className="mr-3 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-white text-apple-caption">Move to Another Collection</div>
                      <div className="text-sm text-gray-400 text-apple-body responsive-text">
                        {availableCollections.length === 0 
                          ? 'No other collections available' 
                          : `Choose from ${availableCollections.length} collection${availableCollections.length !== 1 ? 's' : ''}`
                        }
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedAction('delete')}
                    className="w-full p-3 text-left bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors flex items-center border border-red-500/20"
                  >
                    <Trash2 size={18} className="mr-3 text-red-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-red-400 text-apple-caption">Remove from Collection</div>
                      <div className="text-sm text-gray-400 text-apple-body">Remove this track from the current collection</div>
                    </div>
                  </button>
                </div>
              )}

              {selectedAction === 'move' && (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-gray-400 mb-4">
                    <button
                      onClick={() => setSelectedAction(null)}
                      className="text-blue-500 hover:text-blue-400 text-apple-body"
                    >
                      ← Back to actions
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select destination collection:
                    </label>
                    <select
                      value={selectedCollectionId}
                      onChange={(e) => setSelectedCollectionId(e.target.value)}
                      className="input-apple input-responsive"
                    >
                      <option value="">-- Select a collection --</option>
                      {availableCollections.map((collection) => (
                        <option key={collection.id} value={collection.id}>
                          {collection.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="responsive-flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setSelectedAction(null)}
                      disabled={isProcessing}
                      className="btn-apple-secondary btn-responsive disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleMove}
                      disabled={!selectedCollectionId || isProcessing}
                      className="btn-apple-primary btn-responsive disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isProcessing ? (
                        <span className="flex items-center">
                          <div className="spinner-apple mr-2" />
                          Moving...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <ArrowRight size={16} className="mr-1" />
                          Move Track
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {selectedAction === 'delete' && (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-gray-400 mb-4">
                    <button
                      onClick={() => setSelectedAction(null)}
                      className="text-blue-500 hover:text-blue-400 text-apple-body"
                    >
                      ← Back to actions
                    </button>
                  </div>

                  <div className="status-apple-warning p-3 rounded-xl">
                    <p className="text-yellow-200 text-sm text-apple-body">
                      <strong>Note:</strong> This will only remove the track from this collection. 
                      The audio file will remain in your library and can be added to other collections.
                    </p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="confirmDelete"
                      checked={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 text-red-500 focus:ring-red-500 bg-white/10"
                    />
                    <label htmlFor="confirmDelete" className="ml-2 text-sm text-gray-300 text-apple-body">
                      I understand this will remove the track from this collection
                    </label>
                  </div>

                  <div className="responsive-flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setSelectedAction(null)}
                      disabled={isProcessing}
                      className="btn-apple-secondary btn-responsive disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={!confirmDelete || isProcessing}
                      className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center btn-responsive"
                    >
                      {isProcessing ? (
                        <span className="flex items-center">
                          <div className="spinner-apple mr-2" />
                          Removing...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Trash2 size={16} className="mr-1" />
                          Remove Track
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}