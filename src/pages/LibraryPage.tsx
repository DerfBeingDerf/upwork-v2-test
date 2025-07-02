import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CollectionCreator from '../components/collection/CollectionCreator';
import CollectionCard from '../components/collection/CollectionCard';
import DeleteCollectionModal from '../components/collection/DeleteCollectionModal';
import LoadingSpinner from '../components/layout/LoadingSpinner';
import { getUserCollections, getCollectionTracks, deleteCollection } from '../lib/api';
import { Collection } from '../types';
import { motion } from 'framer-motion';

export default function LibraryPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [trackCounts, setTrackCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Delete modal state
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // Store the current location in sessionStorage so we can redirect back after login
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      navigate('/login');
    }
  }, [user, loading, navigate, location.pathname]);

  const fetchCollections = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userCollections = await getUserCollections(user.id);
      setCollections(userCollections);
      
      // Fetch track counts for each collection
      const counts: Record<string, number> = {};
      await Promise.all(
        userCollections.map(async (collection) => {
          const tracks = await getCollectionTracks(collection.id);
          counts[collection.id] = tracks.length;
        })
      );
      
      setTrackCounts(counts);
    } catch (err) {
      setError('Failed to load your collections.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [user]);

  const handleDeleteCollection = (collection: Collection) => {
    setCollectionToDelete(collection);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCollection = async () => {
    if (!collectionToDelete) return;

    try {
      await deleteCollection(collectionToDelete.id);
      
      // Update local state
      setCollections(prev => prev.filter(c => c.id !== collectionToDelete.id));
      setTrackCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[collectionToDelete.id];
        return newCounts;
      });
      
      setCollectionToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  const closeDeleteModal = () => {
    setCollectionToDelete(null);
    setIsDeleteModalOpen(false);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-black">
        <div className="spinner-apple" style={{ width: '48px', height: '48px', borderWidth: '4px' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 bg-black min-h-screen">
        <div className="text-center py-12">
          <h1 className="text-apple-headline text-white mb-4">Your Library</h1>
          <p className="text-gray-400 mb-6 text-apple-body">
            Sign in to access your collections and audio files.
          </p>
          <div className="space-x-4">
            <button 
              onClick={() => navigate('/login')}
              className="btn-apple-primary"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="btn-apple-secondary"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 bg-black min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h1 className="text-apple-headline text-white mb-4">Your Library</h1>
        <p className="text-gray-400 text-apple-body">
          Manage your collections and audio files in one place.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <CollectionCreator onCollectionCreated={fetchCollections} />
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="status-apple-error p-4 rounded-2xl mb-6 text-sm"
        >
          {error}
        </motion.div>
      )}
      
      {collections.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center py-16 text-gray-400"
        >
          <div className="card-apple p-12 max-w-md mx-auto">
            <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                📚
              </motion.div>
            </div>
            <p className="text-lg mb-2 text-white">You haven't created any collections yet.</p>
            <p className="text-gray-400">Create your first collection to get started.</p>
          </div>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <CollectionCard 
                collection={collection} 
                trackCount={trackCounts[collection.id] || 0}
                onDelete={handleDeleteCollection}
                showActions={true}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Collection Modal */}
      <DeleteCollectionModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteCollection}
        collectionTitle={collectionToDelete?.title || ''}
        trackCount={collectionToDelete ? (trackCounts[collectionToDelete.id] || 0) : 0}
      />
    </div>
  );
}