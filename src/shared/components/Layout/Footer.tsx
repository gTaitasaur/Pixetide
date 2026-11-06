import React from 'react';

/**
 * Footer minimalista: únicamente muestra la fecha de copyright.
 */
export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white py-8 border-t border-gray-100 mt-24 relative z-10">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 flex justify-center">
        <span className="text-xs text-muted-foreground font-mono">
          © {new Date().getFullYear()} Pixetide
        </span>
      </div>
    </footer>
  );
};
