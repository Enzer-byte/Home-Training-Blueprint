import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Save,
  CheckCircle,
  ExternalLink,
  RotateCcw,
  LogOut,
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
  HelpCircle,
  FileText,
  DollarSign,
  AlertCircle,
  Zap,
  Palette,
  Clock,
  Flame,
  RefreshCw,
  Database,
  Activity,
  X,
  XCircle,
  Search,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  MessageSquare,
  BookOpen,
  UserCheck,
  Monitor,
  Smartphone,
  Globe,
  BarChart3,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { SalesPageContent, ProductItem, FaqItem, TestimonialItem } from '../types';
import { api } from '../services/api';
import { resizeAndCompressImage, formatFileSize } from '../utils/imageOptimizer';
import { DEFAULT_CONTENT } from '../defaultContent';
import { AdminAnalytics } from './AdminAnalytics';
import { CountdownTimer } from './CountdownTimer';
import { SalesPage } from './SalesPage';
import { applyBrandColor, BRAND_COLOR_PRESETS } from '../utils/theme';
import {
  isSupabaseConfigured,
  checkSupabaseHealth,
  getSupabaseProjectDomain,
  SupabaseHealthResult
} from '../services/supabase';

interface AdminCMSProps {
  initialContent: SalesPageContent;
  onContentUpdate: (newContent: SalesPageContent) => void;
  onLogout: () => void;
}

export type CMSSectionId =
  | 'overview'
  | 'urgency'
  | 'pricing'
  | 'hero'
  | 'lede'
  | 'problem'
  | 'intro'
  | 'products'
  | 'proof'
  | 'faq'
  | 'closing'
  | 'branding'
  | 'images'
  | 'seo'
  | 'analytics';

interface NavItem {
  id: CMSSectionId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  category: 'conversions' | 'copy' | 'visuals' | 'system';
  keywords: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview & System Health',
    shortLabel: 'Overview',
    icon: Activity,
    category: 'system',
    keywords: ['dashboard', 'health', 'status', 'supabase', 'database', 'summary']
  },
  {
    id: 'urgency',
    label: 'Countdown Timer & Banners',
    shortLabel: 'Countdown',
    icon: Clock,
    badge: 'Live Sync',
    category: 'conversions',
    keywords: ['timer', 'countdown', 'urgency', 'deadline', 'hours', 'minutes', 'seconds', 'flash sale', 'deal', 'discount']
  },
  {
    id: 'pricing',
    label: 'Pricing & Checkout Links',
    shortLabel: 'Pricing',
    icon: DollarSign,
    category: 'conversions',
    keywords: ['price', 'naira', 'cost', 'checkout', 'nestuge', 'cta', 'guarantee', 'money back']
  },
  {
    id: 'hero',
    label: 'Hero & Masthead',
    shortLabel: 'Hero',
    icon: Sparkles,
    category: 'copy',
    keywords: ['hero', 'masthead', 'headline', 'title', 'subhead', 'h1', 'header', 'banner']
  },
  {
    id: 'lede',
    label: 'Lede Story Section',
    shortLabel: 'Lede Story',
    icon: BookOpen,
    category: 'copy',
    keywords: ['lede', 'story', 'personal', 'growing up', 'hugs', 'childhood', 'pattern']
  },
  {
    id: 'problem',
    label: 'The Problem & The Turn',
    shortLabel: 'Problem & Turn',
    icon: FileText,
    category: 'copy',
    keywords: ['problem', 'turn', 'reaction', 'fears', 'strict', 'guilty', 'punchline']
  },
  {
    id: 'intro',
    label: 'Bundle Introduction',
    shortLabel: 'Introduction',
    icon: ArrowRight,
    category: 'copy',
    keywords: ['intro', 'introduction', 'bundle', 'home training blueprint', 'cta']
  },
  {
    id: 'products',
    label: 'Guides & Bonus Toolkits',
    shortLabel: 'Products',
    icon: ShieldCheck,
    category: 'copy',
    keywords: ['products', 'guides', 'toolkits', 'blueprint', 'handbook', 'bonus', 'conversations', 'response card']
  },
  {
    id: 'proof',
    label: 'Proof & Audience Fit',
    shortLabel: 'Proof & Fit',
    icon: UserCheck,
    category: 'copy',
    keywords: ['proof', 'who for', 'not for', 'audience', 'criteria', 'fit']
  },
  {
    id: 'faq',
    label: 'FAQ & Social Proof',
    shortLabel: 'FAQ & Proof',
    icon: MessageSquare,
    category: 'copy',
    keywords: ['faq', 'questions', 'answers', 'objections', 'testimonials', 'reviews', 'trust badges']
  },
  {
    id: 'closing',
    label: 'Closing Copy & PS Block',
    shortLabel: 'Closing & PS',
    icon: HelpCircle,
    category: 'copy',
    keywords: ['closing', 'why now', 'ps', 'postscript', 'final cta', 'sticky bar', 'footer']
  },
  {
    id: 'branding',
    label: 'Brand Colors & Themes',
    shortLabel: 'Brand Colors',
    icon: Palette,
    category: 'visuals',
    keywords: ['color', 'palette', 'theme', 'blue', 'primary', 'brand', 'css', 'variables']
  },
  {
    id: 'images',
    label: 'Image Library & Optimizer',
    shortLabel: 'Images',
    icon: ImageIcon,
    category: 'visuals',
    keywords: ['images', 'photos', 'upload', 'compress', 'webp', 'optimizer', 'hero image']
  },
  {
    id: 'seo',
    label: 'SEO & Social Share Meta',
    shortLabel: 'SEO & Meta',
    icon: Globe,
    category: 'system',
    keywords: ['seo', 'meta', 'google', 'search', 'description', 'title', 'social', 'crawler']
  },
  {
    id: 'analytics',
    label: 'Live Sales Click Analytics',
    shortLabel: 'Analytics',
    icon: BarChart3,
    category: 'system',
    keywords: ['analytics', 'clicks', 'metrics', 'conversions', 'buttons', 'stats', 'traffic']
  }
];

