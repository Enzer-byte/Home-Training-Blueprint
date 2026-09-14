import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  MousePointerClick,
  TrendingUp,
  RefreshCw,
  RotateCcw,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { AnalyticsStats, SalesPageContent } from '../types';
import { api } from '../services/api';

interface AdminAnalyticsProps {
  content: SalesPageContent;
}

const BUTTON_CONFIGS: Record<
  string,
  { name: string; section: string; locationDesc: string }
> = {
  hero: {
    name: 'Hero Section CTA',
    section: 'Hero Section',
    locationDesc: 'Directly below the main headline and bundle preview'
  },
  price: {
    name: 'Main Pricing Box CTA',
    section: 'Pricing Section',
    locationDesc: 'Directly below the $37 price comparison card'
  },
  sticky: {
    name: 'Sticky Floating Bar CTA',
    section: 'Sticky Bottom Bar',
    locationDesc: 'Fixed footer bar visible on scroll across all devices'
  },
  close: {
    name: 'Closing Pitch CTA',
    section: 'Close Block',
    locationDesc: 'Directly after the final closing statement'
  },
  ps: {
    name: 'P.S. Section CTA',
    section: 'Postscript Block',
    locationDesc: 'Bottom navy callout box before the footer'
  },
  intro: {
    name: 'Intro Section CTA',
    section: 'Introduction Block',
    locationDesc: 'Directly after the lede story and bundle reveal'
  }
};

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ content }) => {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalClicks: 0,
    clicksByButton: { price: 0, close: 0, ps: 0, sticky: 0, intro: 0 },
    recentEvents: [],
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getAnalyticsStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await api.resetAnalytics();
      if (res.success) {
        setMessage({ type: 'success', text: 'All click metrics have been reset to 0.' });
        setShowResetConfirm(false);
        await fetchStats();
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to reset analytics.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred during reset.' });
    } finally {
      setIsResetting(false);
    }
  };

  // Determine top-performing CTA
  const buttonEntries = Object.entries(stats.clicksByButton || {}) as [string, number][];
  const sortedButtons = [...buttonEntries].sort((a, b) => Number(b[1]) - Number(a[1]));
  const topButtonKey = sortedButtons.length > 0 && Number(sortedButtons[0][1]) > 0 ? sortedButtons[0][0] : null;
  const topButtonConfig = topButtonKey ? BUTTON_CONFIGS[topButtonKey] : null;

  // Format relative or standard timestamp
  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + date.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  const getTargetUrlForButton = (key: string): string => {
    switch (key) {
      case 'hero':
        return content.introCtaUrl || content.priceCtaUrl;
      case 'price':
        return content.priceCtaUrl;
      case 'sticky':
        return content.stickyCtaUrl;
      case 'close':
        return content.closeCtaUrl;
      case 'ps':
        return content.psCtaUrl;
      case 'intro':
        return content.introCtaUrl;
      default:
        return content.priceCtaUrl;
    }
  };

  return (
    <div className="space-y-8" id="cms-analytics-view">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold text-[#0F172A]">
              Sales CTA Click Performance
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#059669]/10 text-[#059669]">
              Live Tracking
            </span>
          </div>
          <p className="text-sm text-[#475569] mt-1">
            Real-time analytics logging clicks across all 5 main 'Buy' call-to-actions on the blueprint sales page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStats}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-[#0F172A] text-sm font-semibold hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            id="analytics-refresh-btn"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh Stats'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 py-2 rounded-lg border border-red-200 bg-white text-red-600 text-sm font-semibold hover:bg-red-50 transition flex items-center gap-2 cursor-pointer"
            id="analytics-reset-trigger-btn"
          >
            <RotateCcw size={15} />
            <span>Reset Counters</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg text-sm flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-[#059669]/10 text-[#059669] border border-[#059669]/20'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Reset Confirmation Modal/Card */}
      {showResetConfirm && (
        <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="font-bold text-sm">Reset click tracking data?</p>
              <p className="text-xs text-amber-800 mt-0.5">
                This will reset all CTA click counts and clear the recent event log. Useful when starting a new marketing campaign or promo split test.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              disabled={isResetting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition cursor-pointer flex items-center gap-1.5"
            >
              {isResetting && <RefreshCw size={12} className="animate-spin" />}
              <span>Yes, Reset Counters</span>
            </button>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="analytics-metric-cards">
        {/* Card 1: Total Clicks */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-[#475569] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Buy Clicks</span>
            <div className="p-2 rounded-lg bg-[#0022DA]/10 text-[#0022DA]">
              <MousePointerClick size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold font-serif text-[#0F172A]">
            {stats.totalClicks.toLocaleString()}
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Aggregated clicks across all 'Buy' buttons
          </p>
        </div>

        {/* Card 2: Top Performing CTA */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-[#475569] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Top CTA Placement</span>
            <div className="p-2 rounded-lg bg-[#059669]/10 text-[#059669]">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-lg font-bold text-[#0F172A] truncate">
            {topButtonConfig ? topButtonConfig.name : 'None yet'}
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            {topButtonKey
              ? `${stats.clicksByButton[topButtonKey]} clicks (${
                  stats.totalClicks > 0
                    ? Math.round((stats.clicksByButton[topButtonKey] / stats.totalClicks) * 100)
                    : 0
                }%)`
              : 'Awaiting first tracked visitor click'}
          </p>
        </div>

        {/* Card 3: Tracked Placements */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-[#475569] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Monitored Buttons</span>
            <div className="p-2 rounded-lg bg-[#0022DA]/10 text-[#0022DA]">
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold font-serif text-[#0F172A]">5</div>
          <p className="text-xs text-[#64748B] mt-1">
            Price, Sticky, Close, P.S., and Intro
          </p>
        </div>

        {/* Card 4: Last Click Registered */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-[#475569] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Last Activity</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-700">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-sm font-semibold text-[#0F172A] truncate">
            {stats.recentEvents.length > 0 ? formatTime(stats.recentEvents[0].timestamp) : 'No clicks logged'}
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            {stats.recentEvents.length > 0
              ? `From "${stats.recentEvents[0].buttonLabel}"`
              : 'Tracking is live on sales page'}
          </p>
        </div>
      </div>

      {/* Button Breakdown Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#0F172A]">
              CTA Button Breakdown & Conversion Share
            </h3>
            <p className="text-xs text-[#64748B]">
              Compare which locations drive the highest customer purchase intent.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(BUTTON_CONFIGS).map(([key, config]) => {
            const count = stats.clicksByButton[key] || 0;
            const percentage = stats.totalClicks > 0 ? Math.round((count / stats.totalClicks) * 100) : 0;
            const targetUrl = getTargetUrlForButton(key);

            return (
              <div
                key={key}
                className="p-4 rounded-xl border border-slate-200 bg-[#F8FAFC] space-y-3"
                id={`analytics-row-${key}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[#0F172A]">{config.name}</h4>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#EFF4FE] text-[#0022DA] font-semibold">
                        id: {key}
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] mt-0.5">{config.locationDesc}</p>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <div className="text-xl font-bold font-serif text-[#0022DA]">
                        {count.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-[#64748B]">clicks</span>
                      </div>
                      <div className="text-xs font-semibold text-[#475569]">{percentage}% of total</div>
                    </div>
                  </div>
                </div>

                {/* Progress Visual Bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0022DA] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(percentage, count > 0 ? 3 : 0)}%` }}
                  />
                </div>

                {/* Destination URL check */}
                <div className="flex items-center justify-between pt-1 text-xs text-[#64748B]">
                  <span className="truncate max-w-[280px] sm:max-w-md">
                    Destination:{' '}
                    <code className="text-[11px] font-mono text-[#0F172A] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {targetUrl || 'Not configured'}
                    </code>
                  </span>
                  {targetUrl && (
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0022DA] hover:underline flex items-center gap-1 font-semibold flex-shrink-0"
                    >
                      <span>Test link</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Click Event Stream */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#0F172A]">Recent Click Log</h3>
            <p className="text-xs text-[#64748B]">
              Last {stats.recentEvents.length} user click interactions recorded.
            </p>
          </div>
          <span className="text-xs text-[#64748B] font-mono">
            Updated: {formatTime(stats.lastUpdated)}
          </span>
        </div>

        {stats.recentEvents.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl text-sm text-[#64748B]">
            <MousePointerClick className="mx-auto mb-2 text-[#64748B]/60" size={28} />
            <p className="font-semibold text-[#0F172A]">No click events logged yet</p>
            <p className="text-xs mt-1">
              Visit the sales page and click any 'Buy' or 'Get the Blueprint' button to test the tracking pipeline!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" id="analytics-event-table">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-[#64748B]">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Button Location</th>
                  <th className="py-2.5 px-3">Button Text</th>
                  <th className="py-2.5 px-3">Destination Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentEvents.slice(0, 20).map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-xs font-mono text-[#64748B] whitespace-nowrap">
                      {formatTime(evt.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-xs text-[#0F172A]">
                      {BUTTON_CONFIGS[evt.buttonId]?.name || evt.buttonId}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-[#475569] italic">
                      "{evt.buttonLabel}"
                    </td>
                    <td className="py-2.5 px-3 text-xs font-mono text-[#0022DA] truncate max-w-[200px]">
                      <a
                        href={evt.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-1"
                      >
                        <span className="truncate">{evt.targetUrl}</span>
                        <ExternalLink size={10} className="flex-shrink-0" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Helpful Optimization Insights */}
      <div className="p-4 rounded-xl bg-[#EFF4FE] border border-blue-100 flex items-start gap-3 text-xs text-[#334155]">
        <Info className="text-[#0022DA] mt-0.5 flex-shrink-0" size={16} />
        <div className="space-y-1">
          <span className="font-bold text-[#0F172A]">How to read your sales analytics:</span>
          <p>
            The <strong>Sticky Bottom Bar</strong> typically captures mobile visitors browsing quickly, while the <strong>Main Pricing Box</strong> catches readers thoroughly reading the curriculum. You can adjust the button labels and destination links at any time in the <em>Pricing & Checkout Links</em> tab.
          </p>
        </div>
      </div>
    </div>
  );
};
