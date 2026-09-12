import React from 'react';
import { trackCtaClick } from '../services/analytics';

interface StickyBarProps {
  price: string;
  buttonText: string;
  ctaUrl: string;
}

export const StickyBar: React.FC<StickyBarProps> = ({ price, buttonText, ctaUrl }) => {
  const isAnchor = ctaUrl?.startsWith('#');

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackCtaClick('sticky', buttonText, ctaUrl);
    if (isAnchor) {
      e.preventDefault();
      const el = document.querySelector(ctaUrl);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="sticky-bar" id="sticky-checkout-bar">
      <span className="sb-price" id="sb-price-label">{price}</span>
      <a
        href={ctaUrl}
        id="sb-buy-link"
        target={isAnchor ? undefined : '_blank'}
        rel={isAnchor ? undefined : 'noopener noreferrer'}
        onClick={handleClick}
      >
        {buttonText}
      </a>
    </div>
  );
};
