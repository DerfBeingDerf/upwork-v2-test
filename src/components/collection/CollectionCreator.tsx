import React, { useState } from 'react';
import { PlusCircle, Loader2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { createCollection } from '../../lib/api';

type CollectionCreatorProps = {
  onCollectionCreated: () => void;
};

export default function CollectionCreator({ onCollectionCreated }: CollectionCreatorProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create collections.');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a title for your collection.');
      return;
    }
    
    setIsCreating(true);
    setError(null);
    
    try {
      await createCollection(
        title,
        user.id,
        description || undefined,
        isPublic
      );
      
      // Reset the form
      setTitle('');
      setDescription('');
      setIsPublic(true);
      setIsFormOpen(false);
      
      // Notify parent component
      onCollectionCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="card-apple mb-8">
      <div className="p-6 flex justify-between items-center">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center mr-3 border border-white/10">
            <Sparkles size={20} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white text-apple-title">Create New Collection</h2>
            <p className="text-gray-400 text-sm text-apple-body">Start a new audio collection</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="btn-apple-primary"
        >
          {isFormOpen ? (
            <span className="flex items-center">
              <X size={18} className="mr-2" />
              Cancel
            </span>
          ) : (
            <span className="flex items-center">
              <PlusCircle size={18} className="mr-2" />
              New Collection
            </span>
          )}
        </motion.button>
      </div>
      
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10"
          >
            <div className="p-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="status-apple-error p-4 rounded-2xl mb-6 text-sm"
                >
                  {error}
                </motion.div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                      Collection Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input-apple"
                      placeholder="My Awesome Collection"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center pt-8">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="h-5 w-5 rounded border-white/20 text-blue-500 focus:ring-blue-500 bg-white/10"
                    />
                    <label htmlFor="isPublic" className="ml-3 text-white font-medium">
                      Make public and embeddable
                    </label>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-apple min-h-[80px] resize-none"
                    placeholder="Add a description (optional)"
                  />
                </div>
                
                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isCreating}
                    className="btn-apple-primary px-6"
                  >
                    <>
                      {isCreating ? (
                        <span className="flex items-center">
                          <div className="spinner-apple mr-2" />
                          Creating...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Sparkles className="mr-2 h-4 w-4" />
                          Create Collection
                        </span>
                      )}
                    </>
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}