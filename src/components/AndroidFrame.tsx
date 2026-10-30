import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

interface AndroidFrameProps {
  isPhoneFrame: boolean;
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ isPhoneFrame, children }) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!isPhoneFrame) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900/90 py-4 sm:py-8 px-2 sm:px-4 flex items-center justify-center">
      {/* Android Device Shell */}
      <div className="w-full max-w-[420px] bg-white rounded-[40px] shadow-2xl overflow-hidden border-[8px] border-slate-800 flex flex-col relative h-[860px] max-h-[95vh]">
        {/* Android Punch Hole Camera & Status Bar */}
        <div className="h-9 bg-white px-5 flex items-center justify-between text-slate-700 text-xs font-semibold select-none shrink-0 border-b border-slate-100 z-50">
          <span className="font-mono text-[11px] font-bold">{currentTime || '09:41'}</span>

          {/* Front Camera cutout circle */}
          <div className="w-3.5 h-3.5 rounded-full bg-slate-800 border-2 border-slate-700 shrink-0" />

          {/* Android Status Icons */}
          <div className="flex items-center gap-1.5 text-slate-600">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <BatteryMedium className="w-4 h-4 text-slate-800" />
          </div>
        </div>

        {/* Scrollable Device Display Area */}
        <div className="flex-1 overflow-y-auto relative bg-slate-50 pb-20 no-scrollbar">
          {children}
        </div>

        {/* Android Home Navigation Bar Pill */}
        <div className="absolute bottom-1 left-0 right-0 h-4 flex items-center justify-center pointer-events-none z-50">
          <div className="w-32 h-1 bg-slate-400/80 rounded-full" />
        </div>
      </div>
    </div>
  );
};
