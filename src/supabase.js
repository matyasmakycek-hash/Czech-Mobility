import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lwnkdkgituupkrzgfocu.supabase.co";

const supabasePublishableKey =
  "sb_publishable_Q4jwaIVG2_wyL_44C_mijg_CL25DAAv";

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);
