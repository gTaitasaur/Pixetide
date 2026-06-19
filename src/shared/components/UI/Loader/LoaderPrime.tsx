import React from 'react';

interface LoaderPrimeProps {
  message?: string;
}

export const LoaderPrime: React.FC<LoaderPrimeProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <style>{`
        .loader-prime-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .loader-prime-goo {
          width: 12em;
          height: 3em;
          position: relative;
          overflow: hidden;
          border-bottom: 8px solid #a855f7;
          filter: url(#goo);
        }

        .loader-prime-goo::before {
          content: '';
          width: 22em;
          height: 18em;
          background: #a855f7;
          position: absolute;
          border-radius: 50%;
          left: -2em;
          bottom: -18em;
          animation: wee1 2s linear infinite;
        }

        .loader-prime-goo::after {
          content: '';
          width: 16em;
          height: 12em;
          background: #3b82f6;
          position: absolute;
          border-radius: 50%;
          left: -4em;
          bottom: -12em;
          animation: wee2 2s linear infinite 0.75s;
        }

        @keyframes wee1 {
          0% {
            transform: translateX(-10em) rotate(0deg);
          }
          100% {
            transform: translateX(7em) rotate(180deg);
          }
        }

        @keyframes wee2 {
          0% {
            transform: translateX(-8em) rotate(0deg);
          }
          100% {
            transform: translateX(8em) rotate(180deg);
          }
        }
      `}</style>
      <div className="loader-prime-wrapper">
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation={12} />
            <feColorMatrix values="0 0 0 0 0 
            0 0 0 0 0 
            0 0 0 0 0 
            0 0 0 48 -7" />
          </filter>
        </svg>
        <div className="loader-prime-goo" />
      </div>
      {message && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse text-center max-w-[280px]">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoaderPrime;
