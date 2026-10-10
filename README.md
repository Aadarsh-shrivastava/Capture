# Capture

LockedIn mobile app for capturing tasks, notes, and habits. Items are stored locally in SQLite. Capture supports **voice input**, **text input**, and optional **on-device AI parsing** via [llama.rn](https://github.com/mybigday/llama.rn).

> **Not Expo Go.** This is a bare React Native app with native modules. Run it with `npm run ios` or `npm run android` (dev builds only).

---

## Prerequisites

| Tool | Version / notes |
|------|-----------------|
| **Node.js** | ≥ 18 |
| **npm** | Comes with Node |
| **Xcode** | 16.x (for iOS) |
| **CocoaPods** | `gem install cocoapods` or via `bundle install` + `bundle exec pod install` |
| **Android Studio** | Latest stable, with SDK + emulator or a physical device |
| **Physical device (recommended)** | Voice capture works best on real hardware |

---

## Quick start

```bash
# 1. Clone and install JS dependencies
cd Mobile/Capture
npm install

# 2. Add the LLM model (required for AI capture — see below)
#    Place qwen-q4_k_m.gguf in llm-models/

# 3. iOS native deps
cd ios
LANG=en_US.UTF-8 pod install   # or: bundle exec pod install
cd ..

# 4. Run
npm run ios      # iOS simulator or device
npm run android  # Android emulator or device
```

Metro runs on **port 8082** by default (`npm start`).

---

## LLM model setup

The on-device AI parser expects a **GGUF model file** bundled with the app. Without it, capture still works using **rule-based heuristics**, but AI-assisted parsing will fail when you tap “Load AI model”.

### Where to put the model

```
Capture/
└── llm-models/
    └── qwen-q4_k_m.gguf    ← put the file here (exact name)
```

| Property | Value |
|----------|--------|
| **Directory** | `llm-models/` (project root, next to `package.json`) |
| **Filename** | `qwen-q4_k_m.gguf` (must match exactly) |
| **Size** | ~380 MB |
| **Format** | GGUF (quantized Qwen model) |

The model is **not committed to git** (too large). After cloning, download or copy your GGUF file into `llm-models/` before building.

### How the app uses the model

1. **Bundle** — Metro treats `.gguf` as a static asset (`metro.config.js` adds `gguf` to `assetExts`).
2. **First load** — On “Load AI model”, the app copies the bundled file from the app package to the device documents directory:
   ```
   {DocumentDirectory}/qwen-q4_k_m.gguf
   ```
   This one-time copy can take a minute on first launch.
3. **Inference** — [llama.rn](https://github.com/mybigday/llama.rn) loads the model from that path. iOS uses GPU layers; Android runs on CPU by default.

Relevant code: `src/hooks/useLlamaModel.ts`.

### Using a different model

1. Place your `.gguf` file in `llm-models/`.
2. Update constants in `src/hooks/useLlamaModel.ts`:

   ```ts
   const BUNDLED_MODEL = require('../../llm-models/your-model.gguf');
   const MODEL_NAME = 'your-model.gguf';
   ```

3. Rebuild the native app (`npm run ios` / `npm run android`). A Metro reload alone is not enough after changing bundled assets.

### iOS memory entitlements

Large models need extra memory on iOS. These are already configured in `ios/Capture/Capture.entitlements`:

- `com.apple.developer.kernel.extended-virtual-addressing`
- `com.apple.developer.kernel.increased-memory-limit`

You must run on a **paid Apple Developer** account (or local device provisioning that supports these entitlements) for production builds.

---

## Project structure

```
Capture/
├── App.tsx                 # Root component (navigation, DB, theme)
├── src/
│   ├── screens/            # Focus, Groups, Library, Timeline, Capture, etc.
│   ├── components/         # Tab bar, drawer, capture UI shells
│   ├── models/             # TypeScript data models (Item, Group, Behavior…)
│   ├── capture/            # AI prompts, heuristics, capture flow logic
│   ├── hooks/              # useLlamaModel, useSpeechCapture, useCaptureAnalysis
│   ├── services/           # Business logic + SQLite access
│   ├── db/                 # Schema, migrations, seed data
│   └── navigation/         # Tab + stack navigators
├── components/ui/          # Shared Gluestack-style UI primitives
├── assets/                 # Images and icons
├── llm-models/             # GGUF model (you add this — not in git)
├── android/                # Android native project
└── ios/                    # iOS native project (CocoaPods)
```

---

## Home screen widget (Android)

1. Rebuild the app (`npm run android`).
2. Long-press the home screen → **Widgets** → add **Capture**.
3. Tap the widget → type your prompt → **Save**.

The app analyzes the text (same heuristics as in-app capture) and saves an item locally. No review step — built for speed.

You can also **share text** into Capture from other apps, or open a deep link:

`capture://capture?text=Buy%20milk%20tomorrow`

(iOS: deep links and Shortcuts; add a WidgetKit extension later for a true home widget.)

---

## How capture works

### Entry points

- **Floating + button** — Opens capture flow (text or voice).
- **Voice host** — Speech-to-text via `@react-native-voice/voice`.
- **Text flow** — Type or paste, then analyze.

### Analysis pipeline

1. **With AI model loaded** — Text is sent to the on-device Qwen model with a structured system prompt (`src/capture/buildCaptureSystemPrompt.ts`). The model returns JSON describing item type, title, dates, etc.
2. **Without AI (or on failure)** — Falls back to heuristics in `src/capture/captureHeuristics.ts`.
3. **Review** — You confirm or edit the draft, then save to SQLite.

AI loading is **optional**. Tap **“Load AI model (optional)”** in the capture modal, or let it preload when the modal opens.

### Permissions

| Platform | Permission | Purpose |
|----------|------------|---------|
| iOS | Microphone | Voice capture |
| iOS | Speech recognition | Transcription |
| Android | `RECORD_AUDIO` | Voice capture |

Prompts are configured in `ios/Capture/Info.plist` and `android/app/src/main/AndroidManifest.xml`.

---

## Development commands

```bash
npm start          # Metro bundler (port 8082)
npm run ios        # Build & run iOS
npm run android    # Build & run Android
npm test           # Jest
npm run lint       # ESLint
```

### Path aliases

TypeScript and Babel resolve `@/` to `src/` and `@/components/ui/` to `components/ui/`. See `tsconfig.json` and `babel.config.js`.

---

## Troubleshooting

### “Could not resolve bundled model asset”

- Confirm `llm-models/qwen-q4_k_m.gguf` exists and the filename matches `useLlamaModel.ts`.
- Restart Metro with cache cleared: `npm start -- --reset-cache`.
- Rebuild the native app.

### Model load fails on iOS

- Use a physical device with enough RAM (≥ 6 GB recommended for ~380 MB models).
- Confirm `Capture.entitlements` includes increased memory limits.
- Check Xcode signing / provisioning supports the entitlements.

### Model load is slow on Android

- Expected on CPU-only inference (`n_gpu_layers: 0` in `useLlamaModel.ts`).
- First launch also copies ~380 MB to app documents — wait for “Ready” status.

### Voice capture not working

- **`Cannot read property 'startSpeech' of null`**: the stock `3.x` voice package does not register under React Native **New Architecture**. This repo pins the New Arch–compatible npm alias (`yet-another-react-native-voice@4.0.0`). After `npm install`, **rebuild** the native app (`npm run android` / `npm run ios` and `pod install` on iOS).
- Test on a **physical device**; simulators often lack reliable mic/speech APIs.
- Grant microphone (and speech on iOS) when prompted.
- On Android, deny/re-allow mic in system Settings if stuck.

### `pod install` fails

```bash
cd ios
LANG=en_US.UTF-8 bundle exec pod install
```

Ensure Ruby ≥ 2.6 and CocoaPods ≥ 1.13 (see `Gemfile`).

### Gradle download timeout (Android)

Increase `networkTimeout` in `android/gradle/wrapper/gradle-wrapper.properties`, or pre-download the Gradle distribution.

### npm peer dependency warnings

If install fails on `@expo/vector-icons` / `expo-font` conflicts:

```bash
npm install --legacy-peer-deps
```

---

## Stack

- **React Native 0.77** (New Architecture)
- **Expo modules** (SQLite, fonts, assets — not Expo Go)
- **React Navigation** (tabs + stack)
- **expo-sqlite** — local database
- **llama.rn** — on-device LLM inference
- **@react-native-voice/voice** (New Arch build via `yet-another-react-native-voice@4.0.0`) — speech-to-text
- **zustand** — lightweight state

---

## Git notes

- `llm-models/` is intentionally **untracked** — add your GGUF locally after clone.
- `node_modules/`, `ios/Pods/`, and build artifacts are gitignored.

---

## Typical first-run checklist

- [ ] `npm install`
- [ ] Copy `qwen-q4_k_m.gguf` → `llm-models/`
- [ ] `cd ios && pod install && cd ..`
- [ ] `npm run ios` or `npm run android`
- [ ] Open app → tap **+** to capture
- [ ] (Optional) **Load AI model** in capture modal for smarter parsing
- [ ] Grant mic permission if using voice capture
