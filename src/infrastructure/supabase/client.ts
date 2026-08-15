import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente Supabase para el navegador (Client Components).
 * Utiliza la Anon Key pública de Supabase.
 * Cada llamada crea una instancia (o reutiliza una existente via módulo).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
