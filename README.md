# Capture

Minimal bare React Native app for on-device LLM chat via [llama.rn](https://github.com/mybigday/llama.rn).

- **No Expo**
- **Single screen** (`App.tsx`)
- **Model:** `llm-models/qwen-q4_k_m.gguf` (bundled, unpacked on first load)

## Stack

- React Native 0.77 (New Architecture enabled)
- llama.rn
- react-native-fs (copy bundled model to a readable path)

## Run

```bash
cd Mobile/Capture
npm install
cd ios && LANG=en_US.UTF-8 pod install && cd ..

# Android
npm run android

# iOS (Xcode 16.x)
npm run ios
```

1. Open the app
2. Tap **Load Model** (first launch unpacks ~380MB once)
3. Chat

## Notes

- Not Expo Go — must use native dev builds (`npm run ios` / `npm run android`).
- iOS entitlements for large models are in `ios/Capture/Capture.entitlements`.
- If Gradle download times out on Android, pre-cache Gradle or increase `networkTimeout` in `android/gradle/wrapper/gradle-wrapper.properties`.
