import React, { useState } from 'react';
import { X, Mail, Shield, RotateCcw, FileText } from 'lucide-react';

interface FooterLinksModalProps {
  footerText: string;
}

type PolicyType = 'contact' | 'privacy' | 'refund' | 'terms' | null;

export const FooterLinksModal: React.FC<FooterLinksModalProps> = ({ footerText }) => {
  const [activeModal, setActiveModal] = useState<PolicyType>(null);

  return (
    <>
      <footer id="main-footer">
        <p className="mb-3" id="footer-copyright">{footerText}</p>
        <div className="flex items-center justify-center flex-wrap gap-4 text-xs text-[#475569]" id="footer-trust-links">
          <button
            type="button"
            onClick={() => setActiveModal('contact')}
            className="hover:underline hover:text-[#0022DA] cursor-pointer transition"
            id="footer-link-contact"
          >
            Contact Support
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setActiveModal('privacy')}
            className="hover:underline hover:text-[#0022DA] cursor-pointer transition"
            id="footer-link-privacy"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setActiveModal('refund')}
            className="hover:underline hover:text-[#0022DA] cursor-pointer transition"
            id="footer-link-refund"
          >
            7-Day Refund Policy
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setActiveModal('terms')}
            className="hover:underline hover:text-[#0022DA] cursor-pointer transition"
            id="footer-link-terms"
          >
            Terms of Purchase
          </button>
        </div>
      </footer>

      {/* Policy Modal */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[85vh] overflow-y-auto text-[#0F172A]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-[#64748B] hover:text-[#0F172A]"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {activeModal === 'contact' && (
              <div>
                <div className="flex items-center gap-2 text-[#0A192F] mb-3">
                  <Mail size={22} className="text-[#0022DA]" />
                  <h3 className="font-serif text-xl font-bold">Contact & Support</h3>
                </div>
                <p className="text-sm text-[#334155] mb-4">
                  Got a question before you buy or need assistance with your download? We are here to help.
                </p>
                <div className="bg-[#F8FAFC] p-4 rounded-lg border border-slate-200 text-sm space-y-2 text-[#334155]">
                  <p><strong className="text-[#0F172A]">Organization:</strong> SheRoots Foundation</p>
                  <p><strong className="text-[#0F172A]">Email:</strong> support@sherootsfoundation.org</p>
                  <p><strong className="text-[#0F172A]">Response Time:</strong> Typically within 24 hours on business days.</p>
                </div>
              </div>
            )}

            {activeModal === 'privacy' && (
              <div>
                <div className="flex items-center gap-2 text-[#0A192F] mb-3">
                  <Shield size={22} className="text-[#059669]" />
                  <h3 className="font-serif text-xl font-bold">Privacy Policy</h3>
                </div>
                <p className="text-sm text-[#334155] mb-3">
                  Your privacy is critically respected at SheRoots Foundation.
                </p>
                <div className="text-xs text-[#334155] space-y-3 leading-relaxed">
                  <p>
                    <strong className="text-[#0F172A]">Information Collected:</strong> When you purchase The Home Training Blueprint Bundle, we collect only your email address and payment confirmation to deliver your digital access links securely.
                  </p>
                  <p>
                    <strong className="text-[#0F172A]">Data Security:</strong> All transactions are processed through encrypted payment gateway partners with 256-bit SSL encryption. We never store or view your payment card numbers.
                  </p>
                  <p>
                    <strong className="text-[#0F172A]">Zero Spam:</strong> We will never sell, rent, or share your contact information with external marketing agencies.
                  </p>
                </div>
              </div>
            )}

            {activeModal === 'refund' && (
              <div>
                <div className="flex items-center gap-2 text-[#0A192F] mb-3">
                  <RotateCcw size={22} className="text-[#2563EB]" />
                  <h3 className="font-serif text-xl font-bold">7-Day Money-Back Guarantee</h3>
                </div>
                <div className="text-xs sm:text-sm text-[#334155] space-y-3 leading-relaxed">
                  <p>
                    We stand behind the practical value of The Home Training Blueprint Bundle.
                  </p>
                  <p>
                    If within 7 days of purchase the materials have not given you a clearer picture of your parenting patterns and actionable guidance on what to do differently, simply email our team with your receipt.
                  </p>
                  <p>
                    We will process a prompt, courteous refund with zero hassle.
                  </p>
                </div>
              </div>
            )}

            {activeModal === 'terms' && (
              <div>
                <div className="flex items-center gap-2 text-[#0A192F] mb-3">
                  <FileText size={22} className="text-[#0022DA]" />
                  <h3 className="font-serif text-xl font-bold">Terms of Purchase</h3>
                </div>
                <div className="text-xs text-[#334155] space-y-2.5 leading-relaxed">
                  <p>
                    <strong className="text-[#0F172A]">Digital Delivery:</strong> Upon successful checkout completion, your blueprint bundle files and response guides will be delivered immediately to the email address provided.
                  </p>
                  <p>
                    <strong className="text-[#0F172A]">Personal License:</strong> Materials are licensed for individual family household use and may not be redistributed, resold, or re-published commercially without prior written permission.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-[#0022DA] text-white rounded-lg text-sm font-semibold hover:bg-[#081EB8] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
