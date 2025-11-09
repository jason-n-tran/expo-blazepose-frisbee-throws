# Technology Stack

## Framework & Runtime

- **React Native** 0.81.5 with React 19.1.0
- **Expo** ~54.0.23 with Expo Router ~6.0.14 for file-based routing
- **TypeScript** ~5.9.2 with strict mode enabled
- **New Architecture** enabled for improved performance

## Core Libraries

### UI & Styling
- **NativeWind** 4.2.1 - Tailwind CSS for React Native
- **Gluestack UI** - Component library with theming
- **React Native Reanimated** ~4.1.0 - Animations
- **Legendapp Motion** - Additional animation utilities
- **React Native Gesture Handler** ~2.28.0 - Touch gestures

### Camera & Media
- **React Native Vision Camera** ^4.7.2 - Camera functionality
- **Expo Video** ~3.0.14 - Video playback
- **Expo Media Library** ^18.2.0 - Save to camera roll

### Performance & State
- **React Native Worklets** - JS worklets for animations
- **React Native MMKV** ^4.0.0 - Fast key-value storage
- **React Native Nitro Modules** - Native module performance

### Navigation
- **Expo Router** - File-based routing
- **React Navigation Drawer** - Drawer navigation

## Build System

- **Metro** bundler (configured via metro.config.js)
- **Babel** with custom module resolution
- **Gradle** for Android builds

## Path Aliases

- `@/*` maps to project root
- Configured in both tsconfig.json and babel.config.js

## Common Commands

```bash
# Development
npm start              # Start Expo dev server
npm run android        # Run on Android device/emulator
npm run ios            # Run on iOS device/simulator
npm run web            # Run in web browser

# No test or build scripts defined in package.json
```

## Configuration Files

- `app.json` - Expo configuration
- `tsconfig.json` - TypeScript with strict mode
- `tailwind.config.js` - Custom color system and theme
- `babel.config.js` - Module resolution and worklets plugin
- `metro.config.js` - Metro bundler configuration
