import { createClient } from "@supabase/supabase-js";

// Mesmas credenciais do frontend antigo (frontend/script.js) — a chave
// "publishable" é segura pra expor no client, o controle de acesso real
// fica nas políticas de RLS configuradas no Supabase.
const supabaseUrl = "https://vaiedrsonmktbnkcktqv.supabase.co";
const supabaseKey = "sb_publishable_K1kdVFqNe9olG91GCEe-rg_D6BcQZk8";

export const supabaseClient = createClient(supabaseUrl, supabaseKey);
