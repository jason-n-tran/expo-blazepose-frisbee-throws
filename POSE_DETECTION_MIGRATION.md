# Pose Detection Migration Guide

## Problem
The app was using `@mediapipe/tasks-vision` which is a **web-only** library. It doesn't work in React Native because:
- Requires browser APIs (DOM, Canvas, document.createElement)
- Can't access React Native's asset system properly
- Designed for web environments, not mobile

## Solution
Migrated to **TensorFlow.js with MoveNet** which is fully compatible with React Native.

## Changes Made

### 1. Installed Dependencies
```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native @tensorflow-models/pose-detection @react-native-async-storage/async-storage @tensorflow/tfjs-backend-webgl
```

### 2. Updated PoseDetectionService.ts
- Replaced MediaPipe's `PoseLandmarker` with TensorFlow's `PoseDetector`
- Changed from MediaPipe BlazePose to MoveNet Lightning model
- Updated `detectPoseInFrame()` to work with TensorFlow tensors
- Converted MoveNet keypoints to MediaPipe-compatible format for backward compatibility

### 3. Created useTensorFlow Hook
- New hook at `hooks/useTensorFlow.ts`
- Initializes TensorFlow.js on app startup
- Handles both native and web platforms

### 4. Updated App Layout
- Modified `app/_layout.tsx` to initialize TensorFlow before rendering
- Shows loading screen while TensorFlow initializes
- Shows error screen if initialization fails
- Added ImageData polyfill import for React Native compatibility

### 5. Created ImageData Polyfill
- New utility at `utils/ImageDataPolyfill.ts`
- Provides ImageData API for React Native (not available by default)
- Automatically installed on app startup

## Model Comparison

| Feature | MediaPipe BlazePose | TensorFlow MoveNet |
|---------|-------------------|-------------------|
| Platform | Web only | React Native + Web |
| Speed | Medium | Fast (Lightning) |
| Accuracy | High | Good |
| Keypoints | 33 | 17 |
| Z-coordinate | Yes | No |

## Notes
- MoveNet provides 17 keypoints vs MediaPipe's 33
- MoveNet doesn't provide Z-coordinate (depth), set to 0
- The `pose_landmarker_lite.task` file is no longer needed but kept for reference
- All existing code using the service should work without changes

## Important: Frame Extraction Not Yet Implemented

The `VideoProcessingService.extractFrames()` method currently has placeholder code. You need to implement actual video frame extraction using one of these approaches:

### Option 1: Use expo-video with canvas (Recommended for Expo)
```typescript
// Use expo-video to play video and capture frames
// Requires rendering video to a canvas and extracting pixel data
```

### Option 2: Use react-native-video with react-native-video-processing
```bash
npm install react-native-video react-native-video-processing
```

### Option 3: Use FFmpeg (Most powerful but larger bundle)
```bash
npm install react-native-ffmpeg
```

### Option 4: Use Vision Camera frame processor
Since you already have `react-native-vision-camera`, you could:
1. Record video with Vision Camera
2. Process frames in real-time during recording
3. Store pose data as video is captured

## Testing
Run the app on Android/iOS:
```bash
npm run android
# or
npm run ios
```

**Note**: The pose detection model will now initialize correctly, but you'll need to implement frame extraction before full video analysis works.
