import React from 'react';
import { trackCtaClick } from '../services/analytics';

interface StickyBarProps {
  price: string;
  buttonText: string;
  ctaUrl: string;
}

export const StickyBar: React.FC<StickyBarProps> = ({ price, buttonText, ctaUrl }) => {
  const handleClick = () => {
    trackCtaClick('sticky', buttonText, ctaUrl);
  };

  return (
    <div className="sticky-bar" id="sticky-checkout-bar">
      <span className="sb-price" id="sb-price-label">{price}</span>
      <a
        href={ctaUrl}
        id="sb-buy-link"
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
      >
        {buttonText}
      </a>
    </div>
  );
};
