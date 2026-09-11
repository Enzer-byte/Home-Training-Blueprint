import React, { useEffect } from 'react';
import { SalesPageContent } from '../types';
import { Hero } from './Hero';
import { ProductBlock } from './ProductBlock';
import { FAQSection } from './FAQSection';
import { StickyBar } from './StickyBar';
import { TrustBadges } from './TrustBadges';
import { FooterLinksModal } from './FooterLinksModal';
import { trackCtaClick } from '../services/analytics';

interface SalesPageProps {
  content: SalesPageContent;
}

export const SalesPage: React.FC<SalesPageProps> = ({ content }) => {
  // Sync document title and meta description dynamically from CMS
  useEffect(() => {
    if (content.seoTitle) {
      document.title = content.seoTitle;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && content.seoDescription) {
      metaDesc.setAttribute('content', content.seoDescription);
    }
  }, [content.seoTitle, content.seoDescription]);

  return (
    <div className="sales-page-container min-h-screen">
      {/* Optional Urgency Banner (Configurable in CMS, default off) */}
      {content.enableUrgencyBanner && content.urgencyBannerText && (
        <div
          className="bg-[#0022DA] text-white text-center text-xs sm:text-sm font-semibold py-2.5 px-4 sticky top-0 z-50 shadow-md"
          id="urgency-banner"
        >
          {content.urgencyBannerText}
        </div>
      )}

      {/* HERO SECTION WITH IMAGE SLOT */}
      <Hero content={content} />

      {/* LEDE */}
      <section className="lede" id="lede-section">
        <div className="wrap">
          {content.ledeParagraphs.map((para, index) => (
            <p key={index} id={`lede-p-${index}`}>
              {para}
            </p>
          ))}
          <p className="solo" id="lede-solo-punchline">{content.ledeHighlight}</p>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="alt" id="problem-section">
        <div className="wrap">
          {content.problemParagraphs.map((para, index) => (
            <p key={index} id={`problem-p-${index}`}>
              {para}
            </p>
          ))}
          <p
            className="solo"
            style={{ color: 'var(--indigo)', fontWeight: 600 }}
            id="problem-solo-punchline"
          >
            {content.problemPunchline}
          </p>
        </div>
      </section>

      {/* TURN */}
      <section id="turn-section">
        <div className="wrap">
          {content.turnParagraphs.map((para, index) => (
            <p key={index} id={`turn-p-${index}`}>
              {para}
            </p>
          ))}
          <p className="turn-line" id="turn-line-highlight">
            {content.turnBanner}
          </p>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="alt" id="intro-section">
        <div className="wrap">
          {content.introParagraphs.map((para, index) => (
            <p key={index} id={`intro-p-${index}`}>
              {index === 0 && para.includes('The Home Training Blueprint Bundle') ? (
                <>
                  {para.split('The Home Training Blueprint Bundle')[0]}
                  <strong>The Home Training Blueprint Bundle</strong>
                  {para.split('The Home Training Blueprint Bundle')[1]}
                </>
              ) : (
                para
              )}
            </p>
          ))}
          <p className="solo" id="intro-solo-punchline">{content.introHighlight}</p>
          <a
            className="buy-btn"
            href={content.introCtaUrl}
            id="intro-buy-btn"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCtaClick('intro', content.introCtaText, content.introCtaUrl)}
          >
            {content.introCtaText}
          </a>
          {content.enableTrustBadges && <TrustBadges note={content.trustBadgesNote} />}
        </div>
      </section>

      {/* WHAT'S INSIDE */}
      <section id="whats-inside-section">
        <div className="wrap">
          <h2 id="whats-inside-title" className="text-center">What's inside</h2>
          {content.coreProducts.map((item) => (
            <ProductBlock key={item.id} item={item} idPrefix="core-prod" />
          ))}
        </div>
      </section>

      {/* BONUSES */}
      <section className="alt" id="bonuses-section">
        <div className="wrap">
          <h2 id="bonuses-title" className="text-center">Plus, two bonuses</h2>
          {content.bonusProducts.map((item) => (
            <ProductBlock key={item.id} item={item} idPrefix="bonus-prod" />
          ))}
        </div>
      </section>

      {/* PROOF */}
      <section id="proof-section">
        <div className="wrap">
          <p id="proof-p-1">{content.proofParagraph1}</p>
          <p id="proof-p-2">
            <strong>{content.proofParagraph2Bold}</strong> {content.proofParagraph2Rest}
          </p>
          <p id="proof-p-3">{content.proofParagraph3}</p>
          <p id="proof-p-4">{content.proofParagraph4}</p>

          {/* Social Proof Reviews (CMS extensible, defaults to off until real parent reviews are added) */}
          {content.enableSocialProofSection && content.testimonials && content.testimonials.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200 space-y-4" id="testimonials-block">
              <h3 className="font-serif text-lg font-bold text-[#0F172A]">Early Readers' Reflections</h3>
              <div className="space-y-3">
                {content.testimonials.map((test) => (
                  <div key={test.id} className="bg-white p-4 rounded-xl border border-slate-200 text-sm shadow-sm">
                    <p className="italic text-[#334155] mb-2 leading-relaxed">"{test.quote}"</p>
                    <div className="font-semibold text-[#0022DA] text-xs">
                      {test.name} {test.location ? `• ${test.location}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* WHO FOR / NOT FOR */}
      <section className="alt" id="who-for-section">
        <div className="wrap lists">
          <div className="list-block yes" id="who-for-block">
            <h3 id="who-for-title">{content.whoForTitle}</h3>
            <ul className="plain" id="who-for-list">
              {content.whoForItems.map((item, index) => (
                <li key={index} id={`who-for-li-${index}`}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="list-block no" id="not-for-block">
            <h3 id="not-for-title">{content.notForTitle}</h3>
            <ul className="plain" id="not-for-list">
              {content.notForItems.map((item, index) => (
                <li key={index} id={`not-for-li-${index}`}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* PRICE */}
      <section id="price-section">
        <div className="wrap">
          {content.pricePreText.map((p, index) => (
            <p key={index} id={`price-pre-p-${index}`}>
              {p}
            </p>
          ))}
          <div className="price-box" id="price-card">
            <div className="price-now" id="price-current-value">{content.priceCurrent}</div>
            <div className="price-then" id="price-original-label">{content.priceOriginal}</div>
            <div className="price-meta" id="price-meta-block">
              {content.priceMetaLine1}
              <br />
              {content.priceMetaLine2}
            </div>
          </div>
          <a
            className="buy-btn"
            href={content.priceCtaUrl}
            id="price-buy-btn"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCtaClick('price', content.priceCtaText, content.priceCtaUrl)}
          >
            {content.priceCtaText}
          </a>
          {content.enableTrustBadges && <TrustBadges note={content.trustBadgesNote} />}
        </div>
      </section>

      {/* GUARANTEE */}
      <section className="alt" id="guarantee-section">
        <div className="wrap">
          <div className="guarantee-box" id="guarantee-card">
            <h2 id="guarantee-title">{content.guaranteeTitle}</h2>
            <p id="guarantee-text">{content.guaranteeText}</p>
          </div>
        </div>
      </section>

      {/* OBJECTIONS / FAQ */}
      <FAQSection title={content.faqTitle} faqs={content.faqs} />

      {/* WHY NOW */}
      <section className="alt whynow" id="whynow-section">
        <div className="wrap">
          <p id="whynow-p-1">{content.whyNowParagraph1}</p>
          <p id="whynow-p-2">{content.whyNowParagraph2}</p>
          <p className="kicker" id="whynow-kicker">{content.whyNowKicker}</p>
        </div>
      </section>

      {/* CLOSE */}
      <section className="close-block" id="close-section">
        <div className="wrap">
          <h2 id="close-title">{content.closeTitle}</h2>
          <p id="close-desc">{content.closeParagraph}</p>
          <a
            className="buy-btn"
            href={content.closeCtaUrl}
            id="close-buy-btn"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCtaClick('close', content.closeCtaText, content.closeCtaUrl)}
          >
            {content.closeCtaText}
          </a>
          {content.enableTrustBadges && <TrustBadges />}
        </div>
      </section>

      {/* PS */}
      <section className="ps" id="ps-section">
        <div className="wrap">
          <p id="ps-p-1">
            <strong>{content.psPrefix}</strong> {content.psParagraph1}
          </p>
          <p id="ps-p-2">{content.psParagraph2}</p>
          <a
            className="buy-btn"
            href={content.psCtaUrl}
            id="ps-buy-btn"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCtaClick('ps', content.psCtaText, content.psCtaUrl)}
          >
            {content.psCtaText}
          </a>
        </div>
      </section>

      {/* FOOTER & TRUST MODAL */}
      <FooterLinksModal footerText={content.footerText} />

      {/* STICKY BAR */}
      <StickyBar
        price={content.stickyPrice}
        buttonText={content.stickyButtonText}
        ctaUrl={content.stickyCtaUrl}
      />
    </div>
  );
};
