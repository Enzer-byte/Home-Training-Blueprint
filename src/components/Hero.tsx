import React from 'react';
import { SalesPageContent } from '../types';

interface HeroProps {
  content: SalesPageContent;
}

export const Hero: React.FC<HeroProps> = ({ content }) => {
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
                className="w-full object-cover"
                id="hero-image"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>
      </section>

      <div className="divider" id="main-divider" />
    </>
  );
};
