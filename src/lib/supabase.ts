import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Supabase 연결(2단계: 로그인·상담 이력 저장 용도, spec FR-030~035).
// 1단계(현재)에서는 어디에서도 가져오지 않는다. anon 키는 공개용이며 접근 통제는 RLS로 한다.
// service_role 키는 절대 VITE_ 접두사로 두지 않는다(브라우저 번들에 포함됨).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null
