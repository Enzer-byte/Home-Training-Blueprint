import React from 'react';

interface StickyBarProps {
  price: string;
  buttonText: string;
  ctaUrl: string;
}

export const StickyBar: React.FC<StickyBarProps> = ({ price, buttonText, ctaUrl }) => {
  return (
    <div className="sticky-bar" id="sticky-checkout-bar">
      <span className="sb-price" id="sb-price-label">{price}</span>
      <a
        href={ctaUrl}
        id="sb-buy-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        {buttonText}
      </a>
    </div>
  );
};
