import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Sparkles, ArrowRight, Music, Upload, Globe } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      period: 'forever',
      description: 'Perfect for getting started with audio sharing',
      icon: <Music className="h-6 w-6 text-blue-500 icon-glow" />,
      features: [
        'Up to 5 collections',
        'Up to 25 audio files',
        'Basic embeddable players',
        'Public sharing',
        'Community support'
      ],
      cta: 'Get Started',
      popular: false,
      gradient: 'from-blue-500/10 to-blue-600/5'
    },
    {
      name: 'Creator',
      price: '$9',
      period: 'per month',
      description: 'For creators who want more power and customization',
      icon: <Zap className="h-6 w-6 text-orange-500 icon-glow-orange" />,
      features: [
        'Unlimited collections',
        'Up to 500 audio files',
        'Advanced player customization',
        'Custom branding',
        'Analytics dashboard',
        'Priority support',
        'Private collections'
      ],
      cta: 'Start Creating',
      popular: true,
      gradient: 'from-orange-500/10 to-orange-600/5'
    },
    {
      name: 'Professional',
      price: '$29',
      period: 'per month',
      description: 'For professionals and teams who need everything',
      icon: <Crown className="h-6 w-6 text-purple-500" />,
      features: [
        'Everything in Creator',
        'Unlimited audio files',
        'Team collaboration',
        'White-label solutions',
        'API access',
        'Advanced analytics',
        'Dedicated support',
        'Custom integrations'
      ],
      cta: 'Go Professional',
      popular: false,
      gradient: 'from-purple-500/10 to-purple-600/5'
    }
  ];

  const features = [
    {
      icon: <Upload className="h-6 w-6 text-blue-500 icon-glow" />,
      title: 'Instant Upload',
      description: 'Drag and drop your audio files for instant processing and organization.'
    },
    {
      icon: <Globe className="h-6 w-6 text-orange-500 icon-glow-orange" />,
      title: 'Universal Embedding',
      description: 'Embed your collections anywhere on the web with responsive players.'
    },
    {
      icon: <Sparkles className="h-6 w-6 text-purple-500" />,
      title: 'Beautiful Design',
      description: 'Apple-inspired design that looks stunning on any website or platform.'
    }
  ];

  const handleGetStarted = (planName: string) => {
    if (!user) {
      navigate('/register');
    } else {
      // For now, redirect to upload page
      // In a real app, this would handle subscription logic
      navigate('/upload');
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center hero-apple hero-glow">
        <div className="w-full max-w-none px-8 sm:px-12 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              style={{ y: y1 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-apple-display text-white mb-6 heading-glow">
                Choose Your
                <br />
                <span className="bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent">
                  Audio Journey
                </span>
              </h1>
              
              <p className="text-apple-subheadline text-gray-300 mb-12 max-w-3xl mx-auto">
                From free sharing to professional solutions, find the perfect plan for your audio content needs.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 relative">
        <div className="w-full max-w-none px-8 sm:px-12 lg:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative ${plan.popular ? 'lg:-mt-8 lg:mb-8' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <div className={`card-apple h-full relative overflow-hidden ${plan.popular ? 'border-orange-500/30' : ''}`}>
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-50`} />
                    
                    <div className="relative p-8 flex flex-col h-full">
                      {/* Plan Header */}
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white/5 mb-4 border border-white/10">
                          {plan.icon}
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-2 text-apple-title">{plan.name}</h3>
                        <p className="text-gray-400 text-sm text-apple-body">{plan.description}</p>
                      </div>

                      {/* Pricing */}
                      <div className="text-center mb-8">
                        <div className="flex items-baseline justify-center">
                          <span className="text-4xl font-bold text-white">{plan.price}</span>
                          {plan.price !== 'Free' && (
                            <span className="text-gray-400 ml-2 text-apple-body">/{plan.period}</span>
                          )}
                        </div>
                        {plan.price === 'Free' && (
                          <span className="text-gray-400 text-sm text-apple-body">{plan.period}</span>
                        )}
                      </div>

                      {/* Features - flex-grow to push button to bottom */}
                      <div className="space-y-4 mb-8 flex-grow">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center">
                            <Check size={16} className="text-green-500 mr-3 flex-shrink-0" />
                            <span className="text-gray-300 text-sm text-apple-body">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button - positioned at bottom */}
                      <div className="mt-auto">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleGetStarted(plan.name)}
                          className={`w-full py-4 rounded-full font-medium transition-all duration-200 text-lg ${
                            plan.popular
                              ? 'btn-apple-primary'
                              : 'btn-apple-secondary'
                          }`}
                        >
                          {plan.cta}
                          <ArrowRight className="ml-2 h-5 w-5 inline" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="w-full max-w-none px-8 sm:px-12 lg:px-16">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-apple-headline text-white mb-6 heading-glow">
              Why Choose ACE?
            </h2>
            <p className="text-apple-subheadline text-gray-400 max-w-2xl mx-auto">
              Built for creators who demand the best in audio sharing and embedding
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

      {/* FAQ Section */}
      <section className="py-24 relative">
        <div className="w-full max-w-none px-8 sm:px-12 lg:px-16">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-apple-headline text-white mb-6 heading-glow">
                Frequently Asked Questions
              </h2>
            </motion.div>

            <div className="space-y-6">
              {[
                {
                  question: "Can I upgrade or downgrade my plan anytime?",
                  answer: "Yes, you can change your plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
                },
                {
                  question: "What audio formats do you support?",
                  answer: "We support all major audio formats including MP3, WAV, FLAC, OGG, and more. Our system automatically optimizes files for web playback."
                },
                {
                  question: "Are there any bandwidth limitations?",
                  answer: "No bandwidth limits on any plan. Your embedded players will load quickly regardless of how many people listen to your content."
                },
                {
                  question: "Can I use my own domain for embedded players?",
                  answer: "Yes, Professional plan includes white-label solutions where you can use your own domain and branding for embedded players."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card-apple-subtle p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-3 text-apple-title">{faq.question}</h3>
                  <p className="text-gray-400 text-apple-body">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-orange-500/5" />
        <div className="w-full max-w-none px-8 sm:px-12 lg:px-16 text-center relative">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-apple-headline text-white mb-6 heading-glow">
              Ready to Share Your Audio?
            </h2>
            <p className="text-apple-subheadline text-gray-400 mb-10">
              Start with our free plan and upgrade as you grow. No credit card required to get started.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGetStarted('Free')}
                className="btn-apple-primary px-10 py-4 text-lg"
              >
                <Sparkles className="mr-2 h-5 w-5 icon-glow" />
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/login')}
                className="btn-apple-secondary px-10 py-4 text-lg"
              >
                Sign In
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}