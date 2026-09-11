import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uzidzjkolebplnyipwlz.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Sy5PLrc5_X-uIvR6XeDSdA_s0-aAX__";

export interface CookieStoreLike {
  getAll: () => Array<{ name: string; value: string }>;
  set?: (name: string, value: string, options?: any) => void;
}

export const createClient = (cookieStore?: CookieStoreLike) => {
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore?.getAll?.() || [];
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore?.set?.(name, value, options)
            );
          } catch {
            // Ignored in read-only / server component contexts
          }
        },
      },
    },
  );
};
