import React from 'react';

const ScanOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-amber-500/5 mix-blend-overlay"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-scan"></div>
      <div className="absolute bottom-4 right-4 text-xs font-mono text-amber-500 animate-pulse">
        PROCESSING_GLYPHS...
      </div>
    </div>
  );
};

export default ScanOverlay;