# FitQuest (Apka Siłownia) 🏋️‍♂️🎮

Nowoczesna, zoptymalizowana mobilnie aplikacja webowo-mobilna do treningu siłowego, łącząca śledzenie postępów z grywalizacją w stylu gier RPG. Zdobywaj punkty doświadczenia (EXP) dla poszczególnych partii mięśniowych, awansuj na kolejne poziomy, realizuj cele kaloryczne, kupuj epicki ekwipunek na Czarnym Rynku i walcz z gladiatorami na Arenie!

Projekt składa się z dwóch powiązanych części:
1. **Aplikacja Webowa** (`src/`) – zoptymalizowana dla urządzeń mobilnych aplikacja React + TypeScript.
2. **Aplikacja Mobilna Android** (`fitquest-android/`) – natywny port Android wykorzystujący framework **Capacitor** do uruchamiania aplikacji bezpośrednio na telefonach.

---

## 🌟 Główne funkcje programu

- **🎮 Grywalizacja & Statystyki RPG**: Zbieraj punkty doświadczenia za każdy trening i rozwijaj wirtualnego bohatera.
- **📈 Poziomy Mięśni (Statystyki)**: Każda partia ciała (Klatka, Plecy, Nogi, Ramiona, Barki, Brzuch) ma swój własny poziom oraz pasek postępu wraz z czytelnym wskaźnikiem EXP (np. `120/300`) oraz procentowym postępem.
- **⚔️ Arena Gladiatorów (Matchmaking & Walka)**:
  - Ekran skanowania z dynamicznym radarem wyszukującym pretendentów.
  - Wybór spośród **6 przeciwników** podzielonych na kategorie trudności: **Słaby** (0.5x nagrody), **Równy** (1.0x nagrody), **Silny** (1.6x nagrody).
  - Wizualne starcia z animacjami doskoku (lunge), uników (dodge) i efektów cięć.
- **🎁 Czarny Rynek (Sklep ze Skrzynkami)**:
  - Zakup losowego ekwipunku o zróżnicowanej rzadkości (Common, Rare, Epic, Legendary).
  - W pełni animowany proces otwierania skrzyń – 1.5-sekundowa sekwencja drżenia i pulsowania prezentu 🎁 przed ukazaniem wylosowanego przedmiotu.
- **🍎 Tracker Kalorii i Makroskładników**:
  - Automatyczne wyliczanie zapotrzebowania na Białko (2g/kg), Tłuszcze (1g/kg) i Węglowodany.
  - Cele kalorii i makro pobierane z onboardingu (o ile został ukończony).
  - Wyszukiwarka produktów oraz kreator dodawania własnych posiłków.
- **🏋️ Aktywna Sesja Treningowa**:
  - Wybór gotowych planów (FBW, PPL, Trening w Domu, Trening z Hantlami) lub pustej sesji z bazy ponad 23 ćwiczeń.
  - Licznik czasu sesji oraz konfigurowalny timer przerw (60/90/120/180 s) z paskiem „+30 s” i pominięciem.
  - Podpowiedzi poprzednich wyników i automatyczna progresja ciężaru/powtórzeń na podstawie ostatniego treningu.
  - Serie z ciężarem, powtórzeniami i RPE, notatki do ćwiczeń oraz notatka i RPE całej sesji.
  - Sesja jest zapisywana lokalnie i wznawiana po odświeżeniu strony (do 24 godzin).
- **📚 Historia Treningów i Wykresy** (`/progress`):
  - Pełna historia sesji z rozwijanymi szczegółami i możliwością usunięcia wpisu.
  - Wykresy objętości tygodniowej, częstotliwości treningów, balansu mięśni i trendu masy ciała.
  - Rekordy osobiste (PR) z szacowanym 1RM, seria tygodni z rzędu i statystyki łączne.
- **🗓️ Miesięczny Heatmap Treningów**:
  - Kalendarz w stylu GitHuba — każda kratka to jeden dzień, a intensywność pomarańczu odpowiada liczbie serii.
  - Widok miesięczny z numerami dni, nawigacją miesięcy i wyborem dnia oraz roczny pasek 12 miesięcy.
  - Kompaktowa wersja na pulpicie z linkiem do pełnych postępów.
- **🎯 Onboarding po Rejestracji**:
  - Krótki kreator: cel (masa/redukcja/utrzymanie), poziom, liczba dni treningowych i dostępny sprzęt.
  - Automatyczny dobór planu treningowego oraz wyliczenie kalorii i makroskładników.
  - Możliwość pominięcia i uzupełnienia konfiguracji później z pulpitu lub strony Postępów.
