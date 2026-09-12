import React, { useState, useEffect } from 'react';
import { Clock, Flame, Zap, ArrowRight } from 'lucide-react';

interface CountdownTimerProps {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  targetTimestamp?: number;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  variant?: 'banner' | 'card' | 'inline';
  expiredText?: string;
  onCtaClick?: () => void;
}

interface TimeRemaining {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  days = 2,
  hours = 14,
  minutes = 30,
  seconds = 0,
  targetTimestamp,
  title = 'Limited Time Offer',
  subtitle = 'Launch discount pricing expires soon — rising to ₦7,000 when the timer hits zero.',
  ctaText = 'Claim ₦5,000 Early Bird Access',
  ctaUrl = '#price-section',
  variant = 'card',
  expiredText = 'Launch offer window closing — grab your bundle before the price increases!',
  onCtaClick
}) => {
  // Compute target timestamp
  const [endTime, setEndTime] = useState<number>(() => {
    if (targetTimestamp && targetTimestamp > Date.now()) {
      return targetTimestamp;
    }
    // Calculate from days, hours, minutes, seconds
    const totalMs = (days * 86400 + (hours || 0) * 3600 + minutes * 60 + seconds) * 1000;
    // Check localStorage for visitor persistence if no global timestamp
    if (typeof window !== 'undefined') {
      const storedKey = `htb_timer_${days}_${hours}_${minutes}_${seconds}`;
      const saved = localStorage.getItem(storedKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed > Date.now()) {
          return parsed;
        }
      }
      const newTarget = Date.now() + (totalMs > 0 ? totalMs : 86400 * 1000);
      localStorage.setItem(storedKey, String(newTarget));
      return newTarget;
    }
    return Date.now() + (totalMs > 0 ? totalMs : 86400 * 1000);
  });

  // Keep target in sync if targetTimestamp or days/minutes change in CMS
  useEffect(() => {
    if (targetTimestamp && targetTimestamp > Date.now()) {
      setEndTime(targetTimestamp);
    } else {
      const totalMs = (days * 86400 + (hours || 0) * 3600 + minutes * 60 + seconds) * 1000;
      if (totalMs > 0) {
        const storedKey = `htb_timer_${days}_${hours}_${minutes}_${seconds}`;
        const saved = typeof window !== 'undefined' ? localStorage.getItem(storedKey) : null;
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (parsed > Date.now()) {
            setEndTime(parsed);
            return;
          }
        }
        const newTarget = Date.now() + totalMs;
        if (typeof window !== 'undefined') {
          localStorage.setItem(storedKey, String(newTarget));
        }
        setEndTime(newTarget);
      }
    }
  }, [days, hours, minutes, seconds, targetTimestamp]);

  // Calculate remaining time
  const calculateRemaining = (): TimeRemaining => {
    const diff = Math.max(0, endTime - Date.now());
    const totalSeconds = Math.floor(diff / 1000);

    if (totalSeconds <= 0) {
      return {
        totalSeconds: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true
      };
    }

    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    return {
      totalSeconds,
      days: d,
      hours: h,
      minutes: m,
      seconds: s,
      isExpired: false
    };
  };

  const [remaining, setRemaining] = useState<TimeRemaining>(calculateRemaining);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(calculateRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const pad = (n: number) => String(n).padStart(2, '0');

  // Handle CTA click
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onCtaClick) {
      onCtaClick();
    }
    if (ctaUrl.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(ctaUrl);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // 1. TOP BANNER VARIANT (Fixed / Sticky Header Bar)
  if (variant === 'banner') {
    return (
      <aside
        aria-label="Limited time launch promotion banner"
        className="text-white py-2 sm:py-2.5 px-3 sm:px-5 lg:px-8 sticky top-0 z-50 shadow-md transition-colors duration-300 w-full box-border"
        style={{
          backgroundColor: 'var(--blue-primary)',
          boxShadow: '0 4px 16px var(--blue-border)'
        }}
        id="top-urgency-countdown-banner"
      >
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-4 text-xs sm:text-sm">
          {/* Urgency Badge & Offer Label */}
          <div className="flex items-center gap-2 sm:gap-2.5 font-semibold tracking-tight min-w-0 shrink overflow-hidden justify-center lg:justify-start">
            <span className="inline-flex items-center justify-center p-1 bg-white/20 rounded-md backdrop-blur-xs shrink-0">
              <Flame size={14} className="text-amber-300 animate-pulse" />
            </span>
            <span className="uppercase tracking-wider text-[11px] font-black bg-white/20 px-2.5 py-0.5 rounded text-white shrink-0 whitespace-nowrap">
              {title}
            </span>
            {subtitle && (
              <>
                {/* On tablet: compact message; On desktop: full message with clean truncation */}
                <span
                  className="hidden lg:inline font-normal text-white/90 text-xs xl:text-sm truncate min-w-0"
                  title={subtitle}
                >
                  {subtitle}
                </span>
                <span
                  className="hidden md:inline lg:hidden font-normal text-white/90 text-xs truncate max-w-xs"
                  title={subtitle}
                >
                  {subtitle}
                </span>
              </>
            )}
          </div>

          {/* Real-Time Digit Counter & CTA */}
          <div className="flex items-center gap-2 sm:gap-3 justify-center shrink-0">
            {!remaining.isExpired ? (
              <div className="flex items-center gap-1 font-mono font-bold text-xs sm:text-sm shrink-0 whitespace-nowrap">
                {remaining.days > 0 && (
                  <div className="flex items-center gap-0.5 bg-black/25 px-1.5 sm:px-2 py-0.5 rounded border border-white/15 shrink-0">
                    <span>{pad(remaining.days)}</span>
                    <span className="text-[10px] font-sans font-normal text-white/70">d</span>
                  </div>
                )}
                <div className="flex items-center gap-0.5 bg-black/25 px-1.5 sm:px-2 py-0.5 rounded border border-white/15 shrink-0">
                  <span>{pad(remaining.hours)}</span>
                  <span className="text-[10px] font-sans font-normal text-white/70">h</span>
                </div>
                <span className="text-white/60 font-mono shrink-0">:</span>
                <div className="flex items-center gap-0.5 bg-black/25 px-1.5 sm:px-2 py-0.5 rounded border border-white/15 shrink-0">
                  <span>{pad(remaining.minutes)}</span>
                  <span className="text-[10px] font-sans font-normal text-white/70">m</span>
                </div>
                <span className="text-white/60 font-mono shrink-0">:</span>
                <div className="flex items-center gap-0.5 bg-black/25 px-1.5 sm:px-2 py-0.5 rounded border border-white/15 text-amber-300 shrink-0">
                  <span>{pad(remaining.seconds)}</span>
                  <span className="text-[10px] font-sans font-normal text-amber-300/80">s</span>
                </div>
              </div>
            ) : (
              <span className="font-bold text-amber-200 text-xs shrink-0 whitespace-nowrap">{expiredText}</span>
            )}

            {/* Quick Action Button */}
            <a
              href={ctaUrl}
              onClick={handleClick}
              className="ml-1 bg-white text-slate-900 hover:bg-slate-100 px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
              id="banner-cta-link"
            >
              <span className="whitespace-nowrap hidden sm:inline">{ctaText || 'Get ₦5,000 Bundle'}</span>
              <span className="whitespace-nowrap sm:hidden">{ctaText && ctaText.length > 25 ? 'Get ₦5,000 Bundle' : (ctaText || 'Get ₦5,000 Bundle')}</span>
              <ArrowRight size={12} className="shrink-0" />
            </a>
          </div>
        </div>
      </aside>
    );
  }

  // 2. HIGH-CONVERSION CARD / INLINE VARIANT (Designed for Placement Above Price Box)
  return (
    <div
      aria-label="Limited time offer urgency countdown"
      className="countdown-timer-card rounded-2xl sm:rounded-3xl border transition-all duration-300 my-6 sm:my-8 shadow-sm w-full box-border overflow-hidden"
      style={{
        backgroundColor: 'var(--blue-light)',
        borderColor: 'var(--blue-border)',
        boxShadow: '0 8px 30px var(--blue-border)',
        padding: 'clamp(20px, 4.5vw, 32px)'
      }}
      id="sales-urgency-countdown-card"
    >
      {/* Centered Structured Header: Badges, Title, and Urgency Subtitle */}
      <div className="text-center max-w-xl mx-auto mb-4 sm:mb-5">
        {/* Badges Row with Perfectly Nested Clock Icon */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2.5">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full text-white font-sans shadow-xs"
            style={{ backgroundColor: 'var(--blue-primary)' }}
          >
            <Clock size={13} className="shrink-0 animate-spin-slow" />
            <span>{title}</span>
          </span>

          <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-amber-800 bg-amber-100/90 px-3 py-1 rounded-full border border-amber-300/70 shadow-xs">
            <Flame size={12} className="text-amber-600" />
            <span>Save ₦2,000 Today</span>
          </span>
        </div>

        {/* Main Headline */}
        <h3 className="font-serif text-lg sm:text-xl md:text-2xl font-bold text-[#0F172A] leading-snug tracking-tight m-0 mb-1.5">
          Early Access Price of ₦5,000 Expiring Soon
        </h3>

        {/* Subtitle / Urgency Context */}
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#475569] leading-relaxed m-0 max-w-md mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      {/* Modern Digit Blocks - Centered and Responsive */}
      {!remaining.isExpired ? (
        <div className="grid grid-cols-4 gap-2 sm:gap-3.5 my-3 sm:my-5 max-w-xs sm:max-w-md mx-auto">
          {/* Days */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3.5 text-center border border-slate-200/90 shadow-xs transition hover:border-slate-300">
            <span
              className="block font-mono text-xl sm:text-3xl md:text-4xl font-black tracking-tight"
              style={{ color: 'var(--blue-primary)' }}
              id="countdown-digit-days"
            >
              {pad(remaining.days)}
            </span>
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-[#64748B] mt-0.5 sm:mt-1 block">
              Days
            </span>
          </div>

          {/* Hours */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3.5 text-center border border-slate-200/90 shadow-xs transition hover:border-slate-300">
            <span
              className="block font-mono text-xl sm:text-3xl md:text-4xl font-black tracking-tight"
              style={{ color: 'var(--blue-primary)' }}
              id="countdown-digit-hours"
            >
              {pad(remaining.hours)}
            </span>
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-[#64748B] mt-0.5 sm:mt-1 block">
              Hours
            </span>
          </div>

          {/* Minutes */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3.5 text-center border border-slate-200/90 shadow-xs transition hover:border-slate-300">
            <span
              className="block font-mono text-xl sm:text-3xl md:text-4xl font-black tracking-tight"
              style={{ color: 'var(--blue-primary)' }}
              id="countdown-digit-minutes"
            >
              {pad(remaining.minutes)}
            </span>
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-[#64748B] mt-0.5 sm:mt-1 block">
              Mins
            </span>
          </div>

          {/* Seconds - Signature Active Block */}
          <div
            className="rounded-xl sm:rounded-2xl p-2 sm:p-3.5 text-center border shadow-sm transition"
            style={{
              backgroundColor: 'var(--blue-primary)',
              borderColor: 'var(--blue-hover)'
            }}
          >
            <span
              className="block font-mono text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white"
              id="countdown-digit-seconds"
            >
              {pad(remaining.seconds)}
            </span>
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-white/90 mt-0.5 sm:mt-1 block">
              Secs
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center my-3 max-w-md mx-auto">
          <p className="font-bold text-amber-800 text-xs sm:text-sm m-0">{expiredText}</p>
        </div>
      )}

      {/* Reassurance Micro-Copy & Price Anchor Footer Bar */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-[#475569]">
        <div className="flex items-center gap-1.5 text-center sm:text-left justify-center">
          <Zap size={14} className="shrink-0" style={{ color: 'var(--blue-primary)' }} />
          <span>Launch price rising to <strong className="text-[#0F172A]">₦7,000</strong> once timer ends.</span>
        </div>
        <div className="font-semibold text-slate-800 text-center sm:text-right">
          Current Price: <span className="font-bold" style={{ color: 'var(--blue-primary)' }}>₦5,000</span> <span className="text-[11px] text-slate-500 font-normal">(5 Guides & Toolkits)</span>
        </div>
      </div>
    </div>
  );
};
