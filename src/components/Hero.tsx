import React from 'react';
import { SalesPageContent } from '../types';
import { TrustBadges } from './TrustBadges';
import { trackCtaClick } from '../services/analytics';

interface HeroProps {
  content: SalesPageContent;
}

export const Hero: React.FC<HeroProps> = ({ content }) => {
  const ctaText = content.introCtaText || content.priceCtaText || 'Get The Home Training Blueprint Bundle — ₦5,000';
  const ctaUrl = content.introCtaUrl || content.priceCtaUrl || '#price-section';
  const isAnchor = ctaUrl.startsWith('#');

  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackCtaClick('hero', ctaText, ctaUrl);
    if (isAnchor) {
      e.preventDefault();
      const el = document.querySelector(ctaUrl);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <div className="masthead" id="masthead">
        <span>{content.mastheadText}</span>
      </div>

      <section className="hero text-center" id="hero-section">
        <div className="wrap text-center">
          <h1 id="hero-heading" className="text-center">{content.heroTitle}</h1>
          <p className="subhead text-center mx-auto" id="hero-subhead">{content.heroSubhead}</p>

          {/* Hero Image Slot (hides gracefully until configured in CMS) */}
          {content.heroImageUrl && (
            <div className="hero-image-wrapper mx-auto" id="hero-image-container">
              <img
                src={content.heroImageUrl}
                alt={content.heroImageAlt || 'The Home Training Blueprint bundle preview'}
                className="w-full object-contain"
                id="hero-image"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Primary Hero CTA Button & Trust Signals */}
          <div className="hero-cta-wrapper mt-5 sm:mt-6" id="hero-cta-container">
            <a
              className="buy-btn"
              href={ctaUrl}
              id="hero-buy-btn"
              target={isAnchor ? undefined : '_blank'}
              rel={isAnchor ? undefined : 'noopener noreferrer'}
              onClick={handleCtaClick}
            >
              {ctaText}
            </a>
            {content.enableTrustBadges && <TrustBadges className="mt-2.5" />}
          </div>
        </div>
      </section>

      <div className="divider" id="main-divider" />
    </>
  );
};
