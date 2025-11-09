# Project Structure

## Root Directory Layout

```
├── app/                    # Expo Router screens (file-based routing)
├── components/             # Reusable React components
├── hooks/                  # Custom React hooks
├── assets/                 # Static assets (images, icons)
├── android/                # Native Android project
├── .expo/                  # Expo build artifacts
└── .kiro/                  # Kiro AI assistant configuration
```

## App Directory (Expo Router)

- `app/_layout.tsx` - Root layout with providers (GluestackUI, GestureHandler)
- `app/(tabs)/` - Tab-based navigation screens
- `app/MediaViewer.tsx` - Full-screen media viewer for photos/videos

File-based routing: file names map to routes automatically.

## Components Directory

- `components/ui/` - UI library components (Gluestack)
- `components/CaptureButton.tsx` - Custom camera capture button with gestures
- `components/StatusBarBlurBackground.tsx` - Status bar styling component

## Hooks Directory

Custom React hooks for shared logic:
- `useIsForeground.ts` - Detect if app is in foreground
- `usePreferredCameraDevice.ts` - Camera device selection

## Key Files

- `Constants.ts` - App-wide constants (screen dimensions, safe areas, button sizes)
- `global.css` - Global styles for NativeWind
- `nativewind-env.d.ts` - TypeScript definitions for NativeWind

## Code Organization Patterns

### Import Aliases
Use `@/` prefix for all imports from project root:
```typescript
import { useIsForeground } from '@/hooks/useIsForeground'
import { CaptureButton } from '@/components/CaptureButton'
```

### Component Structure
- Use functional components with TypeScript
- Define Props interface above component
- Use React.memo for performance-critical components
- Separate styles using StyleSheet.create at bottom

### Styling Approach
- Primary: NativeWind (Tailwind) classes via className prop
- Secondary: StyleSheet for complex/dynamic styles
- Custom color system defined in tailwind.config.js

### State Management
- React hooks (useState, useRef) for local state
- Reanimated SharedValue for animated values
- MMKV for persistent storage (when needed)

### Worklets
Mark functions with `'worklet'` directive when used in animations or gesture handlers for performance.
