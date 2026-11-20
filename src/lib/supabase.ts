import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export async function mergeAccountState(patch: Record<string, unknown>) {
  if (!supabase) return { ok: false, message: "Supabase is not configured." };

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return { ok: false, message: sessionError.message };
  if (!session) return { ok: false, message: "Sign in before syncing account data." };

  const { error } = await supabase.rpc("merge_trade_nova_state", { state_patch: patch });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Account data synced." };
}

export async function readAccountState() {
  if (!supabase) return { ok: false, payload: null, message: "Supabase is not configured." };
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return { ok: false, payload: null, message: sessionError.message };
  if (!session) return { ok: false, payload: null, message: "Sign in before loading account data." };

  const { data, error } = await supabase.from("user_app_state").select("payload").eq("user_id", session.user.id).maybeSingle();
  if (error) return { ok: false, payload: null, message: error.message };
  return { ok: true, payload: data?.payload ?? null, message: "Account data loaded." };
}
