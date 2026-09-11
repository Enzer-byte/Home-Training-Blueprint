export interface ProductItem {
  id: string;
  name: string;
  description: string;
  isBonus?: boolean;
  bonusTag?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  quote: string;
  location?: string;
  rating?: number;
}

export interface SalesPageContent {
  // Masthead
  mastheadText: string;

  // Hero Section
  heroTitle: string;
  heroSubhead: string;
  heroImageUrl: string;
  heroImageAlt: string;

  // Lede Story Section
  ledeParagraphs: string[];
  ledeHighlight: string;

  // Problem Section
  problemParagraphs: string[];
  problemPunchline: string;

  // Turn Section
  turnParagraphs: string[];
  turnBanner: string;

  // Introduction Section
  introParagraphs: string[];
  introHighlight: string;
  introCtaText: string;
  introCtaUrl: string;

  // Products ("What's inside" and "Plus, two bonuses")
  coreProducts: ProductItem[];
  bonusProducts: ProductItem[];

  // Proof Section
  proofParagraph1: string;
  proofParagraph2Bold: string;
  proofParagraph2Rest: string;
  proofParagraph3: string;
  proofParagraph4: string;

  // Who for / Not for
  whoForTitle: string;
  whoForItems: string[];
  notForTitle: string;
  notForItems: string[];

  // Pricing Box
  pricePreText: string[];
  priceCurrent: string;
  priceOriginal: string;
  priceMetaLine1: string;
  priceMetaLine2: string;
  priceCtaText: string;
  priceCtaUrl: string;

  // Guarantee Box
  guaranteeTitle: string;
  guaranteeText: string;

  // FAQ
  faqTitle: string;
  faqs: FaqItem[];

  // Why Now
  whyNowParagraph1: string;
  whyNowParagraph2: string;
  whyNowKicker: string;

  // Close Block
  closeTitle: string;
  closeParagraph: string;
  closeCtaText: string;
  closeCtaUrl: string;

  // PS Section
  psPrefix: string;
  psParagraph1: string;
  psParagraph2: string;
  psCtaText: string;
  psCtaUrl: string;

  // Sticky Bar
  stickyPrice: string;
  stickyButtonText: string;
  stickyCtaUrl: string;

  // Footer
  footerText: string;

  // Best Practice Extensible Features
  enableUrgencyBanner: boolean;
  urgencyBannerText: string;
  enableSocialProofSection: boolean;
  testimonials: TestimonialItem[];
  enableTrustBadges: boolean;
  trustBadgesNote: string;

  // SEO
  seoTitle: string;
  seoDescription: string;
}

export interface AdminUser {
  username: string;
  token: string;
}
