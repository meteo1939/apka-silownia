import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "BŁĄD: Brak zdefiniowanych zmiennych VITE_SUPABASE_URL lub VITE_SUPABASE_ANON_KEY w pliku .env! " +
    "Upewnij się, że plik .env istnieje w odpowiednim katalogu, a po jego utworzeniu zrestartowałeś serwer deweloperski (npm run dev)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