- **🏆 Tablica Wyników (Leaderboard)**: Rywalizacja w rankingu prestiżu w czasie rzeczywistym.
- **🎨 Spójny ciemny interfejs i nawigacja**:
  - Jeden, minimalistyczny ciemny motyw: neutralne grafity, jeden pomarańczowy akcent i czerwień wyłącznie dla alertów/błędów (bez gradientów i poświat).
  - Pełna **nawigacja desktopowa** (górny pasek z logo, linkami i podsumowaniem profilu) oraz dolna nawigacja mobilna.
  - Responsywny układ: dwukolumnowy pulpit na szerokich ekranach, szerokości stron ograniczone dla czytelności.
- **🌍 Lokalizacja (i18n)**:
  - Obsługa języków: **Polski** 🇵🇱 (domyślny) oraz **Angielski** 🇬🇧 z dynamicznym tłumaczeniem interfejsu, nazw ekwipunku, ćwiczeń oraz logów z walk na arenie.
  - Zapisywanie preferencji języka bezpośrednio w chmurze Supabase w profilu użytkownika.
- **🔐 Bezpieczeństwo i Logowanie**:
  - Integracja z bazą **Supabase Auth & Database**.
  - Zabezpieczenie przed przypadkowym wylogowaniem (modal z pytaniem *"Czy na pewno chcesz się wylogować?"*).

---

## 🛠️ Stos Technologiczny

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Zarządzanie Stanem**: [Zustand](https://zustand-demo.pmnd.rs/) (reaktywny, zsynchronizowany stan postaci)
- **Nawigacja**: [React Router DOM](https://reactrouter.com/) (SPA)
- **Backend / Baza Danych / Auth**: [Supabase](https://supabase.com/) (zabezpieczone RLS, tabela użytkowników, ekwipunku i statystyk)
- **Natywny Port Mobilny**: [Capacitor 8](https://capacitorjs.com/)
- **Ikony**: [Lucide React](https://lucide.dev/)

---

## 🚀 Uruchomienie lokalne (Development)

Upewnij się, że masz zainstalowane środowisko **[Node.js](https://nodejs.org/en/)** (zalecana wersja 18+).

### 1. Klonowanie i instalacja zależności
```bash
git clone https://github.com/meteo1939/apka-silownia.git
cd apka-silownia
npm install
```

### 2. Konfiguracja zmiennych środowiskowych
Stwórz plik `.env` w głównym folderze oraz w folderze `fitquest-android/` i uzupełnij dane Supabase:
```env
VITE_SUPABASE_URL=twoj-adres-supabase
VITE_SUPABASE_ANON_KEY=twoj-klucz-anon-supabase
```

### 3. Uruchomienie serwera deweloperskiego
```bash
npm run dev
```
Aplikacja będzie dostępna pod adresem: `http://localhost:5173/`.

### 4. Opcjonalna migracja Supabase (zalecana)
Aplikacja działa od razu, zapisując szczegóły sesji w istniejącej kolumnie `workouts.muscles` (z prefiksem `__fitquest:`). Aby korzystać z czystej kolumny `details jsonb` i szybszych zapytań historii, uruchom migrację:

```bash
# W Supabase SQL Editor wklej zawartość pliku:
supabase/migrations/20261113090000_workout_details.sql
```

Migracja dodaje kolumnę `details`, indeks `workouts_user_completed_at_idx` i warunkowe polityki RLS. Nie usuwa żadnych danych.

---

## 📱 Uruchomienie wersji dla Androida

Wszystkie zmiany w kodzie React są w pełni kompatybilne i synchronizowane z wersją mobilną w folderze `fitquest-android/`.

### 1. Zbudowanie plików webowych i synchronizacja Capacitora
Z poziomu głównego folderu lub `fitquest-android/`:
```bash
# Wejdź do folderu Androida
cd fitquest-android

# Zainstaluj zależności
npm install

# Skompiluj aplikację React
npm run build

# Zsynchronizuj zasoby z platformą Android
npx cap sync
```

### 2. Kompilacja i uruchomienie w Android Studio
- Otwórz **Android Studio**.
- Wybierz **Open...** i wskaż folder `fitquest-android/android`.
- Podłącz urządzenie z debugowaniem USB lub uruchom emulator i kliknij **Run** (zielony trójkąt).
