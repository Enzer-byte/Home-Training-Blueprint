import React from 'react';
import { Zap, RotateCcw, ShieldCheck, Download } from 'lucide-react';

interface TrustBadgesProps {
  note?: string;
  className?: string;
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({ className = '' }) => {
  return (
    <div className={`trust-badges-bar ${className}`} id="trust-badges-container">
      <div className="flex items-center justify-center flex-wrap sm:flex-nowrap gap-x-3 sm:gap-x-4 md:gap-5 gap-y-2 text-[11.5px] sm:text-xs md:text-[12.5px] text-[#475569] font-medium tracking-tight">
        <div className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0" id="badge-email-delivery">
          <Zap size={14} className="text-[#2563EB] shrink-0" />
          <span>Instant Email Delivery</span>
        </div>
        <span className="hidden sm:inline text-slate-300 select-none">•</span>
        <div className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0" id="badge-guarantee">
          <RotateCcw size={14} className="text-[#059669] shrink-0" />
          <span>7-Day Guarantee</span>
        </div>
        <span className="hidden sm:inline text-slate-300 select-none">•</span>
        <div className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0" id="badge-publisher">
          <ShieldCheck size={14} className="text-[#0F172A] shrink-0" />
          <span>Verified Publisher</span>
        </div>
        <span className="hidden sm:inline text-slate-300 select-none">•</span>
        <div className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0" id="badge-download">
          <Download size={14} className="text-[#0022DA] shrink-0" />
          <span>Immediate Digital Download</span>
        </div>
      </div>
    </div>
  );
};

