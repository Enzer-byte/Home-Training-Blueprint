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
  BarChart3
} from 'lucide-react';
import { SalesPageContent, ProductItem, FaqItem, TestimonialItem } from '../types';
import { api } from '../services/api';
import { DEFAULT_CONTENT } from '../defaultContent';
import { AdminAnalytics } from './AdminAnalytics';

interface AdminCMSProps {
  initialContent: SalesPageContent;
  onContentUpdate: (newContent: SalesPageContent) => void;
  onLogout: () => void;
}

type TabType = 'images' | 'copy' | 'pricing' | 'features' | 'analytics';

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
  const triggerStatus = (status: 'saved' | 'error', msg: string) => {
    setSaveStatus(status);
    setStatusMessage(msg);
    setTimeout(() => {
      setSaveStatus('idle');
    }, 4000);
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

  // Handle image file selection & upload
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

    if (file.size > 5 * 1024 * 1024) {
      triggerStatus('error', 'File is too large (max 5MB). Please choose a compressed image.');
      return;
    }

    const fieldKey = targetType === 'hero' ? 'hero' : `product-${productId}`;
    setUploadingField(fieldKey);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      try {
        const res = await api.uploadImage(base64Data, file.name, file.type);
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
          triggerStatus('saved', `Image uploaded successfully for ${targetType === 'hero' ? 'Hero' : 'Product'}!`);
        } else {
          triggerStatus('error', res.message || 'Upload failed');
        }
      } catch (err) {
        console.error('Upload error:', err);
        triggerStatus('error', 'Failed to upload image. Please try again.');
      } finally {
        setUploadingField(null);
      }
    };
    reader.readAsDataURL(file);
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24" id="admin-cms-dashboard">
      {/* Top Navigation Bar */}
      <header className="bg-[#0B192C] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif font-bold text-lg sm:text-xl text-white">
              SheRoots Foundation CMS
            </span>
            <span className="hidden sm:inline-block bg-[#0022DA] text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide text-white">
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
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-[#0022DA] hover:bg-[#081EB8] text-white transition shadow disabled:opacity-50 cursor-pointer"
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
                ? 'bg-white text-[#0022DA] border-t-2 border-[#0022DA] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            id="tab-images"
          >
            <ImageIcon size={16} />
            <span>Image Manager (Hero & Products)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('copy')}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'copy'
                ? 'bg-white text-[#0022DA] border-t-2 border-[#0022DA] shadow-sm'
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
                ? 'bg-white text-[#0022DA] border-t-2 border-[#0022DA] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            id="tab-pricing"
          >
            <DollarSign size={16} />
            <span>Pricing & Checkout Links</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'features'
                ? 'bg-white text-[#0022DA] border-t-2 border-[#0022DA] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            id="tab-features"
          >
            <Sparkles size={16} />
            <span>Sales Best Practices & SEO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-white text-[#0022DA] border-t-2 border-[#0022DA] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            id="tab-analytics"
          >
            <BarChart3 size={16} />
            <span>Sales Clicks Analytics</span>
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
                  All images are independently editable and validate file sizes up to 5MB.
                </p>
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
          {/* TAB 2: SECTION COPY & TEXTS                               */}
          {/* ========================================================= */}
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
