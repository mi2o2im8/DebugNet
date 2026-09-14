// Supabase 클라이언트 파일
// npm install @supabase/supabase-js 설치

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(
    supabaseUrl,
    supabaseKey
);