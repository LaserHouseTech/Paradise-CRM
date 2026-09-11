import { createBrowserClient } from "@supabase/ssr";

const meta = typeof import.meta !== 'undefined' ? (import.meta as any) : {};
const supabaseUrl = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) || meta.env?.NEXT_PUBLIC_SUPABASE_URL || "https://uzidzjkolebplnyipwlz.supabase.co";
const supabaseKey = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) || meta.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Sy5PLrc5_X-uIvR6XeDSdA_s0-aAX__";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
