import React from 'react';
import { ShieldCheck, Zap, RotateCcw, Lock } from 'lucide-react';

interface TrustBadgesProps {
  note?: string;
  className?: string;
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({ note, className = '' }) => {
  return (
    <div className={`trust-badges-bar ${className}`} id="trust-badges-container">
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-[#334155]">
        <div className="flex items-center gap-1.5 font-medium" id="badge-security">
          <Lock size={15} className="text-[#0022DA]" />
          <span>256-Bit SSL Checkout</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium" id="badge-delivery">
          <Zap size={15} className="text-[#2563EB]" />
          <span>Instant Email Delivery</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium" id="badge-guarantee">
          <RotateCcw size={15} className="text-[#059669]" />
          <span>7-Day Guarantee</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium" id="badge-verified">
          <ShieldCheck size={15} className="text-[#0F172A]" />
          <span>Verified Publisher</span>
        </div>
      </div>
      {note && (
        <div className="w-full text-center text-xs text-[#64748B] mt-1.5 opacity-90">
          {note}
        </div>
      )}
    </div>
  );
};

