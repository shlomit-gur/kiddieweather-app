# KiddieWeather — Smart Child Dress & Forecast Advisor

An AI-powered Android app that tells you exactly what your child should wear today (and tomorrow), based on the day's weather forecast and their scheduled activities.

**No API keys required. No backend to host. Completely free to run.**

---

## How It Works

- **Weather** — [Open-Meteo](https://open-meteo.com/) provides free hourly and daily forecasts (no account needed).
- **AI outfit planning** — [Pollinations AI](https://pollinations.ai/) provides free anonymous AI inference. The app sends a structured prompt with the child's profile, activities, and weather; the AI returns a JSON outfit plan.
- **On-device** — Everything runs in the app. There is no server to maintain.

The AI is called only when needed (activity or profile changes), and results are cached locally so the app is fast on repeat opens.

---

## Features

- Personalised outfit plan for today and tomorrow
- Accounts for each activity's location, timing, and weather window
- Packs only what's needed during the activity — not before or after
- Separate sunscreen, umbrella, and mosquito repellent logic (weather-driven, not AI-guessed)
- Multi-child support with per-child wardrobe and profile
- Recurring and one-off activity schedules
- 7-day forecast with UV, rain risk, and wind
- Works offline (cached plan and fallback weather data)

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19 + Tailwind CSS v4 |
| Native shell | Capacitor 7 (Android) |
| Build tool | Vite 8 |
| Weather API | Open-Meteo (free, no key) |
| AI | Pollinations AI `/openai` endpoint (free, no key) |
| Language | TypeScript |

---

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later (or bun)
- **Android Studio** (Hedgehog or later) with Android SDK 34+
- A physical Android device or emulator (API 26 / Android 8.0+)

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/kiddieweather-app.git
cd kiddieweather-app
npm install
```

### 2. Run in the browser (no Android needed)

```bash
npm run dev
```

Open `http://localhost:5173`. The full UI works in the browser — useful for development and testing.

### 3. Build and run on Android

```bash
# Build the web app
npm run build

# Sync web assets into the Android project
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio: select your device and click **Run ▶**.

---

## Building a Release APK

In Android Studio:

1. **Build → Generate Signed App Bundle / APK**
2. Choose **APK**
3. Create or select a keystore
4. Select **release** build variant
5. The signed APK is output to `android/app/release/`

To distribute via GitHub Releases: create a new release on GitHub and attach the `.apk` file as a release asset. Users download it, enable **Install from unknown sources** in Android settings (Settings → Apps → Special app access), and install directly.

---

## Configuration (first run)

On first launch:

1. **Set your location** — tap the location bar at the top to search for your city.
2. **Add a child profile** — tap the child avatar to enter name, date of birth, temperature tendency, and activity level.
3. **Set the wardrobe** — in the child profile, select the clothing items the child actually owns. The AI will only suggest items from this list.
4. **Add activity schedules** — in the Kid Profile tab, add recurring routines (daycare, school, park) with start/end times and location.

The app will automatically generate an outfit plan each morning based on the day's forecast and scheduled activities.

---

## Project Structure

```
src/
  components/       # UI components (OutfitVisualizer, WeatherSummaryCard, etc.)
  services/
    suggestionEngineService.ts   # AI call, caching, prompt building
    populateSuggestionFromEngine.ts  # Maps AI plan → clothing recommendation
    weatherService.ts            # Open-Meteo API
  types/            # TypeScript interfaces
  utils/            # Date helpers, clothing catalog, schedule utilities
android/            # Capacitor Android project (generated)
```

---

## Limitations

- The AI uses Pollinations' free anonymous tier — availability is best-effort and may occasionally be unreachable.
- Tomorrow's plan requires an explicit "Re-query" tap (not auto-generated on first visit).
- No iOS build — Capacitor supports iOS but this project has only been configured and tested for Android.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a Pull Request

---

## License

MIT — see [LICENSE](LICENSE) for details.