export const AdminCMS: React.FC<AdminCMSProps> = ({
  initialContent,
  onContentUpdate,
  onLogout
}) => {
  const [content, setContent] = useState<SalesPageContent>(initialContent);
  const [activeSection, setActiveSection] = useState<CMSSectionId>('urgency');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Supabase Diagnostics State
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealthResult | null>(null);
  const [supabaseChecking, setSupabaseChecking] = useState<boolean>(true);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState<boolean>(false);

  const heroFileRef = useRef<HTMLInputElement>(null);

  // Track unsaved modifications
  const isDirty = useMemo(() => {
    return JSON.stringify(content) !== JSON.stringify(initialContent);
  }, [content, initialContent]);

  // Supabase diagnostic health probe
  const runSupabaseDiagnostic = async () => {
    setSupabaseChecking(true);
    try {
      const res = await checkSupabaseHealth();
      setSupabaseHealth(res);
    } catch (err) {
      setSupabaseHealth({
        status: 'error',
        message: err instanceof Error ? err.message : 'Diagnostic probe failed.',
        lastChecked: new Date().toLocaleTimeString()
      });
    } finally {
      setSupabaseChecking(false);
    }
  };

  useEffect(() => {
    runSupabaseDiagnostic();
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content]);

  // Toast status helper
  const triggerStatus = (status: 'saved' | 'error' | 'saving', msg: string) => {
    setSaveStatus(status);
    setStatusMessage(msg);
    if (status !== 'saving') {
      setTimeout(() => {
        setSaveStatus('idle');
      }, 4000);
    }
  };

  // Main Save Handler (Saves to Supabase, local server, and notifies parent)
  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const res = await api.saveContent(content);
      if (res.success) {
        onContentUpdate(content);
        triggerStatus('saved', res.message || 'Changes published live to Supabase and visitors!');
        runSupabaseDiagnostic();
      } else {
        triggerStatus('error', res.message || 'Failed to publish changes.');
      }
    } catch {
      triggerStatus('error', 'Network error while publishing changes.');
    }
  };

  // Reset confirmation
  const confirmResetToDefaults = async () => {
    setShowResetConfirm(false);
    setSaveStatus('saving');
    await api.resetToDefaults();
    setContent(DEFAULT_CONTENT);
    onContentUpdate(DEFAULT_CONTENT);
    triggerStatus('saved', 'Reverted to original source copy.');
    runSupabaseDiagnostic();
  };

  // Filter navigation items by search
  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) return NAV_ITEMS;
    const q = searchQuery.toLowerCase();
    return NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.shortLabel.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.includes(q))
    );
  }, [searchQuery]);

  // Image Upload Handler
  const handleImageUpload = async (
    file: File,
    targetType: 'hero' | 'product',
    productId?: string
  ) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      triggerStatus('error', 'Please upload a valid image file (JPEG, PNG, WEBP, or GIF).');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      triggerStatus('error', 'File is extremely large (>25MB). Please select an image under 25MB.');
      return;
    }

    const fieldKey = targetType === 'hero' ? 'hero' : `product-${productId}`;
    setUploadingField(fieldKey);
    triggerStatus('saving', 'Optimizing and compressing image...');

    try {
      const optimized = await resizeAndCompressImage(file, {
        maxWidth: targetType === 'hero' ? 1600 : 1000,
        maxHeight: targetType === 'hero' ? 1600 : 1000,
        quality: 0.82
      });

      const res = await api.uploadImage(optimized.dataUrl, optimized.fileName, optimized.format);
      if (res.success && res.url) {
        if (targetType === 'hero') {
          setContent((prev) => ({ ...prev, heroImageUrl: res.url! }));
        } else if (productId) {
          setContent((prev) => {
            const updateList = (list: ProductItem[]) =>
              list.map((p) => (p.id === productId ? { ...p, imageUrl: res.url! } : p));
            return {
              ...prev,
              coreProducts: updateList(prev.coreProducts),
              bonusProducts: updateList(prev.bonusProducts)
            };
          });
        }
        triggerStatus(
          'saved',
          `Optimized & saved! ${formatFileSize(optimized.originalSize)} → ${formatFileSize(optimized.compressedSize)} (${optimized.savingsPercent}% reduction)`
        );
      } else {
        triggerStatus('error', res.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      triggerStatus('error', 'Failed to compress or upload image.');
    } finally {
      setUploadingField(null);
    }
  };

  // Product updater
  const updateProduct = (id: string, field: keyof ProductItem, value: string) => {
    setContent((prev) => {
      const updateList = (list: ProductItem[]) =>
        list.map((p) => (p.id === id ? { ...p, [field]: value } : p));
      return {
        ...prev,
        coreProducts: updateList(prev.coreProducts),
        bonusProducts: updateList(prev.bonusProducts)
      };
    });
  };

  // FAQ management
  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    setContent((prev) => {
      const nextFaqs = [...prev.faqs];
      nextFaqs[index] = { ...nextFaqs[index], [field]: value };
      return { ...prev, faqs: nextFaqs };
    });
  };

  const addFaq = () => {
    setContent((prev) => ({
      ...prev,
      faqs: [
        ...prev.faqs,
        {
          id: `faq-${Date.now()}`,
          question: 'New Question',
          answer: 'Answer text here.'
        }
      ]
    }));
  };

  const removeFaq = (index: number) => {
    setContent((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

  // Testimonial management
  const addTestimonial = () => {
    const newTest: TestimonialItem = {
      id: `test-${Date.now()}`,
      name: 'Parent Name',
      role: 'Mother of 2',
      quote: 'This blueprint gave me the exact words I needed during meltdowns.',
      location: 'Lagos, Nigeria'
    };
    setContent((prev) => ({
      ...prev,
      testimonials: [...(prev.testimonials || []), newTest],
      enableSocialProofSection: true
    }));
  };

  const updateTestimonial = (index: number, field: keyof TestimonialItem, value: string) => {
    setContent((prev) => {
      const next = [...(prev.testimonials || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, testimonials: next };
    });
  };

  const removeTestimonial = (index: number) => {
    setContent((prev) => ({
      ...prev,
      testimonials: prev.testimonials.filter((_, i) => i !== index)
    }));
  };

  // Brand Color Handlers
  const handleBrandColorChange = (hex: string) => {
    setContent((prev) => ({ ...prev, primaryBrandColor: hex }));
    applyBrandColor(hex);
    onContentUpdate({ ...content, primaryBrandColor: hex });
  };

  // Urgency Countdown Handlers (Syncs to Supabase and backend immediately)
  const handleRestartCountdownTimer = async () => {
    const totalMs = (
      (content.countdownDays || 0) * 86400 +
      (content.countdownHours || 0) * 3600 +
      (content.countdownMinutes || 0) * 60 +
      (content.countdownSeconds || 0)
    ) * 1000;
    const newTarget = Date.now() + (totalMs > 0 ? totalMs : 86400 * 1000);

    if (typeof window !== 'undefined') {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach((k) => {
          if (k.startsWith('htb_timer_')) localStorage.removeItem(k);
        });
      } catch (e) {
        console.warn('Could not clear timer localStorage', e);
      }
    }

    const updatedContent = {
      ...content,
      countdownTargetTimestamp: newTarget
    };
    setContent(updatedContent);
    onContentUpdate(updatedContent);
    setSaveStatus('saving');
    try {
      const res = await api.saveContent(updatedContent);
      if (res.success) {
        triggerStatus('saved', 'Countdown restarted and synchronized live with Supabase!');
        runSupabaseDiagnostic();
      } else {
        triggerStatus('error', res.message || 'Failed to sync timer');
      }
    } catch {
      triggerStatus('error', 'Network error while restarting timer');
    }
  };

  const applyCountdownPreset = async (d: number, h: number, m: number, s: number) => {
    const totalMs = (d * 86400 + h * 3600 + m * 60 + s) * 1000;
    const newTarget = Date.now() + totalMs;

    if (typeof window !== 'undefined') {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach((k) => {
          if (k.startsWith('htb_timer_')) localStorage.removeItem(k);
        });
      } catch (e) {
        console.warn('Could not clear timer localStorage', e);
      }
    }

    const updatedContent = {
      ...content,
      countdownDays: d,
      countdownHours: h,
      countdownMinutes: m,
      countdownSeconds: s,
      countdownTargetTimestamp: newTarget
    };
    setContent(updatedContent);
    onContentUpdate(updatedContent);
    setSaveStatus('saving');
    try {
      const res = await api.saveContent(updatedContent);
      if (res.success) {
        triggerStatus('saved', `Applied ${d}d ${h}h ${m}m ${s}s preset and published live!`);
        runSupabaseDiagnostic();
      } else {
        triggerStatus('error', res.message || 'Failed to publish preset');
      }
    } catch {
      triggerStatus('error', 'Network error while saving preset');
    }
  };

  // Section Save Button Component
  const SectionSaveButton = ({ label = 'Publish Changes' }: { label?: string }) => (
    <div className="flex items-center justify-between pt-5 mt-6 border-t border-slate-200">
      <div className="flex items-center gap-2 text-xs text-[#64748B]">
        {isDirty ? (
          <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Unsaved changes in this session
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <Check size={14} />
            All content synchronized with database
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saveStatus === 'saving'}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--blue-primary)] hover:bg-[var(--blue-hover)] text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
      >
        <Save size={16} />
        <span>{saveStatus === 'saving' ? 'Publishing...' : label}</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] flex flex-col font-sans" id="admin-cms-dashboard">
      {/* ========================================================= */}
      {/* 1. TOP GLOBAL APP BAR                                     */}
      {/* ========================================================= */}
      <header className="bg-[#0B192C] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Left Brand & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-white/80 hover:bg-white/10"
              aria-label="Toggle navigation menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className="w-full h-0.5 bg-white rounded-full" />
                <span className="w-full h-0.5 bg-white rounded-full" />
                <span className="w-full h-0.5 bg-white rounded-full" />
              </div>
            </button>

            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base sm:text-lg text-white truncate">
                SheRoots Foundation CMS
              </span>
              <span
                className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded tracking-wider text-white uppercase"
                style={{ backgroundColor: 'var(--blue-primary)' }}
              >
                ADMIN
              </span>
            </div>
          </div>

          {/* Middle: Live Supabase Status & Dirty State */}
          <div className="flex items-center gap-2.5">
            {isDirty && (
              <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Unsaved Edits (Cmd+S)
              </span>
            )}

            {/* Supabase Diagnostic Button */}
            <button
              type="button"
              onClick={() => setShowDiagnosticModal(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition cursor-pointer hover:opacity-90 shadow-xs"
              style={
                supabaseChecking
                  ? { backgroundColor: 'rgba(234, 179, 8, 0.15)', borderColor: 'rgba(234, 179, 8, 0.4)', color: '#FEF08A' }
                  : supabaseHealth?.status === 'connected'
                  ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#A7F3D0' }
                  : supabaseHealth?.status === 'error'
                  ? { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)', color: '#FECACA' }
                  : { backgroundColor: 'rgba(100, 116, 139, 0.2)', borderColor: 'rgba(100, 116, 139, 0.4)', color: '#CBD5E1' }
              }
              title="Click to inspect Supabase database connection details"
              id="supabase-diagnostic-badge-btn"
            >
              <Database size={12} className="shrink-0" />
              {supabaseChecking ? (
                <>
                  <RefreshCw size={11} className="animate-spin text-amber-300 shrink-0" />
                  <span className="hidden sm:inline">Probing...</span>
                </>
              ) : supabaseHealth?.status === 'connected' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span>Supabase Live</span>
                  {supabaseHealth.latencyMs !== undefined && (
                    <span className="text-[10px] text-emerald-300/80 font-mono hidden md:inline">
                      ({supabaseHealth.latencyMs}ms)
                    </span>
                  )}
                </>
              ) : supabaseHealth?.status === 'error' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping shrink-0" />
                  <span>Connection Error</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                  <span>Local Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Preview Toggle */}
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                showLivePreview
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Toggle interactive live preview split-view"
              id="cms-preview-toggle-btn"
            >
              {showLivePreview ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="hidden md:inline">{showLivePreview ? 'Hide Preview' : 'Split Preview'}</span>
            </button>

            {/* Public Site Link */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 text-white transition"
              id="cms-view-site-link"
              title="Open public sales page in a new tab"
            >
              <ExternalLink size={14} />
              <span className="hidden lg:inline">View Site</span>
            </a>

            {/* Main Save & Publish Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-white transition shadow disabled:opacity-50 cursor-pointer hover:opacity-95"
              style={{ backgroundColor: 'var(--blue-primary)' }}
              id="cms-publish-button"
            >
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span className="hidden sm:inline">Publishing...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Publish</span>
                </>
              )}
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              title="Sign Out"
              aria-label="Sign out"
              id="cms-logout-button"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* Global Status Banner */}
      {saveStatus === 'saved' && (
        <div className="bg-[#059669] text-white py-2 px-4 text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-inner">
          <CheckCircle size={16} />
          <span>{statusMessage || 'All changes saved and live worldwide!'}</span>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="bg-red-600 text-white py-2 px-4 text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-inner">
          <AlertCircle size={16} />
          <span>{statusMessage || 'An error occurred while saving.'}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MAIN CMS SHELL (SIDEBAR + MAIN CONTENT AREA)           */}
      {/* ========================================================= */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col lg:flex-row gap-6">
        {/* ========================================================= */}
        {/* LEFT NAVIGATION SIDEBAR                                   */}
        {/* ========================================================= */}
        <aside
          className={`lg:w-72 shrink-0 ${
            mobileMenuOpen ? 'block' : 'hidden lg:block'
          } bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 h-fit sticky top-20 self-start`}
          id="cms-sidebar"
        >
          {/* Quick Search / Filter Input */}
          <div className="relative mb-3.5">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Jump to section (e.g. timer, faq)..."
              className="w-full pl-8.5 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[var(--blue-primary)] focus:bg-white transition"
              id="cms-sidebar-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Navigation Group Sections */}
          <nav className="space-y-4 max-h-[calc(100vh-190px)] overflow-y-auto pr-1">
            {/* 1. Urgency & Conversions Group */}
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center justify-between">
                <span>Conversions & Urgency</span>
                <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.2 rounded">Priority</span>
              </div>
              <div className="space-y-0.5">
                {filteredNavItems
                  .filter((i) => i.category === 'conversions')
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveSection(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isActive
                            ? 'bg-[var(--blue-primary)] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        id={`nav-item-${item.id}`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon size={15} className={isActive ? 'text-white' : 'text-slate-500'} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                              isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* 2. Story & Copy Group */}
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                Sales Story & Content
              </div>
              <div className="space-y-0.5">
                {filteredNavItems
                  .filter((i) => i.category === 'copy')
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveSection(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isActive
                            ? 'bg-[var(--blue-primary)] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        id={`nav-item-${item.id}`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon size={15} className={isActive ? 'text-white' : 'text-slate-500'} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <ChevronRight
                          size={12}
                          className={isActive ? 'text-white/70' : 'text-slate-300'}
                        />
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* 3. Visuals & Media */}
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                Styling & Assets
              </div>
              <div className="space-y-0.5">
                {filteredNavItems
                  .filter((i) => i.category === 'visuals')
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveSection(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isActive
                            ? 'bg-[var(--blue-primary)] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        id={`nav-item-${item.id}`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon size={15} className={isActive ? 'text-white' : 'text-slate-500'} />
                          <span className="truncate">{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* 4. System & Analytics */}
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                System & Insights
              </div>
              <div className="space-y-0.5">
                {filteredNavItems
                  .filter((i) => i.category === 'system')
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveSection(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isActive
                            ? 'bg-[var(--blue-primary)] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                        id={`nav-item-${item.id}`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon size={15} className={isActive ? 'text-white' : 'text-slate-500'} />
                          <span className="truncate">{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </nav>

          {/* Quick Footer Action in Sidebar */}
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer transition"
              title="Reset all content to original default source"
            >
              <RotateCcw size={12} />
              <span>Reset Copy</span>
            </button>

            <span className="text-[10px] text-slate-400 font-mono">v2.4</span>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* MAIN EDITING WORKSPACE + SPLIT PREVIEW                    */}
        {/* ========================================================= */}
        <main className={`flex-1 min-w-0 ${showLivePreview ? 'lg:grid lg:grid-cols-12 lg:gap-6' : ''}`}>
          {/* Active Section Editor Container */}
          <div className={`${showLivePreview ? 'lg:col-span-7' : 'w-full'} space-y-6`}>
            {/* Section Breadcrumb & Header Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Editing Section
                </div>
                <h1 className="font-serif text-lg sm:text-xl font-bold text-[#0F172A] m-0">
                  {NAV_ITEMS.find((i) => i.id === activeSection)?.label || 'Section Editor'}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[var(--blue-primary)] hover:bg-[var(--blue-hover)] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                  id="section-quick-save-btn"
                >
                  <Save size={14} />
                  <span className="hidden sm:inline">Save Section</span>
                  <span className="sm:hidden">Save</span>
                </button>
              </div>
            </div>

            {/* SECTION 1: OVERVIEW & SYSTEM HEALTH */}
            {activeSection === 'overview' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1">
                    System Health & Publishing Pipeline
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Status of your live database connection, publishing status, and quick links to core controls.
                  </p>
                </div>

                {/* Diagnostics Status Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="p-2.5 rounded-xl bg-white border border-slate-200 text-[#0022DA] shadow-xs">
                      <Database size={20} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0F172A]">Supabase Database</span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                          style={
                            supabaseChecking
                              ? { backgroundColor: '#FEF08A', color: '#854D0E' }
                              : supabaseHealth?.status === 'connected'
                              ? { backgroundColor: '#D1FAE5', color: '#065F46' }
                              : { backgroundColor: '#FEE2E2', color: '#991B1B' }
                          }
                        >
                          {supabaseChecking ? 'Checking' : supabaseHealth?.status === 'connected' ? 'Connected' : 'Error'}
                        </span>
                      </div>
                      <p className="text-xs text-[#475569] mt-0.5 m-0 font-mono">
                        Endpoint: {getSupabaseProjectDomain() || 'Configured via VITE_SUPABASE_URL'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDiagnosticModal(true)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
                  >
                    Open Diagnostics Modal
                  </button>
                </div>

                {/* Quick Action Grid */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Quick Shortcut Controls
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveSection('urgency')}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-left transition cursor-pointer hover:shadow-xs group"
                    >
                      <Clock size={16} className="text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="font-bold text-xs text-[#0F172A]">Countdown Timer</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Adjust days, hours, or presets</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection('pricing')}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-left transition cursor-pointer hover:shadow-xs group"
                    >
                      <DollarSign size={16} className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="font-bold text-xs text-[#0F172A]">Pricing & Links</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Edit ₦5,000 price or checkout URL</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection('faq')}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-left transition cursor-pointer hover:shadow-xs group"
                    >
                      <MessageSquare size={16} className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="font-bold text-xs text-[#0F172A]">FAQs & Proof</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Manage 7 objections & answers</div>
                    </button>
                  </div>
                </div>

                <SectionSaveButton />
              </div>
            )}

            {/* SECTION 2: URGENCY & COUNTDOWN TIMER */}
            {activeSection === 'urgency' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6" id="cms-urgency-section">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-[#0F172A] m-0">
                      Countdown Timer & Urgency Engine
                    </h2>
                    <p className="text-xs text-[#64748B] mt-1 m-0">
                      Set promotion countdowns that update live in the sticky top banner and above the pricing box.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRestartCountdownTimer}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto shrink-0 hover:opacity-95"
                    style={{ backgroundColor: 'var(--blue-primary)' }}
                    id="restart-timer-btn"
                  >
                    <RefreshCw size={13} />
                    <span>Restart Timer From Now</span>
                  </button>
                </div>

                {/* Master Toggle */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-[#0F172A]">
                      Enable Countdown Urgency on Sales Page
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      Activates the real-time countdown timer components for all visitors.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={content.enableCountdownTimer}
                      onChange={(e) => setContent((prev) => ({ ...prev, enableCountdownTimer: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--blue-primary)]" />
                  </label>
                </div>

                {/* Duration Inputs */}
                <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                    <Flame size={14} className="text-amber-500" />
                    <span>Set Countdown Window Duration</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Days</label>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={content.countdownDays ?? 2}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setContent((prev) => ({ ...prev, countdownDays: val }));
                        }}
                        className="w-full text-center font-mono font-bold text-xl p-1.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                        id="timer-input-days"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Hours</label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={content.countdownHours ?? 14}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(23, parseInt(e.target.value, 10) || 0));
                          setContent((prev) => ({ ...prev, countdownHours: val }));
                        }}
                        className="w-full text-center font-mono font-bold text-xl p-1.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                        id="timer-input-hours"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Minutes</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={content.countdownMinutes ?? 30}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0));
                          setContent((prev) => ({ ...prev, countdownMinutes: val }));
                        }}
                        className="w-full text-center font-mono font-bold text-xl p-1.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                        id="timer-input-minutes"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                      <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Seconds</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={content.countdownSeconds ?? 0}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0));
                          setContent((prev) => ({ ...prev, countdownSeconds: val }));
                        }}
                        className="w-full text-center font-mono font-bold text-xl p-1.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                        id="timer-input-seconds"
                      />
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Quick Promotion Presets (Click to apply & push live):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applyCountdownPreset(1, 0, 0, 0)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200"
                      >
                        ⚡ 24-Hour Flash Sale
                      </button>
                      <button
                        type="button"
                        onClick={() => applyCountdownPreset(2, 14, 30, 0)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200"
                      >
                        🔥 Weekend Deal (2d 14h 30m)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyCountdownPreset(3, 0, 0, 0)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200"
                      >
                        📅 3-Day Campaign
                      </button>
                      <button
                        type="button"
                        onClick={() => applyCountdownPreset(0, 0, 45, 0)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200"
                      >
                        ⏳ Final 45 Minutes
                      </button>
                    </div>
                  </div>
                </div>

                {/* Placement Options */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Display Locations
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={content.countdownShowInTopBanner !== false}
                      onChange={(e) => setContent((prev) => ({ ...prev, countdownShowInTopBanner: e.target.checked }))}
                      className="w-4 h-4 rounded text-[var(--blue-primary)] border-slate-300"
                    />
                    <span className="text-xs text-[#0F172A] font-medium">Display in Fixed Sticky Top Urgency Banner</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={content.countdownShowInPriceSection !== false}
                      onChange={(e) => setContent((prev) => ({ ...prev, countdownShowInPriceSection: e.target.checked }))}
                      className="w-4 h-4 rounded text-[var(--blue-primary)] border-slate-300"
                    />
                    <span className="text-xs text-[#0F172A] font-medium">Display Urgency Card directly above Pricing Section</span>
                  </label>
                </div>

                {/* Copy Customization */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Urgency Badge Title</label>
                    <input
                      type="text"
                      value={content.countdownOfferTitle || ''}
                      onChange={(e) => setContent((prev) => ({ ...prev, countdownOfferTitle: e.target.value }))}
                      placeholder="Limited Time Offer"
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Urgency Subtitle / Warning</label>
                    <textarea
                      rows={2}
                      value={content.countdownOfferSubtitle || ''}
                      onChange={(e) => setContent((prev) => ({ ...prev, countdownOfferSubtitle: e.target.value }))}
                      placeholder="Launch discount window is closing soon — price rises from ₦5,000 to ₦7,000 once timer expires."
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Message (When Timer Hits 0)</label>
                    <input
                      type="text"
                      value={content.countdownExpiredText || ''}
                      onChange={(e) => setContent((prev) => ({ ...prev, countdownExpiredText: e.target.value }))}
                      placeholder="Special launch pricing window closing shortly — lock in ₦5,000 now!"
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                    />
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                  <div className="text-xs font-bold text-[#0F172A] mb-3">Live Countdown Component Preview:</div>
                  <CountdownTimer
                    variant="card"
                    days={content.countdownDays}
                    hours={content.countdownHours}
                    minutes={content.countdownMinutes}
                    seconds={content.countdownSeconds}
                    targetTimestamp={content.countdownTargetTimestamp}
                    title={content.countdownOfferTitle || 'Limited Time Offer'}
                    subtitle={content.countdownOfferSubtitle}
                    expiredText={content.countdownExpiredText}
                    ctaUrl="#preview"
                    ctaText="Claim ₦5,000 Early Bird Access"
                  />
                </div>

                <SectionSaveButton label="Publish Countdown Settings" />
              </div>
            )}

            {/* SECTION 3: PRICING & CHECKOUT */}
            {activeSection === 'pricing' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1">Pricing, Checkout URLs & Guarantee</h2>
                  <p className="text-xs text-[#64748B]">
                    Manage pricing anchors, discount copy, and Nestuge payment checkout link.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Current Launch Price</label>
                    <input
                      type="text"
                      value={content.priceCurrent}
                      onChange={(e) => setContent((p) => ({ ...p, priceCurrent: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-[#0022DA]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Price Anchor / Price Rise Note</label>
                    <input
                      type="text"
                      value={content.priceOriginal}
                      onChange={(e) => setContent((p) => ({ ...p, priceOriginal: e.target.value }))}
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary Button CTA Text</label>
                    <input
                      type="text"
                      value={content.priceCtaText}
                      onChange={(e) => setContent((p) => ({ ...p, priceCtaText: e.target.value }))}
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nestuge Checkout URL</label>
                    <input
                      type="text"
                      value={content.priceCtaUrl}
                      onChange={(e) => setContent((p) => ({ ...p, priceCtaUrl: e.target.value }))}
                      className="w-full text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <div className="text-xs font-bold text-[#0F172A]">7-Day Money-Back Guarantee Box</div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Guarantee Heading</label>
                    <input
                      type="text"
                      value={content.guaranteeTitle}
                      onChange={(e) => setContent((p) => ({ ...p, guaranteeTitle: e.target.value }))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Guarantee Description</label>
                    <textarea
                      rows={2}
                      value={content.guaranteeText}
                      onChange={(e) => setContent((p) => ({ ...p, guaranteeText: e.target.value }))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                    />
                  </div>
                </div>

                <SectionSaveButton label="Publish Pricing Changes" />
              </div>
            )}

            {/* SECTION 4: HERO & MASTHEAD */}
            {activeSection === 'hero' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1">Hero Section & Headline Copy</h2>
                  <p className="text-xs text-[#64748B]">The very first thing visitors read above the fold.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Masthead Category Text</label>
                  <input
                    type="text"
                    value={content.mastheadText}
                    onChange={(e) => setContent((p) => ({ ...p, mastheadText: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Main Headline (H1)</label>
                  <textarea
                    rows={2}
                    value={content.heroTitle}
                    onChange={(e) => setContent((p) => ({ ...p, heroTitle: e.target.value }))}
                    className="w-full text-sm font-serif font-bold p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hero Subheadline</label>
                  <textarea
                    rows={2}
                    value={content.heroSubhead}
                    onChange={(e) => setContent((p) => ({ ...p, heroSubhead: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Image Alt Text (SEO & Accessibility)</label>
                  <input
                    type="text"
                    value={content.heroImageAlt}
                    onChange={(e) => setContent((p) => ({ ...p, heroImageAlt: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                  />
                </div>

                <SectionSaveButton label="Publish Hero Changes" />
              </div>
            )}

            {/* SECTION 5: LEDE STORY */}
            {activeSection === 'lede' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1">Lede Story Paragraphs</h2>
                  <p className="text-xs text-[#64748B]">Personal narrative connecting with the reader's upbringing.</p>
                </div>

                <div className="space-y-3">
                  {content.ledeParagraphs.map((para, idx) => (
                    <div key={idx}>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Paragraph {idx + 1}</label>
                      <textarea
                        rows={2}
                        value={para}
                        onChange={(e) => {
                          const next = [...content.ledeParagraphs];
                          next[idx] = e.target.value;
                          setContent((p) => ({ ...p, ledeParagraphs: next }));
                        }}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Solo Punchline / Standout Line</label>
                  <input
                    type="text"
                    value={content.ledeHighlight}
                    onChange={(e) => setContent((p) => ({ ...p, ledeHighlight: e.target.value }))}
                    className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                  />
                </div>

                <SectionSaveButton label="Publish Lede Story" />
              </div>
            )}

            {/* SECTION 6: PROBLEM & THE TURN */}
            {activeSection === 'problem' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1">The Problem & The Turn</h2>
                  <p className="text-xs text-[#64748B]">Articulates the two fears and introduces the pattern shift.</p>
                </div>

                {/* Problem Paragraphs */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-[#0F172A]">Problem Narrative</div>
                  {content.problemParagraphs.map((para, idx) => (
                    <div key={idx}>
                      <label className="block text-[11px] text-slate-500 mb-1">Problem Paragraph {idx + 1}</label>
                      <textarea
                        rows={2}
                        value={para}
                        onChange={(e) => {
                          const next = [...content.problemParagraphs];
                          next[idx] = e.target.value;
                          setContent((p) => ({ ...p, problemParagraphs: next }));
                        }}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Problem Punchline</label>
                    <input
                      type="text"
                      value={content.problemPunchline}
                      onChange={(e) => setContent((p) => ({ ...p, problemPunchline: e.target.value }))}
                      className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                    />
                  </div>
                </div>

                {/* Turn Paragraphs */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-[#0F172A]">The Turn ("Here's what nobody told you")</div>
                  {content.turnParagraphs.map((para, idx) => (
                    <div key={idx}>
                      <label className="block text-[11px] text-slate-500 mb-1">Turn Paragraph {idx + 1}</label>
                      <textarea
                        rows={2}
                        value={para}
                        onChange={(e) => {
                          const next = [...content.turnParagraphs];
                          next[idx] = e.target.value;
                          setContent((p) => ({ ...p, turnParagraphs: next }));
                        }}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Turn Highlight Banner Text</label>
                    <input
                      type="text"
                      value={content.turnBanner}
                      onChange={(e) => setContent((p) => ({ ...p, turnBanner: e.target.value }))}
                      className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-lg text-[#0022DA]"
                    />
                  </div>
                </div>

                <SectionSaveButton label="Publish Problem & Turn" />
              </div>
            )}

            {/* SECTION 7: INTRODUCTION */}
            {activeSection === 'intro' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1">Bundle Introduction Section</h2>
                  <p className="text-xs text-[#64748B]">Introduces The Home Training Blueprint Bundle.</p>
                </div>

                <div className="space-y-3">
                  {content.introParagraphs.map((para, idx) => (
                    <div key={idx}>
                      <label className="block text-[11px] text-slate-500 mb-1">Intro Paragraph {idx + 1}</label>
                      <textarea
                        rows={2}
                        value={para}
                        onChange={(e) => {
                          const next = [...content.introParagraphs];
                          next[idx] = e.target.value;
                          setContent((p) => ({ ...p, introParagraphs: next }));
                        }}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Intro Highlight / Solo Punchline</label>
                  <input
                    type="text"
                    value={content.introHighlight}
                    onChange={(e) => setContent((p) => ({ ...p, introHighlight: e.target.value }))}
                    className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                  />
                </div>

                <SectionSaveButton label="Publish Intro Section" />
              </div>
            )}

            {/* SECTION 8: PRODUCTS & BONUSES */}
            {activeSection === 'products' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1">Core Guides & Bonus Toolkits</h2>
                  <p className="text-xs text-[#64748B]">
                    Edit titles and descriptions for the 3 core pieces and 2 bonus assets.
                  </p>
                </div>

                {/* Core Products */}
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    What's Inside (3 Core Items)
                  </div>
                  {content.coreProducts.map((prod, idx) => (
                    <div key={prod.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0F172A]">Core Item {idx + 1}: {prod.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {prod.id}</span>
                      </div>
                      <input
                        type="text"
                        value={prod.name}
                        onChange={(e) => updateProduct(prod.id, 'name', e.target.value)}
                        className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg"
                      />
                      <textarea
                        rows={2}
                        value={prod.description}
                        onChange={(e) => updateProduct(prod.id, 'description', e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                      />
                    </div>
                  ))}
                </div>

                {/* Bonus Products */}
                <div className="space-y-4 pt-3 border-t border-slate-200">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Two Bonuses</span>
                  </div>
                  {content.bonusProducts.map((prod, idx) => (
                    <div key={prod.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900">{prod.bonusTag || `Bonus ${idx + 1}`}: {prod.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {prod.id}</span>
                      </div>
                      <input
                        type="text"
                        value={prod.name}
                        onChange={(e) => updateProduct(prod.id, 'name', e.target.value)}
                        className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg"
                      />
                      <textarea
                        rows={2}
                        value={prod.description}
                        onChange={(e) => updateProduct(prod.id, 'description', e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                      />
                    </div>
                  ))}
                </div>

                <SectionSaveButton label="Publish Products & Bonuses" />
              </div>
            )}

            {/* SECTION 9: PROOF & WHO IT'S FOR */}
            {activeSection === 'proof' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1">Proof & Audience Fit Lists</h2>
                  <p className="text-xs text-[#64748B]">Manage authenticity proof paragraphs and the who-it-is-for filters.</p>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-bold text-[#0F172A]">Honest Proof Copy</div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Proof Paragraph 1</label>
                    <textarea
                      rows={2}
                      value={content.proofParagraph1}
                      onChange={(e) => setContent((p) => ({ ...p, proofParagraph1: e.target.value }))}
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Paragraph 2 ("What it won't do")</label>
                    <textarea
                      rows={2}
                      value={content.proofParagraph2Rest}
                      onChange={(e) => setContent((p) => ({ ...p, proofParagraph2Rest: e.target.value }))}
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Who for / Not for */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2">
                    <span className="text-xs font-bold text-emerald-900">This is for you if:</span>
                    {content.whoForItems.map((item, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const next = [...content.whoForItems];
                          next[idx] = e.target.value;
                          setContent((p) => ({ ...p, whoForItems: next }));
                        }}
                        className="w-full text-xs p-2 bg-white border border-emerald-200 rounded-lg"
                      />
                    ))}
                  </div>

                  <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 space-y-2">
                    <span className="text-xs font-bold text-rose-900">This is NOT for you if:</span>
                    {content.notForItems.map((item, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const next = [...content.notForItems];
                          next[idx] = e.target.value;
                          setContent((p) => ({ ...p, notForItems: next }));
                        }}
                        className="w-full text-xs p-2 bg-white border border-rose-200 rounded-lg"
                      />
                    ))}
                  </div>
                </div>

                <SectionSaveButton label="Publish Proof & Audience Fit" />
              </div>
            )}

            {/* SECTION 10: FAQ & TESTIMONIALS */}
            {activeSection === 'faq' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-[#0F172A] m-0">Frequently Asked Questions ({content.faqs.length})</h2>
                    <p className="text-xs text-[#64748B] m-0 mt-0.5">Edit or add objections and clear responses.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addFaq}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {content.faqs.map((faq, idx) => (
                    <div key={faq.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Question #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeFaq(idx)}
                          className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                        className="w-full text-xs font-semibold p-2 bg-white border border-slate-300 rounded-lg"
                      />
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                      />
                    </div>
                  ))}
                </div>

                {/* Social Proof Reviews (Extensible) */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-[#0F172A]">Parent Reflections / Testimonials</h3>
                      <p className="text-[11px] text-[#64748B]">Optional real reviews section.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={content.enableSocialProofSection}
                        onChange={(e) => setContent((p) => ({ ...p, enableSocialProofSection: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--blue-primary)]" />
                    </label>
                  </div>

                  {content.enableSocialProofSection && (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={addTestimonial}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={12} /> Add Review
                      </button>
                      {(content.testimonials || []).map((t, idx) => (
                        <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <input
                              type="text"
                              value={t.name}
                              onChange={(e) => updateTestimonial(idx, 'name', e.target.value)}
                              placeholder="Parent Name"
                              className="text-xs font-bold p-1 border rounded w-1/3"
                            />
                            <button
                              type="button"
                              onClick={() => removeTestimonial(idx)}
                              className="text-red-500 text-xs cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={t.quote}
                            onChange={(e) => updateTestimonial(idx, 'quote', e.target.value)}
                            placeholder="Quote text"
                            className="w-full text-xs p-1.5 border rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <SectionSaveButton label="Publish FAQ Changes" />
              </div>
            )}

            {/* SECTION 11: CLOSING COPY & PS */}
            {activeSection === 'closing' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1">Closing Narrative, PS & Sticky Bar</h2>
                  <p className="text-xs text-[#64748B]">Final call-to-action blocks and mobile sticky bar.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Why Now Kicker Headline</label>
                    <input
                      type="text"
                      value={content.whyNowKicker}
                      onChange={(e) => setContent((p) => ({ ...p, whyNowKicker: e.target.value }))}
                      className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Close Section Title</label>
                    <input
                      type="text"
                      value={content.closeTitle}
                      onChange={(e) => setContent((p) => ({ ...p, closeTitle: e.target.value }))}
                      className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Close Paragraph</label>
                    <textarea
                      rows={2}
                      value={content.closeParagraph}
                      onChange={(e) => setContent((p) => ({ ...p, closeParagraph: e.target.value }))}
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A]"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="text-xs font-bold text-[#0F172A]">PS Block</div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">PS Paragraph 1</label>
                    <textarea
                      rows={2}
                      value={content.psParagraph1}
                      onChange={(e) => setContent((p) => ({ ...p, psParagraph1: e.target.value }))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">PS Paragraph 2 (Guarantee reminder)</label>
                    <input
                      type="text"
                      value={content.psParagraph2}
                      onChange={(e) => setContent((p) => ({ ...p, psParagraph2: e.target.value }))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-[#0F172A]">Mobile Sticky Bottom Bar</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={content.stickyPrice}
                      onChange={(e) => setContent((p) => ({ ...p, stickyPrice: e.target.value }))}
                      placeholder="₦5,000"
                      className="text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold text-[#0022DA]"
                    />
                    <input
                      type="text"
                      value={content.stickyButtonText}
                      onChange={(e) => setContent((p) => ({ ...p, stickyButtonText: e.target.value }))}
                      placeholder="Get Bundle"
                      className="text-xs p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <SectionSaveButton label="Publish Closing Copy" />
              </div>
            )}

            {/* SECTION 12: BRANDING */}
            {activeSection === 'branding' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1">Brand Color & Dynamic Theming</h2>
                  <p className="text-xs text-[#64748B]">
                    Select or customize your signature accent color to dynamically update all buttons and highlights.
                  </p>
                </div>

                {/* Presets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {BRAND_COLOR_PRESETS.map((preset) => {
                    const isSelected =
                      (content.primaryBrandColor || '#0022DA').toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleBrandColorChange(preset.hex)}
                        className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'border-2 shadow-md bg-white'
                            : 'border-slate-200 bg-slate-50 hover:bg-white'
                        }`}
                        style={{ borderColor: isSelected ? preset.hex : undefined }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: preset.hex }} />
                            <span className="font-bold text-xs text-[#0F172A]">{preset.name}</span>
                          </div>
                          {isSelected && <Check size={14} style={{ color: preset.hex }} />}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{preset.hex}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">Custom Hex Code</div>
                    <div className="text-[11px] text-slate-500">Pick any custom brand color</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={content.primaryBrandColor || '#0022DA'}
                      onChange={(e) => handleBrandColorChange(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={content.primaryBrandColor || '#0022DA'}
                      onChange={(e) => handleBrandColorChange(e.target.value)}
                      className="w-24 text-xs font-mono p-2 bg-white border border-slate-300 rounded-lg text-center"
                    />
                  </div>
                </div>

                <SectionSaveButton label="Publish Brand Color" />
              </div>
            )}

            {/* SECTION 13: IMAGES & OPTIMIZER */}
            {activeSection === 'images' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1">Image Library & Client-Side Compression</h2>
                  <p className="text-xs text-[#64748B]">
                    Upload images that are automatically compressed into lightweight WebP for lightning-fast mobile loads.
                  </p>
                </div>

                {/* Hero Image Block */}
                <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-[#0F172A]">Hero Section Main Banner</div>
                    {content.heroImageUrl && (
                      <button
                        type="button"
                        onClick={() => setContent((p) => ({ ...p, heroImageUrl: '' }))}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="w-32 h-20 bg-slate-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border">
                      {content.heroImageUrl ? (
                        <img src={content.heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={24} className="text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <input
                        type="text"
                        value={content.heroImageUrl}
                        onChange={(e) => setContent((p) => ({ ...p, heroImageUrl: e.target.value }))}
                        placeholder="Image URL or upload below..."
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                      />
                      <input
                        type="file"
                        ref={heroFileRef}
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'hero');
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={uploadingField === 'hero'}
                        onClick={() => heroFileRef.current?.click()}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Upload size={13} />
                        <span>{uploadingField === 'hero' ? 'Compressing & Uploading...' : 'Upload & Auto-Compress Image'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <SectionSaveButton label="Publish Image Changes" />
              </div>
            )}

            {/* SECTION 14: SEO & META */}
            {activeSection === 'seo' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1">Search Engine & Social Preview Meta</h2>
                  <p className="text-xs text-[#64748B]">
                    Controls how your link appears on Google search results, WhatsApp, Facebook, and Twitter.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SEO Title Tag</label>
                  <input
                    type="text"
                    value={content.seoTitle}
                    onChange={(e) => setContent((p) => ({ ...p, seoTitle: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SEO Meta Description</label>
                  <textarea
                    rows={3}
                    value={content.seoDescription}
                    onChange={(e) => setContent((p) => ({ ...p, seoDescription: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Google Search Simulator */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Google Search Snippet Preview</div>
                  <div className="text-xs text-[#1a0dab] font-semibold truncate hover:underline cursor-pointer">
                    {content.seoTitle}
                  </div>
                  <div className="text-[11px] text-[#006621] truncate">https://nestuge.com/hometrainingblueprint</div>
                  <div className="text-[11px] text-[#4d5156] line-clamp-2 leading-relaxed">
                    {content.seoDescription}
                  </div>
                </div>

                <SectionSaveButton label="Publish SEO Tags" />
              </div>
            )}

            {/* SECTION 15: ANALYTICS */}
            {activeSection === 'analytics' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
                <AdminAnalytics content={content} />
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* REAL-TIME SPLIT-VIEW PREVIEW PANE                         */}
          {/* ========================================================= */}
          {showLivePreview && (
            <div className="hidden lg:block lg:col-span-5 sticky top-20 self-start">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-lg overflow-hidden flex flex-col h-[calc(100vh-120px)]">
                {/* Preview Toolbar */}
                <div className="bg-slate-900 text-white p-3 flex items-center justify-between gap-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold">Interactive Live Preview</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-1 rounded text-xs transition cursor-pointer ${
                        previewDevice === 'desktop' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Desktop view"
                    >
                      <Monitor size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-1 rounded text-xs transition cursor-pointer ${
                        previewDevice === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Mobile view"
                    >
                      <Smartphone size={14} />
                    </button>
                  </div>
                </div>

                {/* Preview Frame */}
                <div className="flex-1 overflow-y-auto bg-slate-100 p-2 flex justify-center">
                  <div
                    className={`bg-white transition-all shadow-md overflow-y-auto h-full ${
                      previewDevice === 'mobile' ? 'w-[375px] rounded-2xl border-4 border-slate-800' : 'w-full'
                    }`}
                  >
                    <SalesPage content={content} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* 3. DIAGNOSTICS & RESET MODALS                             */}
      {/* ========================================================= */}

      {/* Supabase Connection Diagnostics Modal */}
      {showDiagnosticModal && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-[#0F172A] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[var(--blue-light)] text-[var(--blue-primary)] border border-[var(--blue-border)]">
                  <Database size={20} />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#0F172A] leading-tight m-0">
                    Supabase Database Diagnostics
                  </h3>
                  <p className="text-xs text-[#64748B] m-0 mt-0.5">
                    Live connection and publishing status monitor
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDiagnosticModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Status Hero Card */}
            <div
              className="p-4 rounded-xl border flex items-start gap-3 transition-colors"
              style={
                supabaseChecking
                  ? { backgroundColor: '#FEFCE8', borderColor: '#FEF08A' }
                  : supabaseHealth?.status === 'connected'
                  ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }
                  : supabaseHealth?.status === 'error'
                  ? { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }
                  : { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }
              }
            >
              <div className="shrink-0 mt-0.5">
                {supabaseChecking ? (
                  <RefreshCw size={20} className="animate-spin text-amber-600" />
                ) : supabaseHealth?.status === 'connected' ? (
                  <CheckCircle size={20} className="text-emerald-600" />
                ) : supabaseHealth?.status === 'error' ? (
                  <XCircle size={20} className="text-red-600" />
                ) : (
                  <Activity size={20} className="text-slate-500" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#0F172A]">Connection Status:</span>
                  <span
                    className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                    style={
                      supabaseChecking
                        ? { backgroundColor: '#FEF08A', color: '#854D0E' }
                        : supabaseHealth?.status === 'connected'
                        ? { backgroundColor: '#D1FAE5', color: '#065F46' }
                        : supabaseHealth?.status === 'error'
                        ? { backgroundColor: '#FEE2E2', color: '#991B1B' }
                        : { backgroundColor: '#E2E8F0', color: '#475569' }
                    }
                  >
                    {supabaseChecking ? 'Checking' : supabaseHealth?.status === 'connected' ? 'Connected' : 'Error'}
                  </span>
                </div>
                <p className="text-xs text-[#475569] mt-1 mb-0 leading-relaxed">
                  {supabaseChecking ? 'Probing Supabase REST endpoint...' : supabaseHealth?.message}
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[#64748B] block font-medium mb-1">Response Latency</span>
                <span className="text-base font-bold font-mono text-[#0F172A]">
                  {supabaseHealth?.latencyMs !== undefined ? `${supabaseHealth.latencyMs} ms` : '--'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[#64748B] block font-medium mb-1">Target Table</span>
                <span className="text-xs font-bold text-[#0F172A] font-mono">site_content</span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">✓ sales_page row live</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={runSupabaseDiagnostic}
                disabled={supabaseChecking}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-100 transition cursor-pointer text-[#0F172A] disabled:opacity-50"
              >
                <RefreshCw size={13} className={supabaseChecking ? 'animate-spin' : ''} />
                <span>{supabaseChecking ? 'Testing...' : 'Retest Probe'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDiagnosticModal(false)}
                className="px-4 py-2 text-xs font-bold text-white rounded-lg transition shadow-xs cursor-pointer"
                style={{ backgroundColor: 'var(--blue-primary)' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revert confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-[#0F172A]">
            <h3 className="font-serif text-lg font-bold text-[#0F172A] mb-2">Revert to Original Defaults?</h3>
            <p className="text-sm text-[#64748B] mb-6 leading-relaxed">
              Are you sure you want to revert all text and settings back to the default original sales page?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmResetToDefaults}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm cursor-pointer"
              >
                Yes, Revert to Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
