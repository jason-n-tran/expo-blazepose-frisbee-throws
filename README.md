expo-blazepose-frisbee-throws

Professional README for the `expo-blazepose-frisbee-throws` repository.

This project is a React Native / Expo application focused on extracting and analyzing human pose data from video and camera input, with a feature set for analyzing frisbee throws. The app combines high-performance camera access via `react-native-vision-camera` and on-device machine learning using TensorFlow.js (via `@tensorflow/tfjs` and `@tensorflow/tfjs-react-native`) for pose detection and downstream analysis.

This README documents setup, development, architecture, components, and troubleshooting notes with an emphasis on how `react-native-vision-camera` and TensorFlow.js are integrated and used in this project.

## Table of contents

- Project overview
- Quick start
- Development environment (macOS, Windows, Linux notes)
- Key dependencies and why they matter
- react-native-vision-camera: installation and usage notes
- TensorFlow.js on React Native: installation and initialization
- Running the app (Android & iOS)
- Project structure and important files
- How pose detection flows through the code
- Performance tips and mobile ML best practices
- Common issues and troubleshooting
- Contributing
- License

---

## Project overview

This app captures high-framerate camera frames and extracts frames from video to run a pose detection model (BlazePose-like) using TensorFlow.js on-device. The intended use is to analyze throwing mechanics for frisbee players, display pose overlays, and compute metrics.

Primary goals:

- Accurate pose detection on-device using TensorFlow.js.
- Low-latency real-time camera previews using `react-native-vision-camera`.
- Tools and services for saving videos, extracting frames, and analyzing sequences.

## Quick start (recommended for development)

Prerequisites:

- Node.js (LTS) and npm or Yarn
- Yarn or npm available globally
- Android SDK + Android Studio (for Android builds)
- Xcode (for iOS builds; macOS only)
- Windows: PowerShell is the default shell; example commands are shown for PowerShell

