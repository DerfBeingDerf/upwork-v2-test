import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Music, ListMusic, Share2, MoreVertical, Settings, Globe, Lock, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import WaveformPlayer from '../components/audio/WaveformPlayer';
import CollectionEmbed from '../components/collection/CollectionEmbed';
import DeleteCollectionModal from '../components/collection/DeleteCollectionModal';
import TrackActionsModal from '../components/collection/TrackActionsModal';
import CoverImageUploader from '../components/collection/CoverImageUploader';
import LoadingSpinner from '../components/layout/LoadingSpinner';
import { getCollection, getCollectionTracks, getUserCollections, deleteCollection, removeTrackFromCollection, moveTrackToCollection, updateCollection, uploadCollectionCoverImage, removeCollectionCoverImage, uploadAudioFile, addTrackToCollection } from '../lib/api';
import { formatDuration, getAudioMetadata } from '../lib/audioUtils';
import { Collection, CollectionTrack, AudioFile } from '../types';
import { motion } from 'framer-motion';

export default function CollectionDetailPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const emptyCardRef = useRef<HTMLDivElement>(null);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [tracks, setTracks] = useState<CollectionTrack[]>([]);
  const [userCollections, setUserCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Track actions modal state
  const [selectedTrack, setSelectedTrack] = useState<CollectionTrack | null>(null);
  const [isTrackActionsModalOpen, setIsTrackActionsModalOpen] = useState(false);

  // Privacy toggle state
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  const scrollToEmptyCard = () => {
    if (emptyCardRef.current) {
      emptyCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
      
      // Add a custom slower scroll animation using CSS
      const style = document.createElement('style');
      style.textContent = `
        html {
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
      
      // Use a custom smooth scroll with slower timing
      const targetElement = emptyCardRef.current;
      const targetPosition = targetElement.offsetTop - (window.innerHeight / 2) + (targetElement.offsetHeight / 2);
      const startPosition = window.pageYOffset;
      const distance = targetPosition - startPosition;
      const duration = 1500; // 1.5 seconds for a slower animation
      let start: number | null = null;
      
      function animation(currentTime: number) {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
        else {
          // Restore original scroll behavior
          document.head.removeChild(style);
        }
      }
      
      // Easing function for smooth animation
      function ease(t: number, b: number, c: number, d: number) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
      }
      
      requestAnimationFrame(animation);
    }
  };

  // Handle file uploads for empty collection
  const handleFileUpload = async (files: File[]) => {
    if (!user || !collectionId) return;

    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    if (audioFiles.length === 0) {
      setUploadError('Please select audio files only.');
      return;
    }

    if (audioFiles.length !== files.length) {
      setUploadError('Some files were skipped. Please select only audio files.');
    } else {
      setUploadError(null);
    }

    setIsUploading(true);
    setUploadProgress('');

    try {
      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i];
        setUploadProgress(`Uploading ${file.name} (${i + 1}/${audioFiles.length})...`);
        
        // Extract title from filename
        const title = file.name.split('.').slice(0, -1).join('.');
        
        const audioFile = await uploadAudioFile(file, title, user.id);
        await addTrackToCollection(collectionId, audioFile.id, tracks.length + i);
      }
      
      setUploadProgress('Finalizing...');
      await fetchCollectionData(); // Refresh the collection data
      
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload files.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const fetchCollectionData = async () => {
    if (!collectionId) return;

    try {
      setIsLoading(true);
      const collectionData = await getCollection(collectionId);
      setCollection(collectionData);

      if (user && collectionData.user_id !== user.id && !collectionData.is_public) {
        setError('You do not have access to this collection.');
        return;
      }

      const tracksData = await getCollectionTracks(collectionId);
      setTracks(tracksData);

      // Fetch user collections for moving tracks (only if user is the owner)
      if (user && collectionData.user_id === user.id) {
        const collections = await getUserCollections(user.id);
        setUserCollections(collections);
      }
    } catch (err) {
      setError('Failed to load collection details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectionData();
  }, [collectionId, user]);

  const handleDeleteCollection = async () => {
    if (!collectionId) return;

    try {
      await deleteCollection(collectionId);
      navigate('/library');
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  const handleTrackAction = (track: CollectionTrack) => {
    setSelectedTrack(track);
    setIsTrackActionsModalOpen(true);
  };

  const handleMoveTrack = async (trackId: string, toCollectionId: string) => {
    if (!collectionId) return;

    await moveTrackToCollection(trackId, collectionId, toCollectionId);
    await fetchCollectionData(); // Refresh the tracks list
  };

  const handleDeleteTrack = async (trackId: string) => {
    await removeTrackFromCollection(trackId);
    await fetchCollectionData(); // Refresh the tracks list
    
    // Adjust current track index if necessary
    const deletedTrackIndex = tracks.findIndex(track => track.id === trackId);
    if (deletedTrackIndex !== -1 && deletedTrackIndex <= currentTrackIndex && currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  const handlePrivacyToggle = async (isPublic: boolean) => {
    if (!collection || !collectionId) return;

    try {
      setIsUpdatingPrivacy(true);
      const updatedCollection = await updateCollection(collectionId, { is_public: isPublic });
      setCollection(updatedCollection);
    } catch (err) {
      console.error('Failed to update collection privacy:', err);
      // Optionally show an error message to the user
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleCoverImageUpload = async (file: File): Promise<string> => {
    if (!collectionId || !user) {
      throw new Error('Missing collection ID or user');
    }

    const coverUrl = await uploadCollectionCoverImage(file, collectionId, user.id);
    
    // Update local state
    if (collection) {
      setCollection({ ...collection, cover_url: coverUrl });
    }
    
    return coverUrl;
  };

  const handleCoverImageRemove = async (): Promise<void> => {
    if (!collectionId || !user) {
      throw new Error('Missing collection ID or user');
    }

    await removeCollectionCoverImage(collectionId, user.id);
    
    // Update local state
    if (collection) {
      setCollection({ ...collection, cover_url: null });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-black">
        <div className="spinner-apple" style={{ width: '48px', height: '48px', borderWidth: '4px' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 bg-black min-h-screen">
        <div className="status-apple-error p-8 rounded-3xl">
          <h2 className="text-2xl font-semibold mb-4 text-apple-title">Error</h2>
          <p className="mb-6 text-apple-body">{error}</p>
          <button
            onClick={() => navigate('/library')}
            className="btn-apple-primary"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container mx-auto py-8 px-4 text-center bg-black min-h-screen">
        <p className="text-gray-400">Collection not found.</p>
      </div>
    );
  }

  const isOwner = user && collection.user_id === user.id;

  return (
    <div className="container mx-auto py-8 px-4 bg-black min-h-screen">
      {/* Collection Header */}
      <div className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Cover Image */}
          <div className="lg:col-span-1">
            <CoverImageUploader
              currentCoverUrl={collection.cover_url || undefined}
              onImageUpload={handleCoverImageUpload}
              onImageRemove={collection.cover_url ? handleCoverImageRemove : undefined}
              isOwner={isOwner}
            />
          </div>

          {/* Collection Info */}
          <div className="lg:col-span-2 min-w-0">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 break-words leading-tight">
              {collection.title}
            </h1>
            {collection.description && (
              <p className="text-gray-400 mb-4 break-words text-lg">
                {collection.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-gray-400">
              <div className="flex items-center">
                <ListMusic size={18} className="mr-2 flex-shrink-0" />
                <span className="font-medium">{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}</span>
              </div>

              {collection.is_public && (
                <div className="flex items-center text-blue-500">
                  <Share2 size={18} className="mr-2 flex-shrink-0" />
                  <span className="font-medium">Public Collection</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="lg:col-span-1 flex justify-end">
            {isOwner && tracks.length === 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToEmptyCard}
                className="btn-apple-primary whitespace-nowrap w-full lg:w-auto"
              >
                <span className="flex items-center justify-center">
                  <Upload size={20} className="mr-2" />
                  Upload Tracks
                </span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Tracks and Player/Embed Layout */}
      {tracks.length === 0 ? (
        <div 
             ref={emptyCardRef} 
             className="flex items-center justify-center min-h-[60vh] mb-16"
             onDragOver={(e) => {
               e.preventDefault();
               e.stopPropagation();
               if (isOwner && !isUploading) {
                 setIsDragging(true);
               }
             }}
             onDragLeave={(e) => {
               e.preventDefault();
               e.stopPropagation();
               if (isOwner && !isUploading) {
                 setIsDragging(false);
               }
             }}
             onDrop={(e) => {
               e.preventDefault();
               e.stopPropagation();
               setIsDragging(false);
               
               if (!isOwner || isUploading) return;
               
               const files = Array.from(e.dataTransfer.files);
               if (files.length > 0) {
                 handleFileUpload(files);
               }
             }}>
          <div className={`p-16 text-center max-w-2xl w-full transition-all duration-300 ${
            isOwner ? `cursor-pointer border-2 border-dashed rounded-2xl ${
              isDragging 
                ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25 backdrop-blur-20' 
                : 'border-white/20 hover:border-blue-500/50 bg-white/5 backdrop-blur-20'
            }` : 'card-apple'
          }`}
               onClick={(e) => {
                 e.stopPropagation();
                 if (isOwner && !isUploading) {
                   // Trigger file input
                   const input = document.createElement('input');
                   input.type = 'file';
                   input.multiple = true;
                   input.accept = 'audio/*';
                   input.onchange = (e) => {
                     const files = Array.from((e.target as HTMLInputElement).files || []);
                     if (files.length > 0) {
                       handleFileUpload(files);
                     }
                   };
                   input.click();
                 }
               }}>
            
            {/* Upload Progress */}
            {isUploading ? (
              <div className="py-8">
                <div className="spinner-apple mx-auto mb-4" style={{ width: '48px', height: '48px', borderWidth: '4px' }} />
                <h3 className="text-2xl font-semibold mb-4 text-white text-apple-title">Uploading...</h3>
                {uploadProgress && (
                  <p className="text-blue-400 text-apple-body">{uploadProgress}</p>
                )}
              </div>
            ) : (
              <>
                <div className="h-20 w-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/10">
                  <Music size={48} className="text-gray-600" />
                </div>
                <h3 className="text-3xl font-semibold mb-6 text-white text-apple-title">No tracks yet</h3>
                <p className="text-gray-400 text-apple-body text-lg leading-relaxed">
                  {isOwner ? (
                    <>
                      Drag and drop audio files here or click to add tracks to your collection.
                      <br />
                      <span className="text-sm text-gray-500 mt-2 block">
                        Supports MP3, WAV, FLAC, OGG and more
                      </span>
                    </>
                  ) : (
                    "This collection is empty."
                  )}
                </p>
              </>
            )}
            
            {/* Upload Error */}
            {uploadError && (
              <div className="mt-6 status-apple-error p-4 rounded-2xl text-sm">
                {uploadError}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <div className="card-apple-subtle overflow-hidden">
              <div className="p-6 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white text-apple-title">Tracks</h2>
                {isOwner && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = 'audio/*';
                      input.onchange = (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        if (files.length > 0) {
                          handleFileUpload(files);
                        }
                      };
                      input.click();
                    }}
                    className="btn-apple-primary text-sm px-4 py-2"
                  >
                    <Upload size={16} className="mr-2" />
                    Add More
                  </motion.button>
                )}
            </div>

              {/* Fully Responsive Track List */}
              <div className="w-full">
                {/* Large Desktop View (xl+) - Full table with adjusted widths */}
                <div className="hidden xl:block">
                  <table className="table-apple w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-12">#</th>
                        <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-64">Title</th>
                        <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-48">Artist</th>
                        <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-24">Duration</th>
                        {isOwner && (
                          <th className="px-2 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-12"></th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {tracks.map((track, index) => (
                        <tr
                          key={track.id}
                          className={`cursor-pointer transition-colors ${
                            index === currentTrackIndex ? 'bg-blue-500/10 border-blue-500/20' : 'hover:bg-white/5'
                          }`}
                          onClick={() => setCurrentTrackIndex(index)}
                        >
                          <td className="px-4 py-4 whitespace-nowrap text-gray-400 font-medium text-sm">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 w-64">
                            <div className="font-semibold text-white text-sm truncate">{track.audio_file.title}</div>
                          </td>
                          <td className="px-4 py-4 text-gray-400 w-48">
                            <div className="truncate text-sm">{track.audio_file.artist || 'Unknown'}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-gray-400 font-medium text-sm w-24">
                            {formatDuration(track.audio_file.duration)}
                          </td>
                          {isOwner && (
                            <td className="px-2 py-4 whitespace-nowrap w-12">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTrackAction(track);
                                }}
                                className="text-gray-400 hover:text-white p-2 rounded-xl transition-colors bg-white/5 border border-white/10"
                              >
                                <MoreVertical size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Medium Desktop View (lg-xl) - Compact table */}
                <div className="hidden lg:block xl:hidden">
                  <table className="table-apple w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-8">#</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-48">Title</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32">Artist</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-20">Duration</th>
                        {isOwner && (
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-10"></th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {tracks.map((track, index) => (
                        <tr
                          key={track.id}
                          className={`cursor-pointer transition-colors ${
                            index === currentTrackIndex ? 'bg-blue-500/10 border-blue-500/20' : 'hover:bg-white/5'
                          }`}
                          onClick={() => setCurrentTrackIndex(index)}
                        >
                          <td className="px-3 py-3 whitespace-nowrap text-gray-400 font-medium text-sm">
                            {index + 1}
                          </td>
                          <td className="px-3 py-3 w-48">
                            <div className="font-semibold text-white text-sm truncate">{track.audio_file.title}</div>
                          </td>
                          <td className="px-3 py-3 text-gray-400 w-32">
                            <div className="truncate text-xs">{track.audio_file.artist || 'Unknown'}</div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-gray-400 font-medium text-xs w-20">
                            {formatDuration(track.audio_file.duration)}
                          </td>
                          {isOwner && (
                            <td className="px-2 py-3 whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTrackAction(track);
                                }}
                                className="text-gray-400 hover:text-white p-1.5 rounded-lg transition-colors bg-white/5 border border-white/10"
                              >
                                <MoreVertical size={12} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tablet View (md-lg) - Two column layout */}
                <div className="hidden md:block lg:hidden">
                  <div className="bg-white/5 border-b border-white/10 px-4 py-3">
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <div className="col-span-1">#</div>
                      <div className="col-span-6">Track</div>
                      <div className="col-span-4">Duration</div>
                      {isOwner && <div className="col-span-1"></div>}
                    </div>
                  </div>
                  {tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className={`px-4 py-3 border-b border-white/10 cursor-pointer transition-colors ${
                        index === currentTrackIndex ? 'bg-blue-500/10' : 'hover:bg-white/5'
                      }`}
                      onClick={() => setCurrentTrackIndex(index)}
                    >
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-1 text-gray-400 font-medium text-sm">
                          {index + 1}
                        </div>
                        <div className="col-span-6 min-w-0">
                          <div className="font-semibold text-white text-sm truncate">{track.audio_file.title}</div>
                          <div className="text-xs text-gray-400 truncate">{track.audio_file.artist || 'Unknown'}</div>
                        </div>
                        <div className="col-span-4 text-gray-400 font-medium text-sm">
                          {formatDuration(track.audio_file.duration)}
                        </div>
                        {isOwner && (
                          <div className="col-span-1 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTrackAction(track);
                              }}
                              className="text-gray-400 hover:text-white p-1.5 rounded-lg transition-colors bg-white/5 border border-white/10"
                            >
                              <MoreVertical size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile View (sm and below) - Compact cards */}
                <div className="md:hidden">
                  {tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className={`p-4 border-b border-white/10 cursor-pointer transition-colors ${
                        index === currentTrackIndex ? 'bg-blue-500/10' : 'hover:bg-white/5'
                      }`}
                      onClick={() => setCurrentTrackIndex(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="text-gray-400 font-medium text-sm w-6 flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-white text-sm truncate">
                              {track.audio_file.title}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {track.audio_file.artist || 'Unknown'} • {formatDuration(track.audio_file.duration)}
                            </div>
                          </div>
                        </div>
                        {isOwner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTrackAction(track);
                            }}
                            className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors bg-white/5 border border-white/10 flex-shrink-0 ml-2"
                          >
                            <MoreVertical size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar for Player and Embed */}
          <div className="xl:col-span-1 space-y-8">
            <div className="sticky top-24">
              <WaveformPlayer
                tracks={tracks}
                currentTrackIndex={currentTrackIndex}
                onTrackChange={setCurrentTrackIndex}
              />

              {collection.is_public && collectionId && (
                <div className="mt-8">
                  <CollectionEmbed collectionId={collectionId} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Overlay for existing tracks */}
      {isUploading && tracks.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="modal-apple p-8 text-center">
            <div className="spinner-apple mx-auto mb-4" style={{ width: '48px', height: '48px', borderWidth: '4px' }} />
            <h3 className="text-xl font-semibold text-white mb-2 text-apple-title">Uploading Tracks</h3>
            {uploadProgress && (
              <p className="text-blue-400 text-apple-body">{uploadProgress}</p>
            )}
          </div>
        </div>
      )}

      {/* Collection Settings Section */}
      {isOwner && (
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="card-apple-subtle p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <Settings size={24} className="text-gray-400 mr-3 flex-shrink-0" />
                  <h3 className="text-2xl font-semibold text-white text-apple-title">Collection Settings</h3>
                </div>
                <p className="text-gray-400 text-apple-body">
                  Manage your collection settings and options.
                </p>
              </div>
            </div>

            {/* Privacy Toggle */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-white/5 rounded-2xl border border-white/10 gap-4">
                <div className="flex items-center">
                  {collection.is_public ? (
                    <Globe size={24} className="text-blue-500 mr-4 flex-shrink-0" />
                  ) : (
                    <Lock size={24} className="text-gray-400 mr-4 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className="font-semibold text-white text-lg text-apple-title">
                      {collection.is_public ? 'Public Collection' : 'Private Collection'}
                    </h4>
                    <p className="text-gray-400 text-apple-body">
                      {collection.is_public 
                        ? 'Anyone can view and embed this collection'
                        : 'Only you can view this collection'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={collection.is_public}
                    onChange={(e) => handlePrivacyToggle(e.target.checked)}
                    disabled={isUpdatingPrivacy}
                    className="h-5 w-5 rounded border-white/20 text-blue-500 focus:ring-blue-500 bg-white/10 disabled:opacity-50"
                  />
                  <label htmlFor="isPublic" className="ml-3 text-white font-medium">
                    Make public
                  </label>
                  {isUpdatingPrivacy && (
                    <div className="spinner-apple ml-3" />
                  )}
                </div>
              </div>
            </div>

            {/* Delete Section */}
            <div className="pt-6 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-white text-lg mb-2 text-apple-title">Delete Collection</h4>
                  <p className="text-gray-400 text-apple-body">
                    Permanently remove this collection and all its tracks.
                  </p>
                </div>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-full font-medium transition-colors whitespace-nowrap w-full sm:w-auto"
                >
                  Delete Collection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Collection Modal */}
      <DeleteCollectionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCollection}
        collectionTitle={collection.title}
        trackCount={tracks.length}
      />

      {/* Track Actions Modal */}
      <TrackActionsModal
        isOpen={isTrackActionsModalOpen}
        onClose={() => setIsTrackActionsModalOpen(false)}
        track={selectedTrack}
        currentCollectionId={collectionId || ''}
        userCollections={userCollections}
        onMoveTrack={handleMoveTrack}
        onDeleteTrack={handleDeleteTrack}
      />
    </div>
  );
}