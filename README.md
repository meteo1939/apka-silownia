# Apka Siłownia (FitQuest) 🏋️‍♂️🎮

Nowoczesna, mobilnie zoptymalizowana aplikacja webowa do treningu siłowego, łącząca śledzenie postępów z grywalizacją w stylu gier RPG. Zdobywaj punkty doświadczenia (EXP) dla poszczególnych partii mięśniowych, awansuj na kolejne poziomy, realizuj cele kaloryczne i odblokowuj wyjątkowe osiągnięcia!

## 🌟 Główne funkcje programu

- **Grywalizacja (RPG)**: Zbieraj punkty doświadczenia za każdy trening i rozwijaj wirtualnego bohatera.
- **Poziomy mięśni**: Poszczególne partie ciała mają własne paski postępu. Skup się w pełni na ich rozbudowie.
- **Śledzenie treningów**: Proste rejestrowanie serii, powtórzeń i użytego ciężaru.
- **Katalog planów treningowych**: Baza gotowych i spersonalizowanych planów dostosowanych do Twojego poziomu zaawansowania.
- **Pulpit i statystyki**: Wizualizacja postępów, wykresy wydolności oraz licznik przyjętych kalorii.
- **Tablica wyników (Leaderboard)**: Rywalizuj ze znajomymi i innymi użytkownikami o najlepsze miejsce w rankingu!
- **System osiągnięć i odznak**: Nagrody za regularność, rekordy siłowe i codzienne passy (streak).
- **Zintegrowane logowanie**: Bezpieczna autoryzacja za pomocą Firebase (Email/Hasło).

## 🛠️ Technologie

Aplikacja opiera się o nowoczesny stos technologiczny (Frontend):

- **[React 19](https://react.dev/)** – Biblioteka do budowania interfejsów użytkownika
- **[TypeScript](https://www.typescriptlang.org/)** – Bezpieczne typowanie kodu
- **[Vite](https://vitejs.dev/)** – Ultraszybki bundler i środowisko deweloperskie
- **[Zustand](https://zustand-demo.pmnd.rs/)** – Lekkie i proste zarządzanie stanem lokalnym
- **[React Router DOM](https://reactrouter.com/)** – Nawigacja między stronami (SPA)
- **[Firebase](https://firebase.google.com/)** – Autoryzacja i ewentualny Backend jako Usługa (BaaS)
- **[Lucide React](https://lucide.dev/)** – Nowoczesny pakiet ikon

## 🚀 Uruchomienie lokalne (Development)

Aby uruchomić aplikację lokalnie na swoim komputerze:

### 1. Wymagania wstępne
Upewnij się, że masz zainstalowane środowisko **[Node.js](https://nodejs.org/en/)** (wraz z menedżerem pakietów npm).

### 2. Sklonuj repozytorium (albo po prostu przejdź do folderu projektu)
```bash
git clone https://github.com/meteo1939/apka-silownia.git
cd apka-silownia
```

### 3. Zainstaluj zależności
```bash
npm install
```

### 4. Uruchom serwer testowy
```bash
npm run dev
```

Aplikacja powinna być domyślnie dostępna w przeglądarce pod adresem: `http://localhost:5173/`.

## 📦 Budowanie do produkcji (Production Build)

Aby wygenerować zoptymalizowaną wersję aplikacji gotową do wdrożenia, uruchom:
```bash
npm run build
```
Zbudowane pliki pojawią się w automatycznie utworzonym folderze `dist/`.

## 🤝 Wkład własny (Contributing)

Jeśli chcesz rozwijać projekt, stwórz nową gałąź (`git checkout -b feature/nowa-funkcja`), wprowadź zmiany, zrób commit (`git commit -m 'Dodanie nowej funkcji'`) i wypchnij gałąź na serwer (`git push origin feature/nowa-funkcja`). Następnie możesz utworzyć Pull Request!