1. Clone the repository (if you haven't already):

```powershell
git clone <repo-url> expo-blazepose-frisbee-throws; cd expo-blazepose-frisbee-throws
```

2. Install dependencies:

```powershell
npm install
# or
yarn install
```

3. Install pods (iOS, macOS only):

```powershell
cd ios; pod install; cd ..
```

4. Start Metro bundler and run the app on Android:

```powershell
npx react-native start --reset-cache
npx react-native run-android
```

For Expo-managed flows, use `expo start` instead where applicable. This project contains native modules and Gradle config in the `android/` folder.

## Development environment notes

- This repository includes native Android project files under `android/` and uses native modules (`react-native-vision-camera`) which require building with the native toolchain.
- For iOS builds you must be on macOS and have Xcode installed.
- For faster iteration with TensorFlow.js on device, use a physical device. Emulators can be slow or not support required camera hardware acceleration.

## Key dependencies

- react-native-vision-camera — high-performance camera for React Native with frame processors. Provides access to Camera frames with minimal latency and strong native integrations.
- @tensorflow/tfjs and @tensorflow/tfjs-react-native — run ML models using TensorFlow.js on React Native. `@tensorflow/tfjs-react-native` provides a React Native backend and utilities for loading models and tensors.
- expo or bare React Native tooling — this repo appears to use a bare workflow with native Android files present.

Why these were chosen:

- `react-native-vision-camera` lets you access raw camera frames and use frame processors to run inference with minimal Java/Kotlin/ObjC overhead.
- TensorFlow.js allows running models in JavaScript on-device and can integrate with WebGL or native backends; `@tensorflow/tfjs-react-native` includes a WASM and RN-native backend to accelerate tensor ops.

## react-native-vision-camera: installation & usage notes

Highlights for this project:

- The camera is used both for live preview and for capturing frames for pose detection. The recommended pattern is:
  1. Request camera permissions at runtime.
  2. Use `Camera` component for preview and set up a frame processor (if using frame processors) to receive frames.
  3. Convert frames to the input format expected by TensorFlow.js (ImageTensor, ImageData, or native bytes).

Important installation steps (native linking required):

1. Install the package:

```powershell
yarn add react-native-vision-camera
# or
npm install react-native-vision-camera
```

2. On iOS, install pods and add permission descriptions to `Info.plist` (NSCameraUsageDescription).
3. On Android, ensure necessary permissions are in `AndroidManifest.xml` and the app uses CameraX dependencies as required.

Performance tip: avoid copying or serializing frames repeatedly. Use native frame processors and pass frames directly into native inference code or convert in an efficient buffer format.

Security & privacy: always request permissions at runtime and request only the permissions you need. Follow platform guidelines for camera usage and privacy disclosures.

## TensorFlow.js on React Native: install & initialization

This project uses `@tensorflow/tfjs` and `@tensorflow/tfjs-react-native` to run ML models on-device. Key steps to initialize TensorFlow.js in React Native are:

1. Install packages:

```powershell
yarn add @tensorflow/tfjs @tensorflow/tfjs-react-native
# or
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native
```

2. (Optional) If using GPU acceleration with newer RN backends, check for `rn-webgl` or other backends; frequently the recommended backend for `@tensorflow/tfjs-react-native` uses the native C++ bindings and the CPU or GPU delegate available for the platform.

3. Initialize the RN backend early in app startup (for example in a hook or in `App.tsx`) before loading models:

Pseudo-code example (simplified):

```ts
import '@tensorflow/tfjs';
import * as tf from '@tensorflow/tfjs';
import {bundleResourceIO, decodeJpeg} from '@tensorflow/tfjs-react-native';
import {useEffect} from 'react';

useEffect(() => {
  (async () => {
    await tf.ready();
    // initialize RN specific backend
    await require('@tensorflow/tfjs-react-native').registerBackend();
    // Load a model from local bundle or remote
    const modelJson = require('./model/model.json');
    const model = await tf.loadGraphModel(bundleResourceIO(modelJson, [/* weights */]));
  })();
}, []);
```

Notes:

- Use `tf.ready()` to ensure the core library is prepared.
- For models packaged with the app, use `bundleResourceIO` from `@tensorflow/tfjs-react-native` or provide a binary weights loader.
- For converting frames to tensors, use utilities in `@tensorflow/tfjs-react-native` or convert via ImageData polyfills (this repo contains an `ImageDataPolyfill.ts` helper).

## Running the app (Android & iOS)

Android (Windows example using PowerShell):

```powershell
# Start Metro in one terminal
npx react-native start --reset-cache
# In another terminal, build and install on a connected device
npx react-native run-android
```

iOS (macOS only):

```powershell
cd ios; pod install; cd ..
npx react-native run-ios
```

Expo: If you use `expo start`, remember native modules require a bare workflow or prebuild; this project has native Android files so prefer native builds.

## Project structure and important files

- `app/` — top-level app screens and navigation. Key screens include camera, analysis, and results.
- `components/` — reusable UI and camera-related components: `CaptureButton.tsx`, `VideoFrameExtractor.tsx`, `VideoInputSelector.tsx`.
- `services/` — important services:
  - `AnalysisService.ts` — coordinates analysis tasks, queuing frames and calling pose detection.
  - `PoseDetectionService.ts` — encapsulates TensorFlow model loading and inference.
  - `VideoProcessingService.ts` — extracts frames from stored video files for batch analysis.
- `utils/` — helpers like `ImageDataPolyfill.ts`, `imageToImageData.ts` used to convert native frame data into tensors or ImageData that TensorFlow.js accepts.
- `android/` — native Android project files required to build and configure camera and native modules.
- `app.json`, `babel.config.js`, `metro.config.js` — config files for bundler and RN/Expo.

Open these files to find the integration points where camera frames become tensors and are passed to the `PoseDetectionService` for inference.

## How pose detection flows through the code

High-level flow (typical):

1. The user opens the camera screen (`VideoInputSelector.tsx` / camera component).
2. On each preview/frame (via `react-native-vision-camera` frame processor or an explicit capture), the frame is converted to a usable image format.
3. A conversion helper (for example `ImageDataPolyfill.ts` and `imageToImageData.ts`) converts the raw frame to an `ImageData` or tensor.
4. `PoseDetectionService.ts` receives the tensor and runs the TensorFlow model (BlazePose-like). The model returns keypoints and confidence scores.
5. Results are posted to `AnalysisService.ts` for aggregation, metrics calculation, and UI presentation.

This separation (camera -> conversion -> inference -> analysis -> UI) keeps concerns isolated and makes testing and optimization easier.

## Performance tips and mobile ML best practices

- Prefer running inference on a worker or native thread to avoid blocking the UI thread. Use `frame processors` or native modules when possible.
- Resize and normalize images before converting to tensors. Running a model on a lower-resolution input often gives acceptable accuracy with much lower compute.
- Batch or throttle inference calls. For preview UIs, consider running inference every Nth frame.
- Use tf.tidy() to manage memory and avoid memory leaks in TensorFlow.js.
- Reuse allocated tensors where possible instead of creating new ones each frame.

Example TensorFlow memory management:

```ts
const predictions = tf.tidy(() => {
  const input = preprocess(imageTensor);
  return model.predict(input) as tf.Tensor;
});
// use predictions then dispose when done (predictions will be freed by tidy when out of scope)
```

## Common issues and troubleshooting

1. Model won't load or crashes with OOM
   - Ensure weights are correctly bundled or reachable by the app.
   - Reduce input tensor size or use a smaller model.
   - Use `tf.memory()` to inspect memory usage and `tf.tidy()` to auto-dispose.

2. Camera permission denied
   - Check runtime permission requests on Android and `Info.plist` entries on iOS.
   - Use `react-native-permissions` or the camera's permission API to request and verify permissions.

3. Very slow inference on emulator
   - Use a physical device. Emulators are frequently much slower and lack hardware acceleration.

4. Issues using `@tensorflow/tfjs-react-native`
   - Make sure to call `await tf.ready()` before using tf functions and register any RN backends as required.
   - If you see errors about WebGL or missing methods, verify package versions and compatibility with your RN version.

5. Frame format mismatches
   - Confirm the converter functions (`ImageDataPolyfill.ts`, `imageToImageData.ts`) are producing the exact image shape and channel order the model expects (RGB vs BGR, normalized 0-1 vs 0-255).

## Debugging and instrumentation

- Use Chrome Remote Debugger or Flipper for JS debugging, but remember that JS-driven inference may be impacted by debugging overhead.
- Log `tf.memory()` periodically to detect leaks.
- Add performance timers around preprocessing and model inference to identify hotspots.

## Tests

This repository includes a collection of services and utilities that can and should be covered by unit tests. Create Jest tests for:

- Image conversion helpers (ensure output shape and values)
- Pose detection service with a small mock model
- Analysis metrics (aggregation and edge cases)

Use `jest` and `@testing-library/react-native` for component-level tests.

## Contributing

Contributions are welcome. A suggested workflow:

1. Fork the repo and create a branch for your feature/bugfix.
2. Add tests for any new behavior.
3. Run the app and verify functionality on a physical device where required.
4. Open a PR with a clear description of changes and testing steps.

## License

This project does not specify a license file in the repository. Add a `LICENSE` file to make the intended license explicit.

---

## Appendix: Useful snippets

- Request camera permission (Vision Camera + RN):

```ts
import {Camera, useCameraDevices} from 'react-native-vision-camera';
const devices = useCameraDevices();
// Request permissions
await Camera.requestCameraPermission();
```

- Initialize tfjs-react-native and load a bundled model:

```ts
import * as tf from '@tensorflow/tfjs';
import * as tfRN from '@tensorflow/tfjs-react-native';
import {bundleResourceIO} from '@tensorflow/tfjs-react-native';

await tf.ready();
await tfRN.ready();
// If your model is saved in the app bundle (android/app/src/main/assets or iOS resource)
const modelJson = require('./model/model.json');
const weightFiles = [require('./model/group1-shard1of1.bin')];
const model = await tf.loadGraphModel(bundleResourceIO(modelJson, weightFiles));
```

## Completion summary

I added this `README.md` to the project root to provide a complete guide for setup, development, and troubleshooting with an emphasis on `react-native-vision-camera` and TensorFlow.js integration. It includes PowerShell-friendly command examples for Windows and general guidance for macOS/iOS where appropriate.

Next steps (optional):

- Add a LICENSE file.
- Add small example scripts or a `docs/` page that walks through how the `PoseDetectionService.ts` is implemented with code snippets from the project.
- Add unit tests for the image conversion utilities and a smoke test for model loading.
