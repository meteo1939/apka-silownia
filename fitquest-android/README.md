# FitQuest Android App 📱🏋️‍♂️

Ta wersja aplikacji **FitQuest** została przystosowana do działania jako natywna aplikacja na system **Android** przy użyciu **Capacitor**. 

Dzięki temu cała logika (React, TypeScript, Zustand) oraz baza danych (Supabase) działają bezpośrednio na urządzeniu mobilnym, zachowując 100% płynności animacji i nowoczesnego designu.

---

## 🚀 Jak uruchomić i skompilować aplikację

### 1. Wymagania wstępne
Upewnij się, że masz zainstalowane:
*   [Node.js](https://nodejs.org/) (zalecana wersja 18+)
*   [Android Studio](https://developer.android.com/studio) (do kompilacji kodu Java/Kotlin oraz uruchamiania emulatora)
*   Pakiet Android SDK i narzędzia wiersza poleceń (dostępne w instalatorze Android Studio)

---

### 2. Szybka budowa i synchronizacja zasobów

Jeśli dokonasz jakichkolwiek zmian w plikach źródłowych React (`src/`):

1.  **Zbuduj aplikację webową**:
    ```bash
    npm run build
    ```
2.  **Prześlij zbudowane pliki (HTML/JS/CSS) do folderu mobilnego**:
    ```bash
    npx cap sync
    ```

---

### 3. Kompilowanie aplikacji i uruchomienie

#### Sposób A: Przez Android Studio (Zalecany)
1.  Otwórz aplikację **Android Studio**.
2.  Wybierz opcję **Open...** i wskaż folder z projektem natywnym:
    `e:/Apka silownia/fitquest-android/android`
    *(Możesz też wpisać polecenie `npx cap open android` w terminalu, które otworzy ten projekt automatycznie)*.
3.  Zaczekaj, aż Gradle pobierze zależności i zsynchronizuje projekt.
4.  Podłącz swój telefon (z włączonym trybem debugowania USB) lub uruchom wbudowany emulator.
5.  Kliknij ikonę zielonego trójkąta (**Run**) na górnym pasku.

#### Sposób B: Przez terminal (CLI)
Kompilacja bezpośrednio z wiersza poleceń na systemie Windows (z poziomu folderu `fitquest-android`):
```powershell
.\android\gradlew.bat -p android assembleDebug
```
Po ukończeniu kompilacji plik APK znajdziesz pod ścieżką:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🛠️ Ustawienia i modyfikacje mobilne

*   **Ikona aplikacji i Splash Screen**: Pliki graficzne konfiguruje się w folderze `android/app/src/main/res/`. Możesz skorzystać z generatora `@capacitor/assets` do automatycznego wycinania ikon.
*   **Konfiguracja Capacitor**: Główny plik ustawień to [capacitor.config.ts](file:///e:/Apka%20silownia/fitquest-android/capacitor.config.ts). Możesz w nim m.in. zdefiniować adres serwera dev do automatycznego przeładowywania (Live Reload) podczas programowania:
    ```typescript
    server: {
      url: "http://TWOJ-IP-LOKALNY:5173",
      cleartext: true
    }
    ```
