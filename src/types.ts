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

  // Brand Color & Theme (Dynamically updates CSS variables)
  primaryBrandColor?: string;

  // Best Practice Extensible Features
  enableUrgencyBanner: boolean;
  urgencyBannerText: string;

  // Urgency Countdown Timer Component (Customizable in backend: days, minutes, seconds)
  enableCountdownTimer: boolean;
  countdownOfferTitle: string;
  countdownOfferSubtitle: string;
  countdownDays: number;
  countdownHours: number;
  countdownMinutes: number;
  countdownSeconds: number;
  countdownTargetTimestamp?: number;
  countdownShowInTopBanner: boolean;
  countdownShowInPriceSection: boolean;
  countdownExpiredText: string;

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

export interface ClickEventItem {
  id: string;
  buttonId: 'price' | 'close' | 'ps' | 'sticky' | string;
  buttonLabel: string;
  targetUrl: string;
  timestamp: string;
  userAgent?: string;
  referrer?: string;
}

export interface AnalyticsStats {
  totalClicks: number;
  clicksByButton: {
    price: number;
    close: number;
    ps: number;
    sticky: number;
    [key: string]: number;
  };
  recentEvents: ClickEventItem[];
  lastUpdated: string;
}

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0, defaults to 0.82
  outputFormat?: 'image/webp' | 'image/jpeg' | 'image/png' | 'auto';
  maxSizeBytes?: number;
  fileName?: string;
}

export interface OptimizationResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  bytesSaved: number;
  savingsPercent: number;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  format: string;
  fileName: string;
}
