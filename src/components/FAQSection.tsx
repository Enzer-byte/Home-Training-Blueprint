import React from 'react';
import { FaqItem } from '../types';

interface FAQSectionProps {
  title: string;
  faqs: FaqItem[];
}

export const FAQSection: React.FC<FAQSectionProps> = ({ title, faqs }) => {
  return (
    <section id="faq-section">
      <div className="wrap">
        <h2 id="faq-title" className="text-center">{title}</h2>
        {faqs.map((faq, index) => (
          <details key={faq.id || index} id={`faq-${index}`}>
            <summary id={`faq-summary-${index}`}>{faq.question}</summary>
            <p id={`faq-answer-${index}`}>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
};
