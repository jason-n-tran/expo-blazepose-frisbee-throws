# Debugging Guide for Navigation and Video Issues

## Changes Made

### 1. Initial Route Fixed
**File**: `app/index.tsx` (NEW)
- Created a root index file that redirects to `/analysis/input-selection`
- This ensures the app always opens to the input-selection screen first

### 2. Fixed expo-file-system Deprecation
**File**: `services/VideoProcessingService.ts`
- Changed from `import * as FileSystem from 'expo-file-system'` to `import { getInfoAsync } from 'expo-file-system/legacy'`
- This fixes the "Method getInfoAsync is deprecated" error when selecting videos

### 3. Fixed isForAnalysis Flag Persistence
**File**: `app/(tabs)/index.tsx`
- Changed from reading params directly to storing in state
- The flag now persists through component re-renders
- Resets after media is captured to prevent affecting future recordings

### 4. Comprehensive Logging Added
Added detailed console logging to track the flow through all screens:

#### Camera Page (`app/(tabs)/index.tsx`)
- Logs when component mounts and params change
- Logs `isForAnalysis` flag status
- Logs media capture events with full details

#### Input Selection (`app/analysis/input-selection.tsx`)
- Logs permission requests and results
- Logs image picker launch and results
- Logs video validation process with full details
- Logs navigation attempts

#### Media Viewer (`app/MediaViewer.tsx`)
- Logs component mount with all params
- Logs whether analyze button should be shown
- Logs analyze button press events

#### Processing Screen (`app/analysis/processing.tsx`)
- Logs component mount and params
- Logs video URI received
- Logs initialization and processing steps

#### Video Processing Service (`services/VideoProcessingService.ts`)
- Logs every step of video validation
- Logs file existence checks
- Logs file info details
- Logs duration extraction process
- Logs any errors with full context

## What to Look For in Logs

### Issue 1: App Opening to Wrong Screen
**Expected logs on app start:**
```
[ProcessingScreen] Component mounted
[ProcessingScreen] Params: {...}
```

If you see camera logs instead, the initial route isn't working.

### Issue 2: Analyze Button Not Working After Recording
**Expected flow:**
1. User clicks "Record New Video" on input-selection
2. Camera page logs: `[CameraPage] Is for analysis: true`
3. After recording: `[CameraPage] Media captured!` with `Is for analysis: true`
4. MediaViewer logs: `[MediaViewer] From Analysis: true` and `Should show analyze button: true`
5. User clicks analyze button: `[MediaViewer] Analyze button pressed`
6. Processing screen logs: `[ProcessingScreen] Component mounted`

**If analyze button doesn't appear:**
- Check MediaViewer logs for `From Analysis: false` (means flag wasn't passed correctly)
- Check CameraPage logs for `Is for analysis: false` (means param wasn't received)

### Issue 3: Select Existing Video Fails
**Expected flow:**
1. User clicks "Select Existing Video"
2. `[InputSelection] handleSelectVideo called`
3. `[InputSelection] Permission status: granted`
4. `[InputSelection] Image picker result: {...}` (should show selected video details)
5. `[InputSelection] Selected video URI: ...`
6. `[VideoProcessingService] validateVideo called with URI: ...`
7. `[VideoProcessingService] File info: {...}` (should show exists: true)
8. `[VideoProcessingService] Getting video duration...`
9. `[VideoProcessingService] Duration retrieved: X`
10. `[InputSelection] Validation result: { isValid: true, duration: X }`
11. `[InputSelection] Navigating to processing screen...`

**Common failure points:**
- **File doesn't exist**: Check if URI format is correct (should start with `file://` or content URI)
- **Can't read duration**: Audio.Sound.createAsync might fail - check the error message
- **Format not supported**: Check file extension in logs

## Testing Steps

1. **Test Initial Route:**
   - Close and restart the app
   - First screen should be "Analysis" with "Analyze Your Throw" title
   - Should see input-selection logs, not camera logs

2. **Test Record Flow:**
   - Click "Record New Video"
   - Check logs for `forAnalysis: true` param
   - Record a video
   - Check MediaViewer logs for `fromAnalysis: true`
   - Verify analyze button (analytics icon) appears in bottom right
   - Click analyze button
   - Should navigate to processing screen

3. **Test Select Video Flow:**
   - Click "Select Existing Video"
   - Select a video from gallery
   - Watch logs for validation process
   - If it fails, note the exact error message and which step failed
   - Should navigate to processing screen if successful

## Common Issues and Solutions

### Issue: "Unable to load the video" error
**Possible causes:**
1. Video URI format is wrong (check logs for actual URI)
2. File doesn't exist at that path
3. Audio.Sound can't load the video format
4. Permissions issue reading the file

**Solution:**
- Check `[VideoProcessingService] File info` log - should show `exists: true`
- Check `[VideoProcessingService] Sound status` log - should show `isLoaded: true`
- If file exists but can't load, the format might not be supported by expo-av

### Issue: Analyze button doesn't appear
**Possible causes:**
1. `fromAnalysis` param not being passed correctly
2. Video type is 'photo' instead of 'video'

**Solution:**
- Check MediaViewer logs for `From Analysis` and `Should show analyze button`
- Verify camera logs show `Is for analysis: true` before recording

### Issue: App still opens to camera
**Possible causes:**
1. Expo Router cache issue
2. Build needs to be refreshed

**Solution:**
- Clear app cache and restart
- Run `npm start -- --clear` to clear Metro bundler cache
- Rebuild the app if necessary
