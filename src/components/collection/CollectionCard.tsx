import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Music, ListMusic, Share2, MoreVertical, Trash2, Image } from 'lucide-react';
import { Collection } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

type CollectionCardProps = {
  collection: Collection;
  trackCount?: number;
  onDelete?: (collection: Collection) => void;
  showActions?: boolean;
};

export default function CollectionCard({ 
  collection, 
  trackCount = 0, 
  onDelete,
  showActions = false 
}: CollectionCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    if (onDelete) {
      onDelete(collection);
    }
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const hasCoverImage = collection.cover_url && !imageError;

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="card-apple overflow-hidden relative group"
    >
      <Link to={`/collection/${collection.id}`} className="block">
        <div className="h-48 relative overflow-hidden">
          {hasCoverImage ? (
            <>
              <img 
                src={collection.cover_url} 
                alt={`${collection.title} cover`}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </>
          ) : (
            <>
              {/* Default gradient background */}
              <div className="w-full h-full bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-orange-500/10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/2 to-transparent" />
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <ListMusic size={48} className="text-blue-500 relative z-10" />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 h-2 w-2 bg-white/20 rounded-full" />
                <div className="absolute bottom-4 left-4 h-1 w-1 bg-white/10 rounded-full" />
              </div>
            </>
          )}
          
          {/* Collection status badge */}
          {collection.is_public && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-white border border-white/20">
                <Share2 size={8} className="mr-1" /> 
                Public
              </span>
            </div>
          )}
        </div>
      
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold truncate text-lg flex-1 mr-2 text-white group-hover:text-blue-400 transition-colors duration-300 text-apple-title">
              {collection.title}
            </h3>
            
            {showActions && (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleMenuToggle}
                  className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors bg-white/5 opacity-0 group-hover:opacity-100 border border-white/10"
                >
                  <MoreVertical size={14} />
                </motion.button>
                
                <AnimatePresence>
                  {showMenu && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />
                      
                      {/* Menu */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-10 z-20 modal-apple rounded-xl shadow-apple-lg py-2 min-w-[120px]"
                      >
                        <button
                          onClick={handleDelete}
                          className="w-full px-3 py-2 text-left text-red-400 hover:bg-white/5 transition-colors flex items-center text-sm font-medium"
                        >
                          <Trash2 size={12} className="mr-2" />
                          Delete
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          
          {collection.description && (
            <p className="text-gray-400 text-sm mt-2 line-clamp-2 leading-relaxed text-apple-body">
              {collection.description}
            </p>
          )}
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-400">
              <Music size={14} className="mr-2" />
              <span className="font-medium text-apple-caption">{trackCount} {trackCount === 1 ? 'track' : 'tracks'}</span>
            </div>
            
            {hasCoverImage && (
              <div className="flex items-center text-xs text-gray-500">
                <Image size={12} className="mr-1" />
                <span>Custom cover</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}