import React from 'react';
import { ShieldCheck, Zap, RotateCcw, Lock } from 'lucide-react';

interface TrustBadgesProps {
  note?: string;
  className?: string;
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({ note, className = '' }) => {
  return (
    <div className={`trust-badges-bar ${className}`} id="trust-badges-container">
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-[#55483A]">
        <div className="flex items-center gap-1.5" id="badge-security">
          <Lock size={15} className="text-[#A64B2A]" />
          <span>256-Bit SSL Checkout</span>
        </div>
        <div className="flex items-center gap-1.5" id="badge-delivery">
          <Zap size={15} className="text-[#C08A2E]" />
          <span>Instant Email Delivery</span>
        </div>
        <div className="flex items-center gap-1.5" id="badge-guarantee">
          <RotateCcw size={15} className="text-[#5C6B4E]" />
          <span>7-Day Guarantee</span>
        </div>
        <div className="flex items-center gap-1.5" id="badge-verified">
          <ShieldCheck size={15} className="text-[#24344B]" />
          <span>Verified Publisher</span>
        </div>
      </div>
      {note && (
        <div className="w-full text-center text-xs text-[#55483A] mt-1.5 opacity-85">
          {note}
        </div>
      )}
    </div>
  );
};
