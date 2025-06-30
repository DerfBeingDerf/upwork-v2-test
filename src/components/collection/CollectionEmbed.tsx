import React, { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';
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
      
      <div className="flex justify-between items-center">
        <a 
          href={embedUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors"
        >
          Preview embedded player
        </a>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={copyToClipboard}
          className="btn-apple-primary text-sm py-2"
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