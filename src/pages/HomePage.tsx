import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Upload, ListMusic, ExternalLink, Sparkles, Zap, Globe, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const features = [
    {
      icon: <Upload className="h-6 w-6 text-blue-500 icon-glow" />,
      title: 'Upload & Organize',
      description: 'Seamlessly upload your audio files and organize them into beautiful collections.',
    },
    {
      icon: <ListMusic className="h-6 w-6 text-orange-500 icon-glow-orange" />,
      title: 'Create Collections',
      description: 'Curate your audio into themed collections with intuitive management tools.',
    },
    {
      icon: <Globe className="h-6 w-6 text-orange-400 icon-glow-orange" />,
      title: 'Share Anywhere',
      description: 'Embed your collections on any website with our responsive audio players.',
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center hero-apple hero-glow">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              style={{ y: y1 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-apple-display text-white mb-6 heading-glow">
                Share Your
                <br />
                <span className="bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent">
                  Audio Vision
                </span>
              </h1>
              
              <p className="text-apple-subheadline text-gray-300 mb-12 max-w-3xl mx-auto">
                Create stunning audio collections with embeddable players that work beautifully anywhere on the web.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/library')}
                      className="btn-apple-primary px-8 py-4 text-lg"
                    >
                      <Sparkles className="mr-2 h-5 w-5 icon-glow" />
                      My Library
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/upload')}
                      className="btn-apple-secondary px-8 py-4 text-lg"
                    >
                      <Upload className="mr-2 h-5 w-5" />
                      Upload Audio
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/register')}
                      className="btn-apple-primary px-8 py-4 text-lg"
                    >
                      <Sparkles className="mr-2 h-5 w-5 icon-glow" />
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/login')}
                      className="btn-apple-secondary px-8 py-4 text-lg"
                    >
                      Sign In
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-apple-headline text-white mb-6 heading-glow">
              Powerful Features
            </h2>
            <p className="text-apple-subheadline text-gray-400 max-w-2xl mx-auto">
              Everything you need to share your audio content professionally
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="feature-apple feature-glow p-8 text-center group"
              >
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white/5 mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 border border-white/10 glow-subtle">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white text-apple-title">{feature.title}</h3>
                <p className="text-gray-400 text-apple-body">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-orange-500/5" />
        <div className="container mx-auto px-4 text-center relative">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-apple-headline text-white mb-6 heading-glow">
              Ready to Elevate Your Audio?
            </h2>
            <p className="text-apple-subheadline text-gray-400 mb-10">
              Join creators who are already sharing their audio content with beautiful, embeddable players.
            </p>
            
            {!user && (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/register')}
                className="btn-apple-primary px-10 py-4 text-lg"
              >
                <ExternalLink className="mr-2 h-5 w-5 icon-glow" />
                Start Creating
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.button>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}