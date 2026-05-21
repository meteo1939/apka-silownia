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
  - Wizualne starcia z animacjami doskoku (lunge), uników (dodge), efektów cięć oraz krytycznych błysków ekranu.
- **🎁 Czarny Rynek (Sklep ze Skrzynkami)**:
  - Zakup losowego ekwipunku o zróżnicowanej rzadkości (Common, Rare, Epic, Legendary).
  - W pełni animowany proces otwierania skrzyń – 1.5-sekundowa sekwencja drżenia i pulsowania prezentu 🎁 przed ukazaniem wylosowanego przedmiotu.
- **🍎 Tracker Kalorii i Makroskładników**:
  - Automatyczne wyliczanie zapotrzebowania na Białko (2g/kg), Tłuszcze (1g/kg) i Węglowodany.
  - Wyszukiwarka produktów oraz kreator dodawania własnych posiłków.
- **🏋️ Dziennik Treningowy**:
  - Wybór gotowych planów (FBW, PPL) z podglądem ćwiczeń.
  - Baza ponad 23 ćwiczeń z animowanymi opisami technicznymi i prostym dodawaniem serii.
- **🏆 Tablica Wyników (Leaderboard)**: Rywalizacja w rankingu prestiżu w czasie rzeczywistym.
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
