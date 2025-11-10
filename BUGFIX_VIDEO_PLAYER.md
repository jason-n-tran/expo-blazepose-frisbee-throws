# Bug Fixes: Video Player and FileSystem Errors

## Issue 1: Video Player Error

The initial implementation used `expo-video`'s `useVideoPlayer` hook incorrectly, causing an error:

```
ERROR [Error: The 1st argument cannot be cast to type expo.modules.video.player.VideoPlayer 
(received class java.lang.Integer)]
```

### Root Cause

The `useVideoPlayer` hook was being used incorrectly:
1. Using `player.replace()` instead of `player.replaceAsync()`
2. Not properly waiting for video to be ready after replacement

## Issue 2: FileSystem Encoding Error

```
ERROR [TypeError: Cannot read property 'Base64' of undefined]
```

### Root Cause

Incorrect import of `expo-file-system` - using namespace import instead of named imports.

## Solutions

### Fixed expo-video Implementation

#### Before (Incorrect)
```typescript
const player = useVideoPlayer(currentVideoUri, (player) => {
  player.muted = true;
  player.pause();
});

// Later... WRONG - synchronous replace() doesn't work properly
player.replace(videoUri);
```

#### After (Correct)
```typescript
const player = useVideoPlayer(currentVideoUri || '', (player) => {
  player.muted = true;
  player.pause();
});

// Use replaceAsync() for dynamic video loading
await player.replaceAsync(videoUri);

// Wait for player to be ready
await waitForPlayerReady(player);

// Now safe to seek
player.currentTime = timestamp / 1000;
```

### Fixed FileSystem Import

#### Before (Incorrect)
```typescript
import * as FileSystem from 'expo-file-system';

// Later... WRONG - EncodingType is undefined
const base64 = await FileSystem.readAsStringAsync(uri, {
  encoding: FileSystem.EncodingType.Base64,
});
```

#### After (Correct)
```typescript
import { readAsStringAsync, deleteAsync, EncodingType } from 'expo-file-system';

// Use named imports directly
const base64 = await readAsStringAsync(uri, {
  encoding: EncodingType.Base64,
});
```

## Key Learnings

1. **Use `replaceAsync()` not `replace()`**: The async version properly handles video loading
2. **Wait for player status**: Always check player.status === 'readyToPlay' before seeking
3. **Use named imports**: expo-file-system exports don't work well with namespace imports
4. **expo-video is modern**: Despite being newer, it's the recommended approach over expo-av

## Changes Made

### VideoFrameExtractor.tsx
- Fixed to use `player.replaceAsync()` instead of `player.replace()`
- Added proper waiting for player ready state
- Kept using expo-video (modern, recommended approach)

### imageToImageData.ts
- Changed from namespace import to named imports
- Fixed `FileSystem.EncodingType.Base64` to `EncodingType.Base64`
- Fixed `FileSystem.readAsStringAsync` to `readAsStringAsync`
- Fixed `FileSystem.deleteAsync` to `deleteAsync`

## Testing

The frame extraction should now work without errors:

```
[VideoFrameExtractor] Loading new video...
[VideoFrameExtractor] Video loaded
[VideoFrameExtractor] Seeking to 0ms
[VideoFrameExtractor] Frame captured to: file://...
```

## Why expo-video is Better

Despite the initial issues, expo-video is the modern, recommended approach:
- **Better performance**: Optimized for React Native's new architecture
- **Active development**: Regular updates and improvements
- **Future-proof**: expo-av is deprecated
- **Cleaner API**: Hook-based approach is more React-like

The key was using the API correctly (`replaceAsync` vs `replace`).
