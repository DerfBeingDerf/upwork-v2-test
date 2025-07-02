import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

type AuthFormProps = {
  mode: 'login' | 'register';
  onSubmit: (email: string, password: string) => Promise<void>;
};

export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit(email, password);
      
      // Check if there's a redirect path stored in sessionStorage
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Clear any stored redirect path when component unmounts or mode changes
  useEffect(() => {
    return () => {
      if (mode === 'register') {
        sessionStorage.removeItem('redirectAfterLogin');
      }
    };
  }, [mode]);

  return (
    <div className="max-w-md w-full mx-auto">
      <div className="text-center mb-10">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex justify-center"
        >
          <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
            <Music size={32} className="text-blue-500" />
          </div>
        </motion.div>
        <h1 className="text-apple-headline text-white mb-4">
          {mode === 'login' ? 'Welcome Back' : 'Join AudioShare'}
        </h1>
        <p className="text-gray-400 text-apple-body">
          {mode === 'login' 
            ? 'Sign in to access your audio library' 
            : 'Start creating and sharing your audio collections'}
        </p>
      </div>

      <motion.form 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        onSubmit={handleSubmit} 
        className="card-apple p-8"
      >
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="status-apple-error p-4 rounded-xl mb-6 text-sm"
          >
            {error}
          </motion.div>
        )}

        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-apple w-full"
              placeholder="your@email.com"
              required
              style={{ paddingLeft: '3rem' }}
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
          </div>
        </div>

        <div className="mb-8">
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-apple w-full"
              placeholder="••••••••"
              required
              style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors z-10"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="btn-apple-primary w-full text-lg py-4"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="spinner-apple mr-3" />
              Processing...
            </span>
          ) : (
            mode === 'login' ? 'Sign In' : 'Create Account'
          )}
        </motion.button>

        <div className="mt-6 text-center text-gray-400">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <a href="/register" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
                Sign up
              </a>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <a href="/login" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
                Sign in
              </a>
            </>
          )}
        </div>
      </motion.form>
    </div>
  );
}