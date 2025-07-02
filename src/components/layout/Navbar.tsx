import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Music, User, LogOut, Home, Library, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import aceLogo from '../../assets/ACE Logo v1.png';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'nav-apple' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container mx-auto">
        {/* Main Navigation */}
        <div className="h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              <img 
                src={aceLogo} 
                alt="ACE" 
                className="h-10 w-auto object-contain"
              />
            </motion.div>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive('/') 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Home
            </Link>
            
            <Link 
              to="/library" 
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive('/library') 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Library
            </Link>
            
            <Link 
              to="/upload" 
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive('/upload') 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Upload
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="hidden sm:inline text-sm text-gray-400">
                  {user.email?.split('@')[0]}
                </span>
                <button 
                  onClick={handleSignOut}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-6">
                <Link 
                  to="/login" 
                  className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="btn-apple-primary text-sm px-4 py-2"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-white/10">
          <nav className="flex items-center justify-around py-2">
            <Link 
              to="/" 
              className={`flex flex-col items-center py-2 px-3 text-xs ${
                isActive('/') 
                  ? 'text-white' 
                  : 'text-gray-400'
              }`}
            >
              <Home size={16} />
              <span className="mt-1">Home</span>
            </Link>
            
            <Link 
              to="/library" 
              className={`flex flex-col items-center py-2 px-3 text-xs ${
                isActive('/library') 
                  ? 'text-white' 
                  : 'text-gray-400'
              }`}
            >
              <Library size={16} />
              <span className="mt-1">Library</span>
            </Link>
            
            <Link 
              to="/upload" 
              className={`flex flex-col items-center py-2 px-3 text-xs ${
                isActive('/upload') 
                  ? 'text-white' 
                  : 'text-gray-400'
              }`}
            >
              <Upload size={16} />
              <span className="mt-1">Upload</span>
            </Link>
          </nav>
        </div>
      </div>
    </motion.header>
  );
}