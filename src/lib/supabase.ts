import { createClient } from '@supabase/supabase-js';

const meta = typeof import.meta !== 'undefined' ? (import.meta as any) : {};

export const SUPABASE_URL =
  meta.env?.VITE_SUPABASE_URL ||
  meta.env?.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.NEXT_PUBLIC_SUPABASE_URL)) ||
  'https://uzidzjkolebplnyipwlz.supabase.co';

export const SUPABASE_ANON_KEY =
  meta.env?.VITE_SUPABASE_ANON_KEY ||
  meta.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) ||
  'sb_publishable_Sy5PLrc5_X-uIvR6XeDSdA_s0-aAX__';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseHealthStatus {
  connected: boolean;
  url: string;
  tablesFound: string[];
  missingTables: string[];
  error?: string;
}

const EXPECTED_TABLES = [
  'clients',
  'contracts',
  'receivables',
  'expenses',
  'proposals',
  'leads',
  'tasks',
  'financial_accounts',
  'company_settings',
  'app_state_backup',
];

export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  const status: SupabaseHealthStatus = {
    connected: false,
    url: SUPABASE_URL,
    tablesFound: [],
    missingTables: [],
  };

  try {
    // Check each expected table
    for (const table of EXPECTED_TABLES) {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (!error) {
        status.tablesFound.push(table);
      } else if (
        error.code === 'PGRST205' ||
        error.code === '42P01' ||
        error.message?.toLowerCase().includes('schema cache') ||
        error.message?.toLowerCase().includes('could not find') ||
        error.message?.toLowerCase().includes('does not exist')
      ) {
        status.missingTables.push(table);
      } else {
        // Table exists but maybe empty or policy restricted
        status.tablesFound.push(table);
      }
    }

    status.connected = true;
    return status;
  } catch (err: any) {
    status.connected = false;
    status.error = err.message || 'Falha ao conectar com o Supabase';
    return status;
  }
}
