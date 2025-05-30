import React from 'react';
import { Sparkles } from 'lucide-react';

const BoltBanner: React.FC = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center space-x-1 bg-surface-800 text-white px-3 py-1.5 rounded-full shadow-lg">
        <Sparkles size={16} className="text-primary-400" />
        <span className="text-sm font-medium">Built with Bolt.new</span>
      </div>
    </div>
  );
};

export default BoltBanner;