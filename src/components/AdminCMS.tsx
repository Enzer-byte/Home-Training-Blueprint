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
  AlertCircle
} from 'lucide-react';
import { SalesPageContent, ProductItem, FaqItem, TestimonialItem } from '../types';
import { api } from '../services/api';
import { DEFAULT_CONTENT } from '../defaultContent';

interface AdminCMSProps {
  initialContent: SalesPageContent;
  onContentUpdate: (newContent: SalesPageContent) => void;
  onLogout: () => void;
}

type TabType = 'images' | 'copy' | 'pricing' | 'features';

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
    <div className="min-h-screen bg-[#F3EAD9] text-[#241C15] pb-24" id="admin-cms-dashboard">
      {/* Top Navigation Bar */}
      <header className="bg-[#24344B] text-[#FFFDF9] sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif font-bold text-lg sm:text-xl text-[#FFFDF9]">
              SheRoots Foundation CMS
            </span>
            <span className="hidden sm:inline-block bg-[#A64B2A] text-[11px] font-bold px-2 py-0.5 rounded tracking-wide">
              ADMIN
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-[#FFFDF9] transition"
              id="cms-view-site-link"
            >
              <ExternalLink size={15} />
              <span className="hidden sm:inline">View Public Site</span>
            </a>

            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-[#A64B2A] hover:bg-[#8A3C21] text-white transition shadow disabled:opacity-50 cursor-pointer"
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
        <div className="bg-[#5C6B4E] text-white py-2.5 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 animate-fade-in shadow-inner">
          <CheckCircle size={18} />
          <span>{statusMessage || 'All changes have been published to the live sales page!'}</span>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="bg-red-700 text-white py-2.5 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-inner">
          <AlertCircle size={18} />
          <span>{statusMessage || 'An error occurred while saving changes.'}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[rgba(36,52,75,0.15)] gap-2 overflow-x-auto pb-1" id="cms-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'images'
                ? 'bg-[#FFFDF9] text-[#A64B2A] border-t-2 border-[#A64B2A] shadow-sm'
                : 'text-[#55483A] hover:text-[#24344B]'
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
                ? 'bg-[#FFFDF9] text-[#A64B2A] border-t-2 border-[#A64B2A] shadow-sm'
                : 'text-[#55483A] hover:text-[#24344B]'
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
                ? 'bg-[#FFFDF9] text-[#A64B2A] border-t-2 border-[#A64B2A] shadow-sm'
                : 'text-[#55483A] hover:text-[#24344B]'
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
                ? 'bg-[#FFFDF9] text-[#A64B2A] border-t-2 border-[#A64B2A] shadow-sm'
                : 'text-[#55483A] hover:text-[#24344B]'
            }`}
            id="tab-features"
          >
            <Sparkles size={16} />
            <span>Sales Best Practices & SEO</span>
          </button>
        </div>

        {/* Tab Content Box */}
        <div className="bg-[#FFFDF9] rounded-b-xl rounded-tr-xl shadow-md border border-[rgba(36,52,75,0.12)] p-6 sm:p-8 mt-0 space-y-8">
          {/* ========================================================= */}
          {/* TAB 1: IMAGES MANAGER (HERO & PER-PRODUCT)                 */}
          {/* ========================================================= */}
          {activeTab === 'images' && (
            <div className="space-y-8" id="cms-images-section">
              <div className="border-b border-[rgba(36,52,75,0.1)] pb-4">
                <h2 className="font-serif text-xl font-bold text-[#24344B]">
                  Image Field Manager
                </h2>
                <p className="text-sm text-[#55483A] mt-1">
                  Upload, replace, or link images for the Hero banner and each individual product item.
                  All images are independently editable and validate file sizes up to 5MB.
                </p>
              </div>

              {/* HERO IMAGE FIELD */}
              <div className="bg-[#FBF6EC] p-6 rounded-xl border border-[rgba(36,52,75,0.12)] space-y-4" id="cms-hero-image-block">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-[#24344B] flex items-center gap-2">
                      <ImageIcon size={18} className="text-[#A64B2A]" />
                      Hero Section Image Slot
                    </h3>
                    <p className="text-xs text-[#55483A]">
                      Main image slot positioned right under the subheadline and before the divider.
                    </p>
                  </div>
                  {content.heroImageUrl && (
                    <button
                      type="button"
                      onClick={() => setContent((p) => ({ ...p, heroImageUrl: '' }))}
                      className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
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
                      <div className="rounded-lg overflow-hidden border border-[rgba(36,52,75,0.15)] bg-white max-h-48">
                        <img
                          src={content.heroImageUrl}
                          alt={content.heroImageAlt || 'Hero Preview'}
                          className="w-full h-44 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="h-44 border-2 border-dashed border-[rgba(36,52,75,0.2)] rounded-lg flex flex-col items-center justify-center p-4 text-center bg-white/50 text-[#55483A]">
                        <ImageIcon size={32} className="text-[#A64B2A] mb-2 opacity-50" />
                        <span className="text-xs font-semibold">No Hero Image Uploaded</span>
                        <span className="text-[11px] opacity-75">Fallback slot displayed on public site</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#241C15] mb-1">
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#24344B] text-white rounded-lg text-sm font-semibold hover:bg-[#1b2738] transition cursor-pointer disabled:opacity-50"
                        id="upload-hero-btn"
                      >
                        <Upload size={16} />
                        {uploadingField === 'hero' ? 'Uploading...' : 'Choose File from Computer'}
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#241C15] mb-1">
                        Or Paste Direct Image URL
                      </label>
                      <input
                        type="text"
                        value={content.heroImageUrl}
                        onChange={(e) => setContent((p) => ({ ...p, heroImageUrl: e.target.value }))}
                        placeholder="https://example.com/hero-image.jpg"
                        className="w-full text-xs p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg text-[#241C15]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#241C15] mb-1">
                        Hero Image Alt Text (Accessibility & SEO)
                      </label>
                      <input
                        type="text"
                        value={content.heroImageAlt}
                        onChange={(e) => setContent((p) => ({ ...p, heroImageAlt: e.target.value }))}
                        placeholder="e.g. SheRoots Foundation Home Training Blueprint guide preview"
                        className="w-full text-xs p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg text-[#241C15]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PER-PRODUCT IMAGE FIELDS */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#24344B]">
                    Per-Product Item Images
                  </h3>
                  <p className="text-xs text-[#55483A]">
                    Each product item has its own independent image slot. Images are labeled with the product's name.
                  </p>
                </div>

                <div className="space-y-4">
                  {[...content.coreProducts, ...content.bonusProducts].map((prod) => {
                    const isUploading = uploadingField === `product-${prod.id}`;
                    return (
                      <div
                        key={prod.id}
                        className="bg-[#FBF6EC] p-5 rounded-xl border border-[rgba(36,52,75,0.12)]"
                        id={`cms-prod-img-box-${prod.id}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {prod.isBonus && (
                              <span className="text-[11px] font-bold bg-[#C08A2E] text-white px-2 py-0.5 rounded">
                                {prod.bonusTag || 'BONUS'}
                              </span>
                            )}
                            <h4 className="font-bold text-sm sm:text-base text-[#24344B]">
                              {prod.name}
                            </h4>
                          </div>

                          {prod.imageUrl && (
                            <button
                              type="button"
                              onClick={() => updateProduct(prod.id, 'imageUrl', '')}
                              className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
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
                              <div className="rounded-lg overflow-hidden border border-[rgba(36,52,75,0.15)] bg-white max-h-36">
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.imageAlt || prod.name}
                                  className="w-full h-32 object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ) : (
                              <div className="h-32 border-2 border-dashed border-[rgba(36,52,75,0.2)] rounded-lg flex flex-col items-center justify-center p-3 text-center bg-white/50 text-[#55483A]">
                                <ImageIcon size={24} className="text-[#C08A2E] mb-1 opacity-60" />
                                <span className="text-xs font-semibold">No Image Set</span>
                                <span className="text-[10px] opacity-75">Click upload to assign</span>
                              </div>
                            )}
                          </div>

                          {/* Upload options */}
                          <div className="md:col-span-2 space-y-2.5">
                            <div className="flex items-center gap-3">
                              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5C6B4E] text-white rounded-lg text-xs font-semibold hover:bg-[#4a573e] transition">
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
                                className="w-full text-xs p-2 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg text-[#241C15]"
                              />
                            </div>

                            <div>
                              <input
                                type="text"
                                value={prod.imageAlt || ''}
                                onChange={(e) => updateProduct(prod.id, 'imageAlt', e.target.value)}
                                placeholder={`Alt text (e.g. ${prod.name} cover)`}
                                className="w-full text-xs p-2 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg text-[#241C15]"
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
              <div className="flex items-center justify-between border-b border-[rgba(36,52,75,0.1)] pb-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#24344B]">
                    Section Copy Editor
                  </h2>
                  <p className="text-sm text-[#55483A] mt-1">
                    Edit any section of the sales page. Changes are saved to the persistent database and reflect live.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#8A3C21] hover:bg-[#F3EAD9] rounded-lg transition border border-[#A64B2A]/30 cursor-pointer"
                  title="Revert all text to original uploaded source copy"
                  id="reset-defaults-btn"
                >
                  <RotateCcw size={14} />
                  <span>Reset to Original Copy</span>
                </button>
              </div>

              {/* Masthead & Hero */}
              <div className="bg-[#FBF6EC] p-5 rounded-xl border border-[rgba(36,52,75,0.12)] space-y-4">
                <h3 className="font-bold text-base text-[#24344B]">1. Masthead & Hero Section</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#55483A] mb-1">Masthead Text</label>
                  <input
                    type="text"
                    value={content.mastheadText}
                    onChange={(e) => setContent((p) => ({ ...p, mastheadText: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#55483A] mb-1">Hero Main Headline (H1)</label>
                  <textarea
                    rows={2}
                    value={content.heroTitle}
                    onChange={(e) => setContent((p) => ({ ...p, heroTitle: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg font-serif"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#55483A] mb-1">Hero Subheadline</label>
                  <textarea
                    rows={2}
                    value={content.heroSubhead}
                    onChange={(e) => setContent((p) => ({ ...p, heroSubhead: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                  />
                </div>
              </div>

              {/* Lede Story Section */}
              <div className="bg-[#FBF6EC] p-5 rounded-xl border border-[rgba(36,52,75,0.12)] space-y-4">
                <h3 className="font-bold text-base text-[#24344B]">2. Lede Story Section</h3>
                {content.ledeParagraphs.map((p, idx) => (
                  <div key={idx}>
                    <label className="block text-xs text-[#55483A] mb-1">Paragraph {idx + 1}</label>
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
                      className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-[#55483A] mb-1">Highlight Line</label>
                  <input
                    type="text"
                    value={content.ledeHighlight}
                    onChange={(e) => setContent((p) => ({ ...p, ledeHighlight: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg font-semibold text-[#24344B]"
                  />
                </div>
              </div>

              {/* Problem Section */}
              <div className="bg-[#FBF6EC] p-5 rounded-xl border border-[rgba(36,52,75,0.12)] space-y-4">
                <h3 className="font-bold text-base text-[#24344B]">3. Problem Section</h3>
                {content.problemParagraphs.map((p, idx) => (
                  <div key={idx}>
                    <label className="block text-xs text-[#55483A] mb-1">Problem Paragraph {idx + 1}</label>
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
                      className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-[#55483A] mb-1">Problem Punchline</label>
                  <textarea
                    rows={2}
                    value={content.problemPunchline}
                    onChange={(e) => setContent((p) => ({ ...p, problemPunchline: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg font-semibold text-[#24344B]"
                  />
                </div>
              </div>

              {/* Turn Section */}
              <div className="bg-[#FBF6EC] p-5 rounded-xl border border-[rgba(36,52,75,0.12)] space-y-4">
                <h3 className="font-bold text-base text-[#24344B]">4. Turn Section</h3>
                {content.turnParagraphs.map((p, idx) => (
                  <div key={idx}>
                    <label className="block text-xs text-[#55483A] mb-1">Turn Paragraph {idx + 1}</label>
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
                      className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-[#55483A] mb-1">Turn Banner Highlight</label>
                  <input
                    type="text"
                    value={content.turnBanner}
                    onChange={(e) => setContent((p) => ({ ...p, turnBanner: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg font-semibold text-[#8A3C21]"
                  />
                </div>
              </div>

              {/* Introduction & CTA Section */}
              <div className="bg-[#FBF6EC] p-5 rounded-xl border border-[rgba(36,52,75,0.12)] space-y-4">
                <h3 className="font-bold text-base text-[#24344B]">5. Introduction Section</h3>
                {content.introParagraphs.map((p, idx) => (
                  <div key={idx}>
                    <label className="block text-xs text-[#55483A] mb-1">Intro Paragraph {idx + 1}</label>
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
                      className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-[#55483A] mb-1">Intro Highlight</label>
                  <input
                    type="text"
                    value={content.introHighlight}
                    onChange={(e) => setContent((p) => ({ ...p, introHighlight: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#55483A] mb-1">Intro CTA Button Label</label>
                  <input
                    type="text"
                    value={content.introCtaText}
                    onChange={(e) => setContent((p) => ({ ...p, introCtaText: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg font-bold"
                  />
                </div>
              </div>

              {/* Product Titles & Descriptions */}
              <div className="bg-[#FBF6EC] p-5 rounded-xl border border-[rgba(36,52,75,0.12)] space-y-5">
                <h3 className="font-bold text-base text-[#24344B]">6. Product & Bonus Text</h3>
                {[...content.coreProducts, ...content.bonusProducts].map((prod) => (
                  <div key={prod.id} className="p-4 bg-white rounded-lg border border-[rgba(36,52,75,0.1)] space-y-2">
                    <div className="flex items-center gap-2">
                      {prod.bonusTag && (
                        <span className="text-xs font-bold text-[#C08A2E]">{prod.bonusTag}</span>
                      )}
                      <label className="text-xs font-semibold text-[#55483A]">Item Name</label>
                    </div>
                    <input
                      type="text"
                      value={prod.name}
                      onChange={(e) => updateProduct(prod.id, 'name', e.target.value)}
                      className="w-full text-sm p-2 bg-[#FBF6EC] border border-[rgba(36,52,75,0.2)] rounded-lg font-serif font-bold text-[#24344B]"
                    />
                    <label className="block text-xs text-[#55483A]">Description</label>
                    <textarea
                      rows={2}
                      value={prod.description}
                      onChange={(e) => updateProduct(prod.id, 'description', e.target.value)}
                      className="w-full text-sm p-2 bg-[#FBF6EC] border border-[rgba(36,52,75,0.2)] rounded-lg"
                    />
                  </div>
                ))}
              </div>

              {/* Who For / Not For */}
              <div className="bg-[#FBF6EC] p-5 rounded-xl border border-[rgba(36,52,75,0.12)] space-y-4">
                <h3 className="font-bold text-base text-[#24344B]">7. Who For / Not For</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#55483A] mb-1">Who For Title</label>
                  <input
                    type="text"
                    value={content.whoForTitle}
                    onChange={(e) => setContent((p) => ({ ...p, whoForTitle: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg font-bold"
                  />
                </div>
                {content.whoForItems.map((item, idx) => (
                  <div key={idx}>
                    <label className="block text-xs text-[#55483A]">Target Audience Item {idx + 1}</label>
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
                      className="w-full text-sm p-2 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                    />
                  </div>
                ))}

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-[#55483A] mb-1">Not For Title</label>
                  <input
                    type="text"
                    value={content.notForTitle}
                    onChange={(e) => setContent((p) => ({ ...p, notForTitle: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg font-bold"
                  />
                </div>
                {content.notForItems.map((item, idx) => (
                  <div key={idx}>
                    <label className="block text-xs text-[#55483A]">Exclusion Item {idx + 1}</label>
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
                      className="w-full text-sm p-2 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                    />
                  </div>
                ))}
              </div>

              {/* FAQs */}
              <div className="bg-[#FBF6EC] p-5 rounded-xl border border-[rgba(36,52,75,0.12)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-[#24344B]">8. FAQ / Objections Section</h3>
                  <button
                    type="button"
                    onClick={addFaq}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#A64B2A] hover:text-[#8A3C21] cursor-pointer"
                  >
                    <Plus size={14} />
                    Add FAQ
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#55483A] mb-1">Section Title</label>
                  <input
                    type="text"
                    value={content.faqTitle}
                    onChange={(e) => setContent((p) => ({ ...p, faqTitle: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg font-serif font-bold text-[#24344B]"
                  />
                </div>
                {content.faqs.map((faq, idx) => (
                  <div key={faq.id || idx} className="p-4 bg-white rounded-lg border border-[rgba(36,52,75,0.1)] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#55483A]">Question {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeFaq(idx)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                      className="w-full text-sm p-2 bg-[#FBF6EC] border border-[rgba(36,52,75,0.2)] rounded-lg font-bold text-[#24344B]"
                    />
                    <textarea
                      rows={2}
                      value={faq.answer}
                      onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                      className="w-full text-sm p-2 bg-[#FBF6EC] border border-[rgba(36,52,75,0.2)] rounded-lg"
                    />
                  </div>
                ))}
              </div>

              {/* Why Now & Close & PS */}
              <div className="bg-[#FBF6EC] p-5 rounded-xl border border-[rgba(36,52,75,0.12)] space-y-4">
                <h3 className="font-bold text-base text-[#24344B]">9. Why Now, Close & PS Sections</h3>
                <div>
                  <label className="block text-xs text-[#55483A] mb-1">Why Now Paragraph 1</label>
                  <input
                    type="text"
                    value={content.whyNowParagraph1}
                    onChange={(e) => setContent((p) => ({ ...p, whyNowParagraph1: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#55483A] mb-1">Why Now Paragraph 2</label>
                  <input
                    type="text"
                    value={content.whyNowParagraph2}
                    onChange={(e) => setContent((p) => ({ ...p, whyNowParagraph2: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#55483A] mb-1">Why Now Kicker</label>
                  <input
                    type="text"
                    value={content.whyNowKicker}
                    onChange={(e) => setContent((p) => ({ ...p, whyNowKicker: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg font-bold text-[#24344B]"
                  />
                </div>
                <div className="pt-2">
                  <label className="block text-xs text-[#55483A] mb-1">Close Section Title</label>
                  <input
                    type="text"
                    value={content.closeTitle}
                    onChange={(e) => setContent((p) => ({ ...p, closeTitle: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg font-serif font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#55483A] mb-1">Close Section Paragraph</label>
                  <textarea
                    rows={2}
                    value={content.closeParagraph}
                    onChange={(e) => setContent((p) => ({ ...p, closeParagraph: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                  />
                </div>
                <div className="pt-2">
                  <label className="block text-xs text-[#55483A] mb-1">PS Paragraph 1</label>
                  <textarea
                    rows={2}
                    value={content.psParagraph1}
                    onChange={(e) => setContent((p) => ({ ...p, psParagraph1: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#55483A] mb-1">PS Paragraph 2</label>
                  <input
                    type="text"
                    value={content.psParagraph2}
                    onChange={(e) => setContent((p) => ({ ...p, psParagraph2: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
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
              <div className="border-b border-[rgba(36,52,75,0.1)] pb-4">
                <h2 className="font-serif text-xl font-bold text-[#24344B]">
                  Pricing & Checkout Links
                </h2>
                <p className="text-sm text-[#55483A] mt-1">
                  Manage product pricing displays and external checkout gateway URLs.
                </p>
              </div>

              <div className="bg-[#FBF6EC] p-6 rounded-xl border border-[rgba(36,52,75,0.12)] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#55483A] mb-1">
                      Current Display Price
                    </label>
                    <input
                      type="text"
                      value={content.priceCurrent}
                      onChange={(e) => setContent((p) => ({ ...p, priceCurrent: e.target.value, stickyPrice: e.target.value }))}
                      className="w-full text-lg p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg font-serif font-bold text-[#8A3C21]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#55483A] mb-1">
                      Price Increase Note / Original Price
                    </label>
                    <input
                      type="text"
                      value={content.priceOriginal}
                      onChange={(e) => setContent((p) => ({ ...p, priceOriginal: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#55483A] mb-1">
                    Value Proposition Meta (Line 1)
                  </label>
                  <input
                    type="text"
                    value={content.priceMetaLine1}
                    onChange={(e) => setContent((p) => ({ ...p, priceMetaLine1: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#55483A] mb-1">
                    Delivery Note (Line 2)
                  </label>
                  <input
                    type="text"
                    value={content.priceMetaLine2}
                    onChange={(e) => setContent((p) => ({ ...p, priceMetaLine2: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                  />
                </div>

                <div className="pt-2 border-t border-[rgba(36,52,75,0.1)]">
                  <label className="block text-xs font-semibold text-[#55483A] mb-1">
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
                    className="w-full text-xs font-mono p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg text-[#241C15]"
                  />
                  <p className="text-[11px] text-[#55483A] mt-1">
                    This updates all CTA buttons across the page (Intro, Price Box, Close, PS, and Bottom Sticky Bar).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#55483A] mb-1">
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
                      className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#55483A] mb-1">
                      Sticky Bar Button Label
                    </label>
                    <input
                      type="text"
                      value={content.stickyButtonText}
                      onChange={(e) => setContent((p) => ({ ...p, stickyButtonText: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg font-bold"
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
              <div className="border-b border-[rgba(36,52,75,0.1)] pb-4">
                <h2 className="font-serif text-xl font-bold text-[#24344B]">
                  Sales Best Practices & SEO Controls
                </h2>
                <p className="text-sm text-[#55483A] mt-1">
                  Configure high-converting trust signals, real testimonials, urgency alerts, and meta tags.
                </p>
              </div>

              {/* Urgency Scarcity element */}
              <div className="bg-[#FBF6EC] p-5 rounded-xl border border-[rgba(36,52,75,0.12)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#24344B]">Top Urgency Banner</h3>
                    <p className="text-xs text-[#55483A]">
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
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A64B2A]"></div>
                  </label>
                </div>
                {content.enableUrgencyBanner && (
                  <div>
                    <label className="block text-xs font-semibold text-[#55483A] mb-1">Banner Announcement Text</label>
                    <input
                      type="text"
                      value={content.urgencyBannerText}
                      onChange={(e) => setContent((p) => ({ ...p, urgencyBannerText: e.target.value }))}
                      className="w-full text-xs p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="bg-[#FBF6EC] p-5 rounded-xl border border-[rgba(36,52,75,0.12)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#24344B]">Trust & Security Signals near CTAs</h3>
                    <p className="text-xs text-[#55483A]">
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
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5C6B4E]"></div>
                  </label>
                </div>
                {content.enableTrustBadges && (
                  <div>
                    <label className="block text-xs font-semibold text-[#55483A] mb-1">Micro-Copy Note</label>
                    <input
                      type="text"
                      value={content.trustBadgesNote}
                      onChange={(e) => setContent((p) => ({ ...p, trustBadgesNote: e.target.value }))}
                      className="w-full text-xs p-2 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Social Proof Section (Reviews/Testimonials) */}
              <div className="bg-[#FBF6EC] p-5 rounded-xl border border-[rgba(36,52,75,0.12)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#24344B]">Social Proof / Parent Testimonials</h3>
                    <p className="text-xs text-[#55483A]">
                      Add authentic reader reviews. (Off by default until you add real feedback).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addTestimonial}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#A64B2A] hover:text-[#8A3C21] cursor-pointer"
                  >
                    <Plus size={14} />
                    Add Review
                  </button>
                </div>

                {content.testimonials && content.testimonials.length > 0 ? (
                  <div className="space-y-3">
                    {content.testimonials.map((test, idx) => (
                      <div key={test.id} className="p-3 bg-white rounded-lg border border-[rgba(36,52,75,0.1)] space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-[#55483A]">Testimonial #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeTestimonial(idx)}
                            className="text-xs text-red-600 hover:text-red-800"
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
                            className="text-xs p-1.5 bg-[#FBF6EC] border rounded"
                          />
                          <input
                            type="text"
                            value={test.location || ''}
                            onChange={(e) => updateTestimonial(idx, 'location', e.target.value)}
                            placeholder="City, Country"
                            className="text-xs p-1.5 bg-[#FBF6EC] border rounded"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={test.quote}
                          onChange={(e) => updateTestimonial(idx, 'quote', e.target.value)}
                          placeholder="Parent reflection / feedback"
                          className="w-full text-xs p-1.5 bg-[#FBF6EC] border rounded"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#55483A] italic bg-white p-3 rounded border border-dashed">
                    No testimonials currently added. The sales page currently uses the original honest text:
                    "This bundle is new. No fake reviews, no bought-and-paid testimonials..."
                  </p>
                )}
              </div>

              {/* SEO Meta Tags */}
              <div className="bg-[#FBF6EC] p-5 rounded-xl border border-[rgba(36,52,75,0.12)] space-y-4">
                <h3 className="font-bold text-sm text-[#24344B]">Search Engine & Social Meta Tags</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#55483A] mb-1">
                    Page Title Tag (&lt;title&gt;)
                  </label>
                  <input
                    type="text"
                    value={content.seoTitle}
                    onChange={(e) => setContent((p) => ({ ...p, seoTitle: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#55483A] mb-1">
                    Meta Description Tag
                  </label>
                  <textarea
                    rows={2}
                    value={content.seoDescription}
                    onChange={(e) => setContent((p) => ({ ...p, seoDescription: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-white border border-[rgba(36,52,75,0.2)] rounded-lg"
                  />
                </div>
              </div>
            </div>
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
          <div className="bg-[#FFFDF9] rounded-xl max-w-md w-full p-6 shadow-2xl border border-[rgba(36,52,75,0.2)] text-[#241C15]">
            <h3 className="font-serif text-lg font-bold text-[#24344B] mb-2">
              Revert to Original Defaults?
            </h3>
            <p className="text-sm text-[#55483A] mb-6 leading-relaxed">
              Are you sure you want to revert all text and settings back to the pristine original uploaded sales page? This will reset all your CMS customizations.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-[rgba(36,52,75,0.2)] hover:bg-[#F3EAD9] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmResetToDefaults}
                className="px-4 py-2 text-sm font-bold text-white bg-[#A64B2A] hover:bg-[#8A3C21] rounded-lg transition shadow cursor-pointer"
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
