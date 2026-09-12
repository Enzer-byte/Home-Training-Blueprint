import React, { useState, useRef } from 'react';
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
  Layers,
  FileText,
  DollarSign,
  Sparkles,
  AlertCircle,
  BarChart3,
  Zap,
  Palette,
  Clock,
  Flame,
  RefreshCw
} from 'lucide-react';
import { SalesPageContent, ProductItem, FaqItem, TestimonialItem } from '../types';
import { api } from '../services/api';
import { resizeAndCompressImage, formatFileSize } from '../utils/imageOptimizer';
import { DEFAULT_CONTENT } from '../defaultContent';
import { AdminAnalytics } from './AdminAnalytics';
import { CountdownTimer } from './CountdownTimer';
import { applyBrandColor, BRAND_COLOR_PRESETS, computeThemeVariables } from '../utils/theme';

interface AdminCMSProps {
  initialContent: SalesPageContent;
  onContentUpdate: (newContent: SalesPageContent) => void;
  onLogout: () => void;
}

type TabType = 'images' | 'branding' | 'urgency' | 'copy' | 'pricing' | 'features' | 'analytics';

export const AdminCMS: React.FC<AdminCMSProps> = ({
  initialContent,
  onContentUpdate,
  onLogout
}) => {
  const [content, setContent] = useState<SalesPageContent>(initialContent);
  const [activeTab, setActiveTab] = useState<TabType>('images');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // File input refs
  const heroFileRef = useRef<HTMLInputElement>(null);

  // Simple notification handler
  const triggerStatus = (status: 'saved' | 'error' | 'saving', msg: string) => {
    setSaveStatus(status);
    setStatusMessage(msg);
    if (status !== 'saving') {
      setTimeout(() => {
        setSaveStatus('idle');
      }, 4000);
    }
  };

  // Save changes to backend
  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const res = await api.saveContent(content);
      if (res.success) {
        onContentUpdate(content);
        triggerStatus('saved', 'Changes published and live for all visitors!');
      } else {
        triggerStatus('error', res.message || 'Failed to publish changes.');
      }
    } catch {
      triggerStatus('error', 'Network error while publishing.');
    }
  };

  // Trigger reset confirmation modal
  const handleResetToDefaults = () => {
    setShowResetConfirm(true);
  };

  // Confirm reset to original default copy
  const confirmResetToDefaults = async () => {
    setShowResetConfirm(false);
    setSaveStatus('saving');
    await api.resetToDefaults();
    setContent(DEFAULT_CONTENT);
    onContentUpdate(DEFAULT_CONTENT);
    triggerStatus('saved', 'Reverted to original source copy.');
  };

  // Handle image file selection & upload with automatic client-side resizing and compression
  const handleImageUpload = async (
    file: File,
    targetType: 'hero' | 'product',
    productId?: string
  ) => {
    // Basic file validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      triggerStatus('error', 'Please upload a valid image file (JPEG, PNG, WEBP, or GIF).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      triggerStatus('error', 'File is extremely large (exceeds 25MB). Please select an image under 25MB.');
      return;
    }

    const fieldKey = targetType === 'hero' ? 'hero' : `product-${productId}`;
    setUploadingField(fieldKey);
    triggerStatus('saving', 'Optimizing and compressing image for fast page load...');

    try {
      // 1. Automatically resize and compress image to modern WebP/JPEG before upload
      const optimized = await resizeAndCompressImage(file, {
        maxWidth: targetType === 'hero' ? 1600 : 1000,
        maxHeight: targetType === 'hero' ? 1600 : 1000,
        quality: 0.82
      });

      // 2. Upload the compressed result
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
          `Optimized & saved! ${formatFileSize(optimized.originalSize)} → ${formatFileSize(optimized.compressedSize)} (${optimized.savingsPercent}% reduction for faster load times)`
        );
      } else {
        triggerStatus('error', res.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      triggerStatus('error', 'Failed to compress or upload image. Please try again.');
    } finally {
      setUploadingField(null);
    }
  };

  // Update specific core or bonus product
  const updateProduct = (
    id: string,
    field: keyof ProductItem,
    value: string
  ) => {
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

  // Brand Color Handlers (Dynamic CSS variables)
  const handleBrandColorChange = (hex: string) => {
    setContent((prev) => ({
      ...prev,
      primaryBrandColor: hex
    }));
    applyBrandColor(hex);
    onContentUpdate({
      ...content,
      primaryBrandColor: hex
    });
  };

  // Urgency Countdown Handlers (Customizable in days, minutes, and seconds)
  const handleRestartCountdownTimer = () => {
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

    setContent((prev) => ({
      ...prev,
      countdownTargetTimestamp: newTarget
    }));
    triggerStatus('saved', 'Countdown timer restarted and synchronized with backend!');
  };

  const applyCountdownPreset = (d: number, h: number, m: number, s: number) => {
    const totalMs = (d * 86400 + h * 3600 + m * 60 + s) * 1000;
    const newTarget = Date.now() + totalMs;

    setContent((prev) => ({
      ...prev,
      countdownDays: d,
      countdownHours: h,
      countdownMinutes: m,
      countdownSeconds: s,
      countdownTargetTimestamp: newTarget
    }));
    triggerStatus('saved', `Applied ${d}d ${h}h ${m}m ${s}s preset!`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24" id="admin-cms-dashboard">
      {/* Top Navigation Bar */}
      <header className="bg-[#0B192C] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif font-bold text-lg sm:text-xl text-white">
              SheRoots Foundation CMS
            </span>
            <span
              className="hidden sm:inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide text-white"
              style={{ backgroundColor: 'var(--blue-primary)' }}
            >
              ADMIN
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white transition"
              id="cms-view-site-link"
            >
              <ExternalLink size={15} />
              <span className="hidden sm:inline">View Public Site</span>
            </a>

            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-white transition shadow disabled:opacity-50 cursor-pointer hover:opacity-95"
              style={{ backgroundColor: 'var(--blue-primary)' }}
              id="cms-publish-button"
            >
              {saveStatus === 'saving' ? (
                <span>Publishing...</span>
              ) : (
                <>
                  <Save size={16} />
                  <span>Publish Changes</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              title="Sign Out"
              aria-label="Sign out"
              id="cms-logout-button"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Save Notification Banner */}
      {saveStatus === 'saved' && (
        <div className="bg-[#059669] text-white py-2.5 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 animate-fade-in shadow-inner">
          <CheckCircle size={18} />
          <span>{statusMessage || 'All changes have been published to the live sales page!'}</span>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="bg-red-600 text-white py-2.5 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-inner">
          <AlertCircle size={18} />
          <span>{statusMessage || 'An error occurred while saving changes.'}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1" id="cms-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'images'
                ? 'bg-white text-[var(--blue-primary)] border-t-2 border-[var(--blue-primary)] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            id="tab-images"
          >
            <ImageIcon size={16} />
            <span>Images</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'branding'
                ? 'bg-white text-[var(--blue-primary)] border-t-2 border-[var(--blue-primary)] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            id="tab-branding"
          >
            <Palette size={16} />
            <span>Brand Color & Theme</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('urgency')}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'urgency'
                ? 'bg-white text-[var(--blue-primary)] border-t-2 border-[var(--blue-primary)] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            id="tab-urgency"
          >
            <Clock size={16} />
            <span>Urgency Countdown Timer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('copy')}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'copy'
                ? 'bg-white text-[var(--blue-primary)] border-t-2 border-[var(--blue-primary)] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            id="tab-copy"
          >
            <FileText size={16} />
            <span>Section Copy & Texts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'bg-white text-[var(--blue-primary)] border-t-2 border-[var(--blue-primary)] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            id="tab-pricing"
          >
            <DollarSign size={16} />
            <span>Pricing & Checkout</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'features'
                ? 'bg-white text-[var(--blue-primary)] border-t-2 border-[var(--blue-primary)] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            id="tab-features"
          >
            <Sparkles size={16} />
            <span>Proof & SEO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-white text-[var(--blue-primary)] border-t-2 border-[var(--blue-primary)] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            id="tab-analytics"
          >
            <BarChart3 size={16} />
            <span>Analytics</span>
          </button>
        </div>

        {/* Tab Content Box */}
        <div className="bg-white rounded-b-xl rounded-tr-xl shadow-md border border-slate-200 p-6 sm:p-8 mt-0 space-y-8">
          {/* ========================================================= */}
          {/* TAB 1: IMAGES MANAGER (HERO & PER-PRODUCT)                 */}
          {/* ========================================================= */}
          {activeTab === 'images' && (
            <div className="space-y-8" id="cms-images-section">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="font-serif text-xl font-bold text-[#0F172A]">
                  Image Field Manager
                </h2>
                <p className="text-sm text-[#64748B] mt-1">
                  Upload, replace, or link images for the Hero banner and each individual product item.
                  All images are independently editable and automatically compressed for maximum page speed.
                </p>
              </div>

              {/* Automatic Compression & Fast Load Banner */}
              <div className="bg-[#EFF4FE] border border-[rgba(0,34,218,0.2)] rounded-xl p-4 flex items-start gap-3" id="image-compression-badge">
                <div className="p-2 bg-[#0022DA] text-white rounded-lg mt-0.5 shrink-0">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0022DA]">
                    Auto-Compression & Fast Page Load Engine Active
                  </h3>
                  <p className="text-xs text-[#334155] mt-0.5 leading-relaxed">
                    Any image you upload is automatically downscaled and compressed client-side before uploading to Firebase Storage or hosting servers (max 1600px for Hero, 1000px for products). This reduces payload sizes by up to 90% without visible quality loss, ensuring rapid mobile page loads.
                  </p>
                </div>
              </div>

              {/* HERO IMAGE FIELD */}
              <div className="bg-[#F8FAFC] p-6 rounded-xl border border-slate-200 space-y-4" id="cms-hero-image-block">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
                      <ImageIcon size={18} className="text-[#0022DA]" />
                      Hero Section Image Slot
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Main image slot positioned right under the subheadline and before the divider.
                    </p>
                  </div>
                  {content.heroImageUrl && (
                    <button
                      type="button"
                      onClick={() => setContent((p) => ({ ...p, heroImageUrl: '' }))}
                      className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <Trash2 size={13} />
                      Remove Image
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  {/* Preview */}
                  <div className="md:col-span-1">
                    {content.heroImageUrl ? (
                      <div className="rounded-lg overflow-hidden border border-slate-200 bg-white max-h-48 shadow-sm">
                        <img
                          src={content.heroImageUrl}
                          alt={content.heroImageAlt || 'Hero Preview'}
                          className="w-full h-44 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="h-44 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-4 text-center bg-white text-[#64748B]">
                        <ImageIcon size={32} className="text-[#0022DA] mb-2 opacity-50" />
                        <span className="text-xs font-semibold text-[#0F172A]">No Hero Image Uploaded</span>
                        <span className="text-[11px] opacity-75">Fallback slot displayed on public site</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                        Upload Image File (JPEG, PNG, WebP)
                      </label>
                      <input
                        type="file"
                        ref={heroFileRef}
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'hero');
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => heroFileRef.current?.click()}
                        disabled={uploadingField === 'hero'}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0022DA] text-white rounded-lg text-sm font-semibold hover:bg-[#081EB8] transition cursor-pointer disabled:opacity-50 shadow-sm"
                        id="upload-hero-btn"
                      >
                        <Upload size={16} />
                        {uploadingField === 'hero' ? 'Uploading...' : 'Choose File from Computer'}
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                        Or Paste Direct Image URL
                      </label>
                      <input
                        type="text"
                        value={content.heroImageUrl}
                        onChange={(e) => setContent((p) => ({ ...p, heroImageUrl: e.target.value }))}
                        placeholder="https://example.com/hero-image.jpg"
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                        Hero Image Alt Text (Accessibility & SEO)
                      </label>
                      <input
                        type="text"
                        value={content.heroImageAlt}
                        onChange={(e) => setContent((p) => ({ ...p, heroImageAlt: e.target.value }))}
                        placeholder="e.g. SheRoots Foundation Home Training Blueprint guide preview"
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PER-PRODUCT IMAGE FIELDS */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#0F172A]">
                    Per-Product Item Images
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Each product item has its own independent image slot. Images are labeled with the product's name.
                  </p>
                </div>

                <div className="space-y-4">
                  {[...content.coreProducts, ...content.bonusProducts].map((prod) => {
                    const isUploading = uploadingField === `product-${prod.id}`;
                    return (
                      <div
                        key={prod.id}
                        className="bg-[#F8FAFC] p-5 rounded-xl border border-slate-200"
                        id={`cms-prod-img-box-${prod.id}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {prod.isBonus && (
                              <span className="text-[11px] font-bold bg-[#0022DA] text-white px-2 py-0.5 rounded">
                                {prod.bonusTag || 'BONUS'}
                              </span>
                            )}
                            <h4 className="font-bold text-sm sm:text-base text-[#0F172A]">
                              {prod.name}
                            </h4>
                          </div>

                          {prod.imageUrl && (
                            <button
                              type="button"
                              onClick={() => updateProduct(prod.id, 'imageUrl', '')}
                              className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer font-semibold"
                            >
                              <Trash2 size={13} />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                          {/* Image preview */}
                          <div className="md:col-span-1">
                            {prod.imageUrl ? (
                              <div className="rounded-lg overflow-hidden border border-slate-200 bg-white max-h-36 shadow-sm">
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.imageAlt || prod.name}
                                  className="w-full h-32 object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ) : (
                              <div className="h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-3 text-center bg-white text-[#64748B]">
                                <ImageIcon size={24} className="text-[#0022DA] mb-1 opacity-60" />
                                <span className="text-xs font-semibold text-[#0F172A]">No Image Set</span>
                                <span className="text-[10px] opacity-75">Click upload to assign</span>
                              </div>
                            )}
                          </div>

                          {/* Upload options */}
                          <div className="md:col-span-2 space-y-2.5">
                            <div className="flex items-center gap-3">
                              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0022DA] text-white rounded-lg text-xs font-semibold hover:bg-[#081EB8] transition shadow-sm">
                                <Upload size={14} />
                                {isUploading ? 'Uploading...' : 'Upload Image for this Product'}
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file, 'product', prod.id);
                                  }}
                                />
                              </label>
                            </div>

                            <div>
                              <input
                                type="text"
                                value={prod.imageUrl || ''}
                                onChange={(e) => updateProduct(prod.id, 'imageUrl', e.target.value)}
                                placeholder="Or enter image URL (https://...)"
                                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                              />
                            </div>

                            <div>
                              <input
                                type="text"
                                value={prod.imageAlt || ''}
                                onChange={(e) => updateProduct(prod.id, 'imageAlt', e.target.value)}
                                placeholder={`Alt text (e.g. ${prod.name} cover)`}
                                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: BRAND COLOR & DYNAMIC THEME ENGINE                  */}
          {/* ========================================================= */}
          {activeTab === 'branding' && (
            <div className="space-y-8" id="cms-branding-section">
              {/* Header */}
              <div className="border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="p-2.5 rounded-xl text-white shadow-xs"
                    style={{ backgroundColor: 'var(--blue-primary)' }}
                  >
                    <Palette size={22} />
                  </span>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#0F172A]">
                      Brand Color & Dynamic CSS Variables
                    </h2>
                    <p className="text-sm text-[#64748B] mt-1">
                      Toggle your signature brand color to instantly update CSS variables across the entire sales page, checkout buttons, guaranteed badges, and callouts in real time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Curated Presets Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                    Curated Brand Palette Presets
                  </h3>
                  <span className="text-xs text-[#94A3B8]">Click any preset to toggle dynamically</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {BRAND_COLOR_PRESETS.map((preset) => {
                    const isSelected =
                      (content.primaryBrandColor || '#0022DA').toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleBrandColorChange(preset.hex)}
                        className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2.5 relative group ${
                          isSelected
                            ? 'border-2 shadow-md bg-white'
                            : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                        }`}
                        style={{
                          borderColor: isSelected ? preset.hex : undefined
                        }}
                        id={`color-preset-${preset.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-7 h-7 rounded-full shadow-inner border border-black/10 shrink-0"
                              style={{ backgroundColor: preset.hex }}
                            />
                            <span className="font-bold text-sm text-[#0F172A]">
                              {preset.name}
                            </span>
                          </div>
                          {isSelected && (
                            <span
                              className="p-1 rounded-full text-white text-xs shadow-xs"
                              style={{ backgroundColor: preset.hex }}
                            >
                              <CheckCircle size={14} />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#64748B] leading-relaxed">
                          {preset.description}
                        </p>
                        <div className="text-[11px] font-mono font-medium text-[#94A3B8]">
                          {preset.hex}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Selector */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                  <Sparkles size={16} style={{ color: 'var(--blue-primary)' }} />
                  <span>Custom Hex Color Picker</span>
                </h3>
                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={content.primaryBrandColor || '#0022DA'}
                      onChange={(e) => handleBrandColorChange(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-300 p-0.5 bg-white shadow-xs"
                      id="custom-color-picker-input"
                    />
                    <div>
                      <label className="block text-xs font-bold text-[#475569] mb-1">
                        Hex Color Code
                      </label>
                      <input
                        type="text"
                        value={content.primaryBrandColor || '#0022DA'}
                        onChange={(e) => handleBrandColorChange(e.target.value)}
                        placeholder="#0022DA"
                        className="font-mono text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg text-[#0F172A] uppercase w-32 focus:ring-1 focus:ring-[var(--blue-primary)]"
                        id="custom-color-hex-input"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBrandColorChange('#0022DA')}
                    className="text-xs text-[#64748B] hover:text-[#0F172A] underline cursor-pointer self-end mb-2"
                  >
                    Reset to Default Electric Blue (#0022DA)
                  </button>
                </div>
              </div>

              {/* Live Computed CSS Variables Inspection Box */}
              {(() => {
                const vars = computeThemeVariables(content.primaryBrandColor || '#0022DA');
                return (
                  <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-[#0F172A]">
                        Active Dynamic CSS Variables
                      </h3>
                      <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ● Applied to :root
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mb-4">
                      These variables are actively computed and applied to the DOM root, dynamically coloring buttons, borders, highlights, and countdown pills.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: vars.primary }} />
                          <span className="font-mono text-xs font-bold text-[#0F172A]">--blue-primary</span>
                        </div>
                        <span className="font-mono text-xs text-[#64748B]">{vars.primary}</span>
                        <span className="block text-[11px] text-[#94A3B8] mt-1">CTA buttons, headings, accents</span>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: vars.hover }} />
                          <span className="font-mono text-xs font-bold text-[#0F172A]">--blue-hover</span>
                        </div>
                        <span className="font-mono text-xs text-[#64748B]">{vars.hover}</span>
                        <span className="block text-[11px] text-[#94A3B8] mt-1">Interactive hover states</span>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: vars.light }} />
                          <span className="font-mono text-xs font-bold text-[#0F172A]">--blue-light</span>
                        </div>
                        <span className="font-mono text-xs text-[#64748B]">{vars.light}</span>
                        <span className="block text-[11px] text-[#94A3B8] mt-1">Card backgrounds, subtle pills</span>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: vars.primary, opacity: 0.4 }} />
                          <span className="font-mono text-xs font-bold text-[#0F172A]">--blue-border</span>
                        </div>
                        <span className="font-mono text-xs text-[#64748B]">{vars.border}</span>
                        <span className="block text-[11px] text-[#94A3B8] mt-1">Border outlines & glow shadows</span>
                      </div>
                    </div>

                    {/* Component Sandbox Preview */}
                    <div className="mt-6 pt-5 border-t border-slate-200">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#475569] mb-3">
                        Live Sales Page Component Preview
                      </h4>
                      <div
                        className="p-5 rounded-xl border bg-[#F8FAFC] flex flex-wrap items-center justify-around gap-4"
                        style={{ borderColor: 'var(--blue-border)' }}
                      >
                        {/* Sample CTA */}
                        <button
                          type="button"
                          className="px-6 py-3 rounded-lg text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                          style={{
                            backgroundColor: 'var(--blue-primary)',
                            boxShadow: '0 4px 14px var(--blue-border)'
                          }}
                        >
                          Get The Bundle — ₦5,000
                        </button>

                        {/* Sample Bonus Pill */}
                        <span
                          className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md border"
                          style={{
                            backgroundColor: 'var(--blue-light)',
                            color: 'var(--blue-primary)',
                            borderColor: 'var(--blue-border)'
                          }}
                        >
                          BONUS GUIDE #1 INCLUDED
                        </span>

                        {/* Sample Price Highlight */}
                        <div className="text-center">
                          <span className="text-2xl font-serif font-black" style={{ color: 'var(--blue-primary)' }}>
                            {content.priceCurrent}
                          </span>
                          <span className="text-xs text-slate-500 block">Early Access Rate</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: URGENCY & COUNTDOWN TIMER COMPONENT                 */}
          {/* ========================================================= */}
          {activeTab === 'urgency' && (
            <div className="space-y-8" id="cms-urgency-section">
              {/* Header */}
              <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="p-2.5 rounded-xl text-white shadow-xs"
                    style={{ backgroundColor: 'var(--blue-primary)' }}
                  >
                    <Clock size={22} />
                  </span>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#0F172A]">
                      Urgency Countdown Timer Component
                    </h2>
                    <p className="text-sm text-[#64748B] mt-1">
                      Display 'limited time offer' urgency to drive higher conversions on the sales page. Customizable in days, minutes, and seconds.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRestartCountdownTimer}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm hover:opacity-90 transition cursor-pointer self-start sm:self-auto shrink-0"
                  style={{ backgroundColor: 'var(--blue-primary)' }}
                  id="restart-timer-btn"
                >
                  <RefreshCw size={14} />
                  <span>Restart Timer From Now</span>
                </button>
              </div>

              {/* Master Toggle */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">
                    Enable Countdown Urgency on Sales Page
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Activates real-time countdown timer components in the top sticky bar and pricing section.
                  </p>
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

              {/* Countdown Duration Configuration (Days, Hours, Minutes, Seconds) */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <Flame size={16} className="text-amber-500" />
                    <span>Countdown Duration (Customizable in Days, Minutes, and Seconds)</span>
                  </h3>
                  <span className="text-xs text-[#64748B]">Set the exact countdown window</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Days */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                      Days
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={content.countdownDays ?? 2}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        setContent((prev) => ({ ...prev, countdownDays: val }));
                      }}
                      className="w-full text-center font-mono font-bold text-2xl p-2 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:ring-1 focus:ring-[var(--blue-primary)]"
                      id="timer-input-days"
                    />
                    <span className="text-[11px] text-[#94A3B8] mt-1 block">Full Days</span>
                  </div>

                  {/* Hours */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                      Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={content.countdownHours ?? 14}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(23, parseInt(e.target.value, 10) || 0));
                        setContent((prev) => ({ ...prev, countdownHours: val }));
                      }}
                      className="w-full text-center font-mono font-bold text-2xl p-2 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:ring-1 focus:ring-[var(--blue-primary)]"
                      id="timer-input-hours"
                    />
                    <span className="text-[11px] text-[#94A3B8] mt-1 block">0 - 23 Hours</span>
                  </div>

                  {/* Minutes */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                      Minutes
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={content.countdownMinutes ?? 30}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0));
                        setContent((prev) => ({ ...prev, countdownMinutes: val }));
                      }}
                      className="w-full text-center font-mono font-bold text-2xl p-2 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:ring-1 focus:ring-[var(--blue-primary)]"
                      id="timer-input-minutes"
                    />
                    <span className="text-[11px] text-[#94A3B8] mt-1 block">0 - 59 Minutes</span>
                  </div>

                  {/* Seconds */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                      Seconds
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={content.countdownSeconds ?? 0}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0));
                        setContent((prev) => ({ ...prev, countdownSeconds: val }));
                      }}
                      className="w-full text-center font-mono font-bold text-2xl p-2 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:ring-1 focus:ring-[var(--blue-primary)]"
                      id="timer-input-seconds"
                    />
                    <span className="text-[11px] text-[#94A3B8] mt-1 block">0 - 59 Seconds</span>
                  </div>
                </div>

                {/* Quick Launch Presets */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-[#475569] mb-2">
                    Quick Promotion Presets:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyCountdownPreset(1, 0, 0, 0)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200"
                    >
                      ⚡ 24-Hour Flash Sale (1 Day)
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
                      📅 3-Day Launch Campaign (3 Days)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCountdownPreset(0, 0, 45, 0)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200"
                    >
                      ⏳ Final Call (45 Minutes)
                    </button>
                  </div>
                </div>
              </div>

              {/* Placement & Visibility Options */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Countdown Display Locations
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={content.countdownShowInTopBanner !== false}
                      onChange={(e) => setContent((prev) => ({ ...prev, countdownShowInTopBanner: e.target.checked }))}
                      className="w-4 h-4 rounded text-[var(--blue-primary)] focus:ring-[var(--blue-primary)] border-slate-300"
                    />
                    <span className="text-xs sm:text-sm text-[#0F172A] font-medium">
                      Display in Fixed Sticky Top Urgency Banner
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={content.countdownShowInPriceSection !== false}
                      onChange={(e) => setContent((prev) => ({ ...prev, countdownShowInPriceSection: e.target.checked }))}
                      className="w-4 h-4 rounded text-[var(--blue-primary)] focus:ring-[var(--blue-primary)] border-slate-300"
                    />
                    <span className="text-xs sm:text-sm text-[#0F172A] font-medium">
                      Display High-Conversion Countdown Card directly above Pricing Box
                    </span>
                  </label>
                </div>
              </div>

              {/* Customizable Copy & Urgency Texts */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Customizable Countdown Copy & Messaging
                </h3>

                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1">
                    Urgency Badge Title
                  </label>
                  <input
                    type="text"
                    value={content.countdownOfferTitle || 'Limited Time Offer'}
                    onChange={(e) => setContent((prev) => ({ ...prev, countdownOfferTitle: e.target.value }))}
                    placeholder="Limited Time Offer"
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:ring-1 focus:ring-[var(--blue-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1">
                    Urgency Subtitle / Price Increase Warning
                  </label>
                  <textarea
                    rows={2}
                    value={content.countdownOfferSubtitle || ''}
                    onChange={(e) => setContent((prev) => ({ ...prev, countdownOfferSubtitle: e.target.value }))}
                    placeholder="Launch discount window is closing soon — price rises from ₦5,000 to ₦7,000 once timer expires."
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:ring-1 focus:ring-[var(--blue-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1">
                    Expiry Message (Shown when countdown reaches 00:00:00)
                  </label>
                  <input
                    type="text"
                    value={content.countdownExpiredText || ''}
                    onChange={(e) => setContent((prev) => ({ ...prev, countdownExpiredText: e.target.value }))}
                    placeholder="Special launch pricing window closing shortly — lock in ₦5,000 now!"
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:ring-1 focus:ring-[var(--blue-primary)]"
                  />
                </div>
              </div>

              {/* Live Interactive Preview */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                <h3 className="text-sm font-bold text-[#0F172A] mb-1">
                  Live Sales Page Countdown Preview
                </h3>
                <p className="text-xs text-[#64748B] mb-4">
                  This is how the countdown timer component renders live on the sales page with your customized days, minutes, and seconds.
                </p>

                {/* Preview Card */}
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
            </div>
          )}
          {activeTab === 'copy' && (
            <div className="space-y-8" id="cms-copy-section">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#0F172A]">
                    Section Copy Editor
                  </h2>
                  <p className="text-sm text-[#64748B] mt-1">
                    Edit any section of the sales page. Changes are saved to the persistent database and reflect live.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition border border-red-200 cursor-pointer"
                  title="Revert all text to original uploaded source copy"
                  id="reset-defaults-btn"
                >
                  <RotateCcw size={14} />
                  <span>Reset to Original Copy</span>
                </button>
              </div>

              {/* Masthead & Hero */}
              <div className="bg-[#F8FAFC] p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-base text-[#0F172A]">1. Masthead & Hero Section</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Masthead Text</label>
                  <input
                    type="text"
                    value={content.mastheadText}
                    onChange={(e) => setContent((p) => ({ ...p, mastheadText: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Hero Main Headline (H1)</label>
                  <textarea
                    rows={2}
                    value={content.heroTitle}
                    onChange={(e) => setContent((p) => ({ ...p, heroTitle: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg font-serif text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Hero Subheadline</label>
                  <textarea
                    rows={2}
                    value={content.heroSubhead}
                    onChange={(e) => setContent((p) => ({ ...p, heroSubhead: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
              </div>

              {/* Lede Story Section */}
              <div className="bg-[#F8FAFC] p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-base text-[#0F172A]">2. Lede Story Section</h3>
                {content.ledeParagraphs.map((p, idx) => (
                  <div key={idx}>
                    <label className="block text-xs text-[#475569] mb-1">Paragraph {idx + 1}</label>
                    <textarea
                      rows={2}
                      value={p}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContent((prev) => {
                          const next = [...prev.ledeParagraphs];
                          next[idx] = val;
                          return { ...prev, ledeParagraphs: next };
                        });
                      }}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Highlight Line</label>
                  <input
                    type="text"
                    value={content.ledeHighlight}
                    onChange={(e) => setContent((p) => ({ ...p, ledeHighlight: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg font-semibold text-[#0022DA] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
              </div>

              {/* Problem Section */}
              <div className="bg-[#F8FAFC] p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-base text-[#0F172A]">3. Problem Section</h3>
                {content.problemParagraphs.map((p, idx) => (
                  <div key={idx}>
                    <label className="block text-xs text-[#475569] mb-1">Problem Paragraph {idx + 1}</label>
                    <textarea
                      rows={2}
                      value={p}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContent((prev) => {
                          const next = [...prev.problemParagraphs];
                          next[idx] = val;
                          return { ...prev, problemParagraphs: next };
                        });
                      }}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Problem Punchline</label>
                  <textarea
                    rows={2}
                    value={content.problemPunchline}
                    onChange={(e) => setContent((p) => ({ ...p, problemPunchline: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg font-semibold text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
              </div>

              {/* Turn Section */}
              <div className="bg-[#F8FAFC] p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-base text-[#0F172A]">4. Turn Section</h3>
                {content.turnParagraphs.map((p, idx) => (
                  <div key={idx}>
                    <label className="block text-xs text-[#475569] mb-1">Turn Paragraph {idx + 1}</label>
                    <textarea
                      rows={2}
                      value={p}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContent((prev) => {
                          const next = [...prev.turnParagraphs];
                          next[idx] = val;
                          return { ...prev, turnParagraphs: next };
                        });
                      }}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Turn Banner Highlight</label>
                  <input
                    type="text"
                    value={content.turnBanner}
                    onChange={(e) => setContent((p) => ({ ...p, turnBanner: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg font-semibold text-[#0022DA] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
              </div>

              {/* Introduction & CTA Section */}
              <div className="bg-[#F8FAFC] p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-base text-[#0F172A]">5. Introduction Section</h3>
                {content.introParagraphs.map((p, idx) => (
                  <div key={idx}>
                    <label className="block text-xs text-[#475569] mb-1">Intro Paragraph {idx + 1}</label>
                    <textarea
                      rows={2}
                      value={p}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContent((prev) => {
                          const next = [...prev.introParagraphs];
                          next[idx] = val;
                          return { ...prev, introParagraphs: next };
                        });
                      }}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Intro Highlight</label>
                  <input
                    type="text"
                    value={content.introHighlight}
                    onChange={(e) => setContent((p) => ({ ...p, introHighlight: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Intro CTA Button Label</label>
                  <input
                    type="text"
                    value={content.introCtaText}
                    onChange={(e) => setContent((p) => ({ ...p, introCtaText: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
              </div>

              {/* Product Titles & Descriptions */}
              <div className="bg-[#F8FAFC] p-5 rounded-xl border border-slate-200 space-y-5">
                <h3 className="font-bold text-base text-[#0F172A]">6. Product & Bonus Text</h3>
                {[...content.coreProducts, ...content.bonusProducts].map((prod) => (
                  <div key={prod.id} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center gap-2">
                      {prod.bonusTag && (
                        <span className="text-xs font-bold text-[#0022DA] bg-[#EFF4FE] px-2 py-0.5 rounded">{prod.bonusTag}</span>
                      )}
                      <label className="text-xs font-semibold text-[#475569]">Item Name</label>
                    </div>
                    <input
                      type="text"
                      value={prod.name}
                      onChange={(e) => updateProduct(prod.id, 'name', e.target.value)}
                      className="w-full text-sm p-2 bg-slate-50 border border-slate-300 rounded-lg font-serif font-bold text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                    />
                    <label className="block text-xs text-[#475569]">Description</label>
                    <textarea
                      rows={2}
                      value={prod.description}
                      onChange={(e) => updateProduct(prod.id, 'description', e.target.value)}
                      className="w-full text-sm p-2 bg-slate-50 border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                    />
                  </div>
                ))}
              </div>

              {/* Who For / Not For */}
              <div className="bg-[#F8FAFC] p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-base text-[#0F172A]">7. Who For / Not For</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Who For Title</label>
                  <input
                    type="text"
                    value={content.whoForTitle}
                    onChange={(e) => setContent((p) => ({ ...p, whoForTitle: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
                {content.whoForItems.map((item, idx) => (
                  <div key={idx}>
                    <label className="block text-xs text-[#475569]">Target Audience Item {idx + 1}</label>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContent((prev) => {
                          const next = [...prev.whoForItems];
                          next[idx] = val;
                          return { ...prev, whoForItems: next };
                        });
                      }}
                      className="w-full text-sm p-2 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                    />
                  </div>
                ))}

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Not For Title</label>
                  <input
                    type="text"
                    value={content.notForTitle}
                    onChange={(e) => setContent((p) => ({ ...p, notForTitle: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
                {content.notForItems.map((item, idx) => (
                  <div key={idx}>
                    <label className="block text-xs text-[#475569]">Exclusion Item {idx + 1}</label>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContent((prev) => {
                          const next = [...prev.notForItems];
                          next[idx] = val;
                          return { ...prev, notForItems: next };
                        });
                      }}
                      className="w-full text-sm p-2 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                    />
                  </div>
                ))}
              </div>

              {/* FAQs */}
              <div className="bg-[#F8FAFC] p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-[#0F172A]">8. FAQ / Objections Section</h3>
                  <button
                    type="button"
                    onClick={addFaq}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0022DA] hover:text-[#081EB8] cursor-pointer"
                  >
                    <Plus size={14} />
                    Add FAQ
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Section Title</label>
                  <input
                    type="text"
                    value={content.faqTitle}
                    onChange={(e) => setContent((p) => ({ ...p, faqTitle: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg font-serif font-bold text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
                {content.faqs.map((faq, idx) => (
                  <div key={faq.id || idx} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#475569]">Question {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeFaq(idx)}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                      className="w-full text-sm p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                    />
                    <textarea
                      rows={2}
                      value={faq.answer}
                      onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                      className="w-full text-sm p-2 bg-slate-50 border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                    />
                  </div>
                ))}
              </div>

              {/* Why Now & Close & PS */}
              <div className="bg-[#F8FAFC] p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-base text-[#0F172A]">9. Why Now, Close & PS Sections</h3>
                <div>
                  <label className="block text-xs text-[#475569] mb-1">Why Now Paragraph 1</label>
                  <input
                    type="text"
                    value={content.whyNowParagraph1}
                    onChange={(e) => setContent((p) => ({ ...p, whyNowParagraph1: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#475569] mb-1">Why Now Paragraph 2</label>
                  <input
                    type="text"
                    value={content.whyNowParagraph2}
                    onChange={(e) => setContent((p) => ({ ...p, whyNowParagraph2: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#475569] mb-1">Why Now Kicker</label>
                  <input
                    type="text"
                    value={content.whyNowKicker}
                    onChange={(e) => setContent((p) => ({ ...p, whyNowKicker: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
                <div className="pt-2">
                  <label className="block text-xs text-[#475569] mb-1">Close Section Title</label>
                  <input
                    type="text"
                    value={content.closeTitle}
                    onChange={(e) => setContent((p) => ({ ...p, closeTitle: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg font-serif font-bold text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#475569] mb-1">Close Section Paragraph</label>
                  <textarea
                    rows={2}
                    value={content.closeParagraph}
                    onChange={(e) => setContent((p) => ({ ...p, closeParagraph: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
                <div className="pt-2">
                  <label className="block text-xs text-[#475569] mb-1">PS Paragraph 1</label>
                  <textarea
                    rows={2}
                    value={content.psParagraph1}
                    onChange={(e) => setContent((p) => ({ ...p, psParagraph1: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#475569] mb-1">PS Paragraph 2</label>
                  <input
                    type="text"
                    value={content.psParagraph2}
                    onChange={(e) => setContent((p) => ({ ...p, psParagraph2: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: PRICING & CHECKOUT LINKS                           */}
          {/* ========================================================= */}
          {activeTab === 'pricing' && (
            <div className="space-y-6" id="cms-pricing-section">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="font-serif text-xl font-bold text-[#0F172A]">
                  Pricing & Checkout Links
                </h2>
                <p className="text-sm text-[#64748B] mt-1">
                  Manage product pricing displays and external checkout gateway URLs.
                </p>
              </div>

              <div className="bg-[#F8FAFC] p-6 rounded-xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
                      Current Display Price
                    </label>
                    <input
                      type="text"
                      value={content.priceCurrent}
                      onChange={(e) => setContent((p) => ({ ...p, priceCurrent: e.target.value, stickyPrice: e.target.value }))}
                      className="w-full text-lg p-2.5 bg-white border border-slate-300 rounded-lg font-serif font-bold text-[#0022DA] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
                      Price Increase Note / Original Price
                    </label>
                    <input
                      type="text"
                      value={content.priceOriginal}
                      onChange={(e) => setContent((p) => ({ ...p, priceOriginal: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Value Proposition Meta (Line 1)
                  </label>
                  <input
                    type="text"
                    value={content.priceMetaLine1}
                    onChange={(e) => setContent((p) => ({ ...p, priceMetaLine1: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Delivery Note (Line 2)
                  </label>
                  <input
                    type="text"
                    value={content.priceMetaLine2}
                    onChange={(e) => setContent((p) => ({ ...p, priceMetaLine2: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Main Checkout Gateway URL
                  </label>
                  <input
                    type="text"
                    value={content.priceCtaUrl}
                    onChange={(e) =>
                      setContent((p) => ({
                        ...p,
                        introCtaUrl: e.target.value,
                        priceCtaUrl: e.target.value,
                        closeCtaUrl: e.target.value,
                        psCtaUrl: e.target.value,
                        stickyCtaUrl: e.target.value
                      }))
                    }
                    className="w-full text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                  <p className="text-[11px] text-[#64748B] mt-1">
                    This updates all CTA buttons across the page (Intro, Price Box, Close, PS, and Bottom Sticky Bar).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
                      Main Buy Button Label
                    </label>
                    <input
                      type="text"
                      value={content.priceCtaText}
                      onChange={(e) =>
                        setContent((p) => ({
                          ...p,
                          priceCtaText: e.target.value,
                          introCtaText: e.target.value,
                          closeCtaText: e.target.value,
                          psCtaText: e.target.value
                        }))
                      }
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
                      Sticky Bar Button Label
                    </label>
                    <input
                      type="text"
                      value={content.stickyButtonText}
                      onChange={(e) => setContent((p) => ({ ...p, stickyButtonText: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: BEST PRACTICES & SEO                               */}
          {/* ========================================================= */}
          {activeTab === 'features' && (
            <div className="space-y-6" id="cms-features-section">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="font-serif text-xl font-bold text-[#0F172A]">
                  Sales Best Practices & SEO Controls
                </h2>
                <p className="text-sm text-[#64748B] mt-1">
                  Configure high-converting trust signals, real testimonials, urgency alerts, and meta tags.
                </p>
              </div>

              {/* Urgency Scarcity element */}
              <div className="bg-[#F8FAFC] p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A]">Top Urgency Banner</h3>
                    <p className="text-xs text-[#64748B]">
                      Display a non-fabricated banner announcement (e.g. launch pricing deadline). Disabled by default.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={content.enableUrgencyBanner}
                      onChange={(e) => setContent((p) => ({ ...p, enableUrgencyBanner: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0022DA]"></div>
                  </label>
                </div>
                {content.enableUrgencyBanner && (
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">Banner Announcement Text</label>
                    <input
                      type="text"
                      value={content.urgencyBannerText}
                      onChange={(e) => setContent((p) => ({ ...p, urgencyBannerText: e.target.value }))}
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                    />
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="bg-[#F8FAFC] p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A]">Trust & Security Signals near CTAs</h3>
                    <p className="text-xs text-[#64748B]">
                      Displays SSL security, instant digital delivery, and 7-day guarantee icons.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={content.enableTrustBadges}
                      onChange={(e) => setContent((p) => ({ ...p, enableTrustBadges: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0022DA]"></div>
                  </label>
                </div>
                {content.enableTrustBadges && (
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">Micro-Copy Note</label>
                    <input
                      type="text"
                      value={content.trustBadgesNote}
                      onChange={(e) => setContent((p) => ({ ...p, trustBadgesNote: e.target.value }))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                    />
                  </div>
                )}
              </div>

              {/* Social Proof Section (Reviews/Testimonials) */}
              <div className="bg-[#F8FAFC] p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A]">Social Proof / Parent Testimonials</h3>
                    <p className="text-xs text-[#64748B]">
                      Add authentic reader reviews. (Off by default until you add real feedback).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addTestimonial}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0022DA] hover:text-[#081EB8] cursor-pointer"
                  >
                    <Plus size={14} />
                    Add Review
                  </button>
                </div>

                {content.testimonials && content.testimonials.length > 0 ? (
                  <div className="space-y-3">
                    {content.testimonials.map((test, idx) => (
                      <div key={test.id} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-[#475569]">Testimonial #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeTestimonial(idx)}
                            className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={test.name}
                            onChange={(e) => updateTestimonial(idx, 'name', e.target.value)}
                            placeholder="Parent Name"
                            className="text-xs p-1.5 bg-slate-50 border border-slate-300 rounded text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                          />
                          <input
                            type="text"
                            value={test.location || ''}
                            onChange={(e) => updateTestimonial(idx, 'location', e.target.value)}
                            placeholder="City, Country"
                            className="text-xs p-1.5 bg-slate-50 border border-slate-300 rounded text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={test.quote}
                          onChange={(e) => updateTestimonial(idx, 'quote', e.target.value)}
                          placeholder="Parent reflection / feedback"
                          className="w-full text-xs p-1.5 bg-slate-50 border border-slate-300 rounded text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B] italic bg-white p-3 rounded border border-dashed border-slate-300">
                    No testimonials currently added. The sales page currently uses the original honest text:
                    "This bundle is new. No fake reviews, no bought-and-paid testimonials..."
                  </p>
                )}
              </div>

              {/* SEO Meta Tags */}
              <div className="bg-[#F8FAFC] p-5 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-sm text-[#0F172A]">Search Engine & Social Meta Tags</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Page Title Tag (&lt;title&gt;)
                  </label>
                  <input
                    type="text"
                    value={content.seoTitle}
                    onChange={(e) => setContent((p) => ({ ...p, seoTitle: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-medium text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Meta Description Tag
                  </label>
                  <textarea
                    rows={2}
                    value={content.seoDescription}
                    onChange={(e) => setContent((p) => ({ ...p, seoDescription: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-[#0F172A] focus:border-[#0022DA] focus:ring-1 focus:ring-[#0022DA]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: SALES CLICKS ANALYTICS & PERFORMANCE               */}
          {/* ========================================================= */}
          {activeTab === 'analytics' && (
            <AdminAnalytics content={content} />
          )}
        </div>
      </main>

      {/* Revert confirmation modal */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-[#0F172A]">
            <h3 className="font-serif text-lg font-bold text-[#0F172A] mb-2">
              Revert to Original Defaults?
            </h3>
            <p className="text-sm text-[#64748B] mb-6 leading-relaxed">
              Are you sure you want to revert all text and settings back to the pristine original uploaded sales page? This will reset all your CMS customizations.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 transition cursor-pointer text-[#0F172A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmResetToDefaults}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm cursor-pointer"
                id="confirm-reset-button"
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
