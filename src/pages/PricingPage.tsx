import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Sparkles, ArrowRight, Music, Upload, Globe, Calendar, Loader2 } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { createCheckoutSession } from '../lib/stripeApi';
import { stripeProducts } from '../stripe-config';

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const plans = [
    {
      name: 'Pro Monthly',
      price: '$5',
      period: 'per month',
      description: 'Unlock embeddable players with flexible monthly billing',
      icon: <Zap className="h-6 w-6 text-orange-500 icon-glow-orange" />,
      features: [
        'Unlimited collections',
        'Unlimited audio files',
        'Embeddable audio players',
        'Custom player styling',
        'Advanced analytics',
        'Priority support',
        '7-day free trial',
        'Cancel anytime'
      ],
      cta: 'Start 7-Day Free Trial',
      popular: true,
      gradient: 'from-orange-500/10 to-orange-600/5',
      highlight: true,
      badge: '7-Day Free Trial',
      stripeProduct: stripeProducts.find(p => p.name === 'Pro Monthly')!
    },
    {
      name: 'Pro Lifetime',
      price: '$50',
      period: 'one-time payment',
      description: 'Get embeddable players forever with a single payment',
      icon: <Crown className="h-6 w-6 text-purple-500" />,
      features: [
        'Everything in Pro Monthly',
        'Lifetime access',
        'No recurring payments',
        'Future feature updates',
        'Premium support',
        'Best value option',
        'Pay once, own forever',
        'No subscription fees'
      ],
      cta: 'Buy Lifetime Access',
      popular: false,
      gradient: 'from-purple-500/10 to-purple-600/5',
      highlight: false,
      badge: 'Best Value',
      stripeProduct: stripeProducts.find(p => p.name === 'Pro Lifetime')!
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
      title: 'Embeddable Players',
      description: 'Embed your collections anywhere on the web with beautiful, responsive players.'
    },
    {
      icon: <Sparkles className="h-6 w-6 text-purple-500" />,
      title: 'Beautiful Design',
      description: 'Apple-inspired design that looks stunning on any website or platform.'
    }
  ];

  const handleGetStarted = async (plan: typeof plans[0]) => {
    if (!user) {
      navigate('/register');
      return;
    }

    if (!plan.stripeProduct) {
      console.error('Stripe product not found for plan:', plan.name);
      return;
    }

    try {
      setLoadingPlan(plan.name);

      const successUrl = `${window.location.origin}/success`;
      const cancelUrl = `${window.location.origin}/pricing`;

      const { url } = await createCheckoutSession({
        priceId: plan.stripeProduct.priceId,
        successUrl,
        cancelUrl,
        mode: plan.stripeProduct.mode
      });

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      // You could show an error toast here
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 flex items-center hero-apple hero-glow">
        <div className="w-full max-w-none px-8 sm:px-12 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              style={{ y: y1 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 heading-glow">
                Unlock
                <br />
                <span className="bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent">
                  Embeddable Players
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Choose between flexible monthly billing or lifetime access to embed your audio collections anywhere on the web.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 relative">
        <div className="w-full max-w-none px-8 sm:px-12 lg:px-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <div className={`text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
                          : 'bg-gradient-to-r from-purple-500 to-purple-600'
                      }`}>
                        {plan.badge}
                      </div>
                    </div>
                  )}
                  
                  <div className={`card-apple relative overflow-hidden min-h-[600px] flex flex-col ${
                    plan.popular ? 'border-orange-500/30' : 'border-purple-500/30'
                  }`}>
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-50`} />
                    
                    <div className="relative p-8 flex flex-col h-full">
                      {/* Plan Header */}
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/5 mb-3 border border-white/10">
                          {plan.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2 text-apple-title">{plan.name}</h3>
                        <p className="text-gray-400 text-sm text-apple-body">{plan.description}</p>
                      </div>

                      {/* Pricing */}
                      <div className="text-center mb-6">
                        <div className="mb-2">
                          <span className="text-4xl font-bold text-white">{plan.price}</span>
                        </div>
                        <div className="text-gray-400 text-sm text-apple-body">
                          {plan.period}
                        </div>
                        {plan.name === 'Pro Monthly' && (
                          <div className="mt-3 text-green-400 text-sm font-medium flex items-center justify-center">
                            <Calendar size={14} className="mr-1" />
                            First week free
                          </div>
                        )}
                        {plan.name === 'Pro Lifetime' && (
                          <div className="mt-3 text-purple-400 text-sm font-medium">
                            Pay once, own forever
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <div className="space-y-3 mb-8 flex-grow">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center">
                            <Check size={16} className="text-green-500 mr-3 flex-shrink-0" />
                            <span className="text-gray-300 text-sm text-apple-body">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <div className="mt-auto">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleGetStarted(plan)}
                          disabled={loadingPlan === plan.name}
                          className={`btn-apple-primary w-full text-lg ${
                            plan.name === 'Pro Lifetime' 
                              ? 'btn-purple-gradient' 
                              : ''
                          } ${loadingPlan === plan.name ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                          {loadingPlan === plan.name ? (
                            <span className="flex items-center justify-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </span>
                          ) : (
                            <>
                              {plan.cta}
                              <ArrowRight className="ml-2 h-4 w-4 inline" />
                            </>
                          )}
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

      {/* Comparison Section */}
      <section className="py-16 relative">
        <div className="w-full max-w-none px-8 sm:px-12 lg:px-16">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 heading-glow">
                What's Included
              </h2>
              <p className="text-lg text-gray-400">
                Both plans include everything you need for professional audio sharing
              </p>
            </motion.div>

            <div className="card-apple-subtle p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 text-apple-title">Core Features</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-300 text-apple-body">Upload and organize unlimited audio files</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-300 text-apple-body">Create unlimited collections</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-300 text-apple-body">Beautiful waveform audio players</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-300 text-apple-body">Public sharing with direct links</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 text-apple-title">Pro Features</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-300 text-apple-body">Embeddable players for any website</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-300 text-apple-body">Custom player styling and branding</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-300 text-apple-body">Advanced analytics and insights</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-300 text-apple-body">Priority customer support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 relative">
        <div className="w-full max-w-none px-8 sm:px-12 lg:px-16">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 heading-glow">
              Why Choose ACE?
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Built for creators who demand the best in audio sharing and embedding
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="feature-apple feature-glow p-6 text-center group"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/5 mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 border border-white/10 glow-subtle">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white text-apple-title">{feature.title}</h3>
                <p className="text-gray-400 text-apple-body">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 relative">
        <div className="w-full max-w-none px-8 sm:px-12 lg:px-16">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 heading-glow">
                Frequently Asked Questions
              </h2>
            </motion.div>

            <div className="space-y-4">
              {[
                {
                  question: "What happens after my free trial ends?",
                  answer: "After your 7-day free trial, you'll be charged $5/month to continue using embeddable players. If you don't upgrade, your embedded players will show a deactivation message with a link to upgrade."
                },
                {
                  question: "Can I switch between monthly and lifetime plans?",
                  answer: "Yes! You can upgrade from monthly to lifetime at any time. We'll credit your remaining monthly subscription toward the lifetime purchase."
                },
                {
                  question: "What happens to my embedded players if I cancel?",
                  answer: "If you cancel your subscription, embedded players will display a message that the collection is deactivated, with a link to reactivate by upgrading your plan."
                },
                {
                  question: "Is the lifetime plan really forever?",
                  answer: "Yes! The $50 lifetime plan gives you permanent access to embeddable players with no recurring fees. You'll also receive all future feature updates."
                },
                {
                  question: "What audio formats do you support?",
                  answer: "We support all major audio formats including MP3, WAV, FLAC, OGG, and more. Our system automatically optimizes files for web playback."
                },
                {
                  question: "Can I use ACE without paying?",
                  answer: "ACE is designed specifically for embeddable audio players. Both our plans include unlimited audio hosting and all core features - the only difference is the billing frequency."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card-apple-subtle p-5"
                >
                  <h3 className="text-lg font-semibold text-white mb-2 text-apple-title">{faq.question}</h3>
                  <p className="text-gray-400 text-apple-body">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-orange-500/5" />
        <div className="w-full max-w-none px-8 sm:px-12 lg:px-16 text-center relative">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 heading-glow">
              Ready to Embed Your Audio?
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Start with a free 7-day trial or get lifetime access. No credit card required for the trial.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGetStarted(plans[0])}
                disabled={loadingPlan === 'Pro Monthly'}
                className={`btn-apple-primary px-8 py-3 text-lg ${loadingPlan === 'Pro Monthly' ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {loadingPlan === 'Pro Monthly' ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>
                    <Calendar className="mr-2 h-5 w-5" />
                    Start 7-Day Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGetStarted(plans[1])}
                disabled={loadingPlan === 'Pro Lifetime'}
                className={`inline-flex items-center justify-center px-8 py-3 rounded-full font-medium text-white text-lg transition-all duration-200 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-purple-500/25 ${loadingPlan === 'Pro Lifetime' ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {loadingPlan === 'Pro Lifetime' ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>
                    <Crown className="mr-2 h-5 w-5" />
                    Buy Lifetime Access
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}