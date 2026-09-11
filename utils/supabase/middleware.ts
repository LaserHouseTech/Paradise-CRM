import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uzidzjkolebplnyipwlz.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_Sy5PLrc5_X-uIvR6XeDSdA_s0-aAX__";

export const updateSession = async (request: Request) => {
  let response = new Response();

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get('cookie') || '';
          return cookieHeader.split(';').map(c => {
            const [name, ...val] = c.trim().split('=');
            return { name, value: val.join('=') };
          }).filter(c => c.name);
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            response.headers.append('Set-Cookie', `${name}=${value}; Path=/; HttpOnly`);
          });
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
};
