import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SalesPageContent } from '../types';

// Read credentials from Vite environment variables or window fallback
const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof window !== 'undefined' && (window as unknown as { __SUPABASE_URL__?: string }).__SUPABASE_URL__) ||
  '';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof window !== 'undefined' && (window as unknown as { __SUPABASE_ANON_KEY__?: string }).__SUPABASE_ANON_KEY__) ||
  '';

let supabaseClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://'));
}

export function getSupabaseProjectDomain(): string {
  if (!supabaseUrl) return '';
  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return supabaseUrl;
  }
}

export interface SupabaseHealthResult {
  status: 'connected' | 'error' | 'not_configured';
  message: string;
  latencyMs?: number;
  url?: string;
  lastChecked: string;
  rowCount?: number;
}

/**
 * Diagnostic ping to verify live connection to Supabase database
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  const lastChecked = new Date().toLocaleTimeString();

  if (!isSupabaseConfigured()) {
    return {
      status: 'not_configured',
      message: 'Supabase URL or Anon Key not configured in environment variables.',
      lastChecked
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      status: 'error',
      message: 'Failed to initialize Supabase client instance.',
      url: supabaseUrl,
      lastChecked
    };
  }

  const startTime = performance.now();
  try {
    const { count, error } = await client
      .from('site_content')
      .select('*', { count: 'exact', head: true });

    const latencyMs = Math.round(performance.now() - startTime);

    if (error) {
      return {
        status: 'error',
        message: error.message || 'Error querying site_content table.',
        latencyMs,
        url: supabaseUrl,
        lastChecked
      };
    }

    return {
      status: 'connected',
      message: 'Connected & ready for live publishing.',
      latencyMs,
      url: supabaseUrl,
      rowCount: count ?? 1,
      lastChecked
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Network error reaching Supabase endpoint.',
      latencyMs,
      url: supabaseUrl,
      lastChecked
    };
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseClient) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseClient;
}

/**
 * Fetch latest sales page content directly from Supabase
 */
export async function fetchSupabaseContent(): Promise<SalesPageContent | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('site_content')
      .select('data')
      .eq('id', 'sales_page')
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return null;
    }

    if (data && data.data) {
      return data.data as SalesPageContent;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching content from Supabase:', err);
    return null;
  }
}

/**
 * Save sales page content directly to Supabase
 */
export async function saveSupabaseContent(content: SalesPageContent): Promise<{ success: boolean; message?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase client is not configured' };
  }

  try {
    const { error } = await client
      .from('site_content')
      .upsert(
        {
          id: 'sales_page',
          data: content,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Supabase save error:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Exception saving to Supabase:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown error saving to Supabase'
    };
  }
}

/**
 * Subscribe to realtime changes in Supabase so open tabs update immediately
 */
export function subscribeToSupabaseChanges(callback: (content: SalesPageContent) => void): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channel = client
      .channel('site_content_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_content',
          filter: 'id=eq.sales_page'
        },
        (payload) => {
          if (payload.new && (payload.new as { data?: SalesPageContent }).data) {
            callback((payload.new as { data: SalesPageContent }).data);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return null;
  }
}
