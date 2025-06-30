import React, { useState, useRef } from 'react';
import { Upload, X, Music, Loader2, Save, Clock, FileAudio, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { uploadAudioFile, createCollection, addTrackToCollection } from '../../lib/api';
import { getAudioMetadata, formatDuration } from '../../lib/audioUtils';
import { useNavigate } from 'react-router-dom';

type AudioUploaderProps = {
  onUploadComplete?: () => void;
};

type FileWithMetadata = {
  file: File;
  title: string;
  duration: number;
  isProcessing: boolean;
  error?: string;
};

export default function AudioUploader({ onUploadComplete }: AudioUploaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [collectionTitle, setCollectionTitle] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = async (newFiles: File[]) => {
    const audioFiles = newFiles.filter(file => file.type.startsWith('audio/'));
    if (audioFiles.length !== newFiles.length) {
      setError('Some files were skipped. Please select only audio files.');
    } else {
      setError(null);
    }
    
    const filesWithMetadata: FileWithMetadata[] = audioFiles.map(file => ({
      file,
      title: file.name.split('.').slice(0, -1).join('.'),
      duration: 0,
      isProcessing: true
    }));
    
    setFiles(prev => [...prev, ...filesWithMetadata]);
    
    if (!collectionTitle && audioFiles.length > 0) {
      const fileName = audioFiles[0].name.split('.').slice(0, -1).join('.');
      setCollectionTitle(audioFiles.length > 1 ? `${fileName} and ${audioFiles.length - 1} more` : fileName);
    }

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      const fileIndex = files.length + i;
      
      try {
        const metadata = await getAudioMetadata(file);
        
        setFiles(prev => prev.map((f, index) => 
          index === fileIndex 
            ? { 
                ...f, 
                title: metadata.title,
                duration: metadata.duration,
                isProcessing: false 
              }
            : f
        ));
      } catch (err) {
        setFiles(prev => prev.map((f, index) => 
          index === fileIndex 
            ? { 
                ...f, 
                duration: 0,
                isProcessing: false,
                error: 'Could not read audio metadata'
              }
            : f
        ));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const updateFileTitle = (index: number, newTitle: string) => {
    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, title: newTitle } : f
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to upload files.');
      return;
    }
    
    if (files.length === 0) {
      setError('Please select at least one audio file.');
      return;
    }
    
    if (!collectionTitle.trim()) {
      setError('Please enter a title for your collection.');
      return;
    }

    if (files.some(f => f.isProcessing)) {
      setError('Please wait for all files to finish processing.');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      setUploadProgress('Creating collection...');
      const collection = await createCollection(
        collectionTitle,
        user.id,
        collectionDescription || undefined,
        isPublic
      );
      
      const uploadedFiles = [];
      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        setUploadProgress(`Uploading ${fileData.file.name} (${i + 1}/${files.length})...`);
        
        const audioFile = await uploadAudioFile(
          fileData.file,
          fileData.title,
          user.id
        );
        
        await addTrackToCollection(collection.id, audioFile.id, i);
        uploadedFiles.push(audioFile);
      }
      
      setUploadProgress('Finalizing...');
      
      setFiles([]);
      setCollectionTitle('');
      setCollectionDescription('');
      setIsPublic(true);
      
      navigate(`/collection/${collection.id}`);
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload and save collection.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const getTotalDuration = () => {
    return files.reduce((total, file) => total + file.duration, 0);
  };

  return (
    <div className="space-y-8">
      {/* Main Upload Card */}
      <div className="card-apple p-8">
        <div className="flex items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mr-4 border border-white/10">
            <Upload size={24} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white text-apple-title">Upload Audio Files</h2>
            <p className="text-gray-400">Drag and drop your audio files or click to browse</p>
          </div>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="status-apple-error p-4 rounded-2xl mb-6 text-sm"
          >
            {error}
          </motion.div>
        )}
        
        {/* File Drop Zone */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragging 
              ? 'border-orange-500 bg-orange-500/5' 
              : 'border-white/20 hover:border-orange-500/50 hover:bg-white/2'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="audio/*"
            multiple
          />
          
          {files.length === 0 ? (
            <div className="py-8">
              <motion.div 
                className="mx-auto w-16 h-16 mb-6 bg-white/5 rounded-3xl flex items-center justify-center text-orange-500 border border-white/10"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <FileAudio size={32} />
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2">Drop your audio files here</h3>
              <p className="text-gray-400 mb-4">or click to browse your computer</p>
              <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
                <span className="bg-white/5 px-3 py-1 rounded-lg border border-white/10">MP3</span>
                <span className="bg-white/5 px-3 py-1 rounded-lg border border-white/10">WAV</span>
                <span className="bg-white/5 px-3 py-1 rounded-lg border border-white/10">OGG</span>
                <span className="bg-white/5 px-3 py-1 rounded-lg border border-white/10">FLAC</span>
              </div>
              <p className="text-xs text-gray-500 mt-4">Max 50MB per file</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center mr-3 border border-white/10">
                    <Music size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{files.length} file{files.length > 1 ? 's' : ''} selected</p>
                    {files.length > 0 && (
                      <div className="flex items-center text-sm text-gray-400">
                        <Clock size={14} className="mr-1" />
                        <span>Total: {formatDuration(getTotalDuration())}</span>
                      </div>
                    )}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-apple-secondary text-sm py-2"
                >
                  <Upload size={16} className="mr-2" />
                  Add More
                </motion.button>
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-3">
                <AnimatePresence>
                  {files.map((fileData, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white/5 p-4 rounded-2xl border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                            <Music size={16} className="text-orange-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">{fileData.file.name}</p>
                            <p className="text-xs text-gray-400">{(fileData.file.size / 1024 / 1024).toFixed(1)} MB</p>
                          </div>
                          {fileData.isProcessing && (
                            <div className="spinner-apple flex-shrink-0" />
                          )}
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="text-gray-400 hover:text-red-400 p-1 rounded-lg transition-colors flex-shrink-0"
                        >
                          <X size={16} />
                        </motion.button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={fileData.title}
                          onChange={(e) => updateFileTitle(index, e.target.value)}
                          className="input-apple text-sm px-3 py-2 flex-1 mr-3"
                          placeholder="Track title"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="text-xs text-gray-400 flex items-center">
                          {fileData.isProcessing ? (
                            <span>Processing...</span>
                          ) : fileData.error ? (
                            <span className="text-orange-500">Unknown duration</span>
                          ) : (
                            <span className="font-medium">{formatDuration(fileData.duration)}</span>
                          )}
                        </div>
                      </div>
                      
                      {fileData.error && (
                        <div className="text-xs text-orange-500 mt-2">{fileData.error}</div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Collection Details Card */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card-apple p-8"
        >
          <div className="flex items-center mb-6">
            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mr-4 border border-white/10">
              <Sparkles size={24} className="text-orange-500" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white text-apple-title">Collection Details</h3>
              <p className="text-gray-400">Customize how your collection appears</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="collectionTitle" className="block text-sm font-medium text-gray-300 mb-2">
                  Collection Title *
                </label>
                <input
                  type="text"
                  id="collectionTitle"
                  value={collectionTitle}
                  onChange={(e) => setCollectionTitle(e.target.value)}
                  className="input-apple"
                  placeholder="My Audio Collection"
                  required
                />
              </div>
              
              <div className="flex items-center pt-8">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-5 w-5 rounded border-white/20 text-orange-500 focus:ring-orange-500 bg-white/10"
                />
                <label htmlFor="isPublic" className="ml-3 text-white font-medium">
                  Make this collection public and embeddable
                </label>
              </div>
            </div>
            
            <div>
              <label htmlFor="collectionDescription" className="block text-sm font-medium text-gray-300 mb-2">
                Collection Description
              </label>
              <textarea
                id="collectionDescription"
                value={collectionDescription}
                onChange={(e) => setCollectionDescription(e.target.value)}
                className="input-apple min-h-[100px] resize-none"
                placeholder="Describe your collection (optional)"
              />
            </div>
            
            {/* Upload Progress */}
            <AnimatePresence>
              {isUploading && uploadProgress && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="status-apple-success p-4 rounded-2xl border border-orange-500/30"
                >
                  <div className="flex items-center">
                    <div className="spinner-apple mr-3" />
                    <span className="text-orange-400 font-medium">{uploadProgress}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex justify-end pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isUploading || files.length === 0 || files.some(f => f.isProcessing)}
                className={`btn-apple-primary px-8 py-4 text-lg ${(files.length === 0 || isUploading || files.some(f => f.isProcessing)) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUploading ? (
                  <span className="flex items-center">
                    <div className="spinner-apple mr-2" />
                    Creating Collection...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="mr-2 h-5 w-5" />
                    Create Collection
                  </span>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}