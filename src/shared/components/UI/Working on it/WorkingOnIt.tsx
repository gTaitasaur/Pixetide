import React from 'react';

const Tooltip: React.FC = () => {
  return (
    <div className="group relative flex flex-col items-center mt-[60px]" style={{ filter: 'url("#goo")' }}>
      <div className="
        absolute bottom-[50px] w-[60px] h-[60px] bg-black rounded-full opacity-0 
        flex items-center justify-center transition-all duration-600 ease-[cubic-bezier(0.34,1.56,0.64,1)] 
        translate-y-[40px] scale-10 
        group-hover:opacity-100 group-hover:w-[260px] group-hover:h-[80px] group-hover:rounded-[20px] 
        group-hover:-translate-y-[60px] group-hover:scale-100
        before:content-[''] before:absolute before:-inset-[5px] before:rounded-[inherit] 
        before:bg-[linear-gradient(45deg,#ff00ff,#00ffff,#ff00ff)] before:-z-10 before:blur-[10px] 
        before:animate-[spin_2s_linear_infinite] before:opacity-0 before:transition-opacity before:duration-500 
        group-hover:before:opacity-70
      ">
        <div className="
          opacity-0 transition-opacity duration-300 text-white font-['Syncopate',sans-serif] 
          text-sm font-bold tracking-[2px] text-center drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] 
          group-hover:opacity-100 group-hover:delay-400 px-4
        ">
          <span className="glitch-text">Web Under Construction</span>
          <div className="particles" />
        </div>
      </div>

      <button className="
        relative z-10 px-10 py-5 bg-black text-white border-none rounded-lg cursor-pointer 
        font-['Syncopate',sans-serif] font-black tracking-[2px] transition-all duration-300 
        shadow-[0_0_0px_rgba(255,255,255,0)] 
        group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:scale-95 group-hover:tracking-[6px]
      ">
        Press Me!
      </button>

      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{ display: 'block', width: 0, height: 0 }}>
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation={10} result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default Tooltip;
