import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, Sparkles, ArrowRight, Zap, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AudioUploader from '../components/audio/AudioUploader';

export default function UploadPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      // Store the current location in sessionStorage so we can redirect back after login
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      navigate('/login');
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="container mx-auto py-16 px-4 flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <div className="spinner-apple" style={{ width: '48px', height: '48px', borderWidth: '4px' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-white/5 mb-8 border border-white/10">
                <Upload size={40} className="text-blue-500" />
              </div>
              
              <h1 className="text-apple-headline text-white mb-6">
                Share Your Audio
              </h1>
              
              <p className="text-apple-subheadline text-gray-400 mb-10">
                Sign in to upload and create beautiful audio collections that you can share anywhere.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/login')}
                  className="btn-apple-primary px-8 py-4 text-lg"
                >
                  Sign In
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/register')}
                  className="btn-apple-secondary px-8 py-4 text-lg"
                >
                  Create Account
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-12 px-4">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/5 mb-6 border border-white/10">
            <Upload size={32} className="text-blue-500" />
          </div>
          
          <h1 className="text-apple-headline text-white mb-4">
            Upload Your Collection
          </h1>
          
          <p className="text-apple-subheadline text-gray-400 max-w-2xl mx-auto">
            Create beautiful audio collections in one step. Upload your files and we'll organize them perfectly.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto"
        >
          <div className="feature-apple p-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
              <Zap size={24} className="text-blue-500" />
            </div>
            <h3 className="font-semibold text-white mb-2 text-apple-title">Instant Upload</h3>
            <p className="text-gray-400 text-sm text-apple-body">Drag, drop, and you're done</p>
          </div>
          
          <div className="feature-apple p-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
              <Music size={24} className="text-orange-500" />
            </div>
            <h3 className="font-semibold text-white mb-2 text-apple-title">Auto-Organize</h3>
            <p className="text-gray-400 text-sm text-apple-body">We'll extract metadata automatically</p>
          </div>
          
          <div className="feature-apple p-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
              <Sparkles size={24} className="text-orange-500" />
            </div>
            <h3 className="font-semibold text-white mb-2 text-apple-title">Share Instantly</h3>
            <p className="text-gray-400 text-sm text-apple-body">Get embeddable players right away</p>
          </div>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <AudioUploader />
        </motion.div>
      </div>
    </div>
  );
}