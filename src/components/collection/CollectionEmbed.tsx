import React, { useState } from 'react';
import { Copy, Check, Code, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

type CollectionEmbedProps = {
  collectionId: string;
};

export default function CollectionEmbed({ collectionId }: CollectionEmbedProps) {
  const [copied, setCopied] = useState(false);
  
  // Create the embed code with responsive styling
  const hostUrl = window.location.origin;
  const embedUrl = `${hostUrl}/embed/${collectionId}`;
  const embedCode = `<iframe 
  src="${embedUrl}"
  style="border: 0; width: 100%; height: 100%; min-height: 400px; overflow: auto; background: transparent;"
  scrolling="yes"
  allow="encrypted-media"
></iframe>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="card-apple p-6">
      <div className="flex items-center mb-6">
        <Code className="text-blue-500 mr-3" size={24} />
        <h3 className="text-xl font-semibold text-white text-apple-title">Embed Collection</h3>
      </div>
      
      <p className="text-gray-400 text-sm mb-6 leading-relaxed text-apple-body">
        Copy this code to embed your collection on any website or blog.
      </p>
      
      <div className="bg-white/5 rounded-2xl p-4 overflow-x-auto mb-6 border border-white/10">
        <pre className="text-gray-300 text-sm">
          <code>{embedCode}</code>
        </pre>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.a 
          href={embedUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium transition-all duration-200 border border-white/20 hover:border-white/30 text-sm"
        >
          <ExternalLink size={16} className="mr-2" />
          Preview Embedded Player
        </motion.a>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={copyToClipboard}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl font-medium transition-all duration-200 text-white text-sm"
          style={{
            background: 'linear-gradient(135deg, #007aff 0%, #ff9500 100%)',
            boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3), 0 0 15px rgba(255, 149, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #0056cc 0%, #e6850e 100%)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 122, 255, 0.3), 0 0 20px rgba(255, 149, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #007aff 0%, #ff9500 100%)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 122, 255, 0.3), 0 0 15px rgba(255, 149, 0, 0.1)';
          }}
        >
          {copied ? (
            <span className="flex items-center">
              <Check size={16} className="mr-2" /> Copied!
            </span>
          ) : (
            <span className="flex items-center">
              <Copy size={16} className="mr-2" /> Copy Code
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
}