/**
 * ComparisonViewer Component
 * 
 * Displays side-by-side video comparison with synchronized playback,
 * pose landmark overlays, and segment highlighting.
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import Svg, { Circle, Line } from 'react-native-svg';
import { PoseLandmarkData, BodySegment, NormalizedLandmark, PoseLandmarkIndex } from '@/types/pose';

interface ComparisonViewerProps {
  userVideoUri: string;
  goldStandardVideoUri: string;
  userLandmarks: PoseLandmarkData[];
  goldStandardLandmarks: PoseLandmarkData[];
  highlightedSegments?: BodySegment[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_WIDTH = SCREEN_WIDTH / 2;
const VIDEO_HEIGHT = VIDEO_WIDTH * (16 / 9); // 16:9 aspect ratio

export function ComparisonViewer({
  userVideoUri,
  goldStandardVideoUri,
  userLandmarks,
  goldStandardLandmarks,
  highlightedSegments = [],
}: ComparisonViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [isGoldLoaded, setIsGoldLoaded] = useState(false);

  // Create video players
  const userPlayer = useVideoPlayer(userVideoUri, (player) => {
    player.loop = false;
    player.muted = false;
    player.playbackRate = playbackSpeed;
  });

  const goldPlayer = useVideoPlayer(goldStandardVideoUri, (player) => {
    player.loop = false;
    player.muted = true; // Mute gold standard to avoid audio overlap
    player.playbackRate = playbackSpeed;
  });

  // Monitor loading state
  useEffect(() => {
    const checkLoadingState = setInterval(() => {
      if (userPlayer && userPlayer.duration > 0 && !isUserLoaded) {
        setIsUserLoaded(true);
        setDuration(userPlayer.duration);
      }
      if (goldPlayer && goldPlayer.duration > 0 && !isGoldLoaded) {
        setIsGoldLoaded(true);
      }
    }, 100);

    return () => clearInterval(checkLoadingState);
  }, [userPlayer, goldPlayer, isUserLoaded, isGoldLoaded]);

  // Sync playback state
  useEffect(() => {
    if (!isUserLoaded || !isGoldLoaded) return;

    if (isPlaying) {
      userPlayer.play();
      goldPlayer.play();
    } else {
      userPlayer.pause();
      goldPlayer.pause();
    }
  }, [isPlaying, isUserLoaded, isGoldLoaded]);

  // Sync playback speed
  useEffect(() => {
    if (userPlayer) {
      userPlayer.playbackRate = playbackSpeed;
    }
    if (goldPlayer) {
      goldPlayer.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Track current time from user player
  useEffect(() => {
    const interval = setInterval(() => {
      if (userPlayer && isUserLoaded) {
        const newTime = userPlayer.currentTime;
        setCurrentTime(newTime);
        
        // Sync gold player if drift detected (>200ms)
        if (goldPlayer && isGoldLoaded) {
          const drift = Math.abs(goldPlayer.currentTime - newTime);
          if (drift > 0.2) {
            goldPlayer.currentTime = newTime;
          }
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [userPlayer, goldPlayer, isUserLoaded, isGoldLoaded]);

  // Handle play/pause toggle
  const togglePlayback = () => {
    if (!isUserLoaded || !isGoldLoaded) return;
    setIsPlaying(!isPlaying);
  };

  // Handle seek - synchronize both players
  const handleSeek = (time: number) => {
    if (!isUserLoaded || !isGoldLoaded) return;
    
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      setIsPlaying(false);
    }

    // Seek both players to same timestamp
    userPlayer.currentTime = time;
    goldPlayer.currentTime = time;
    setCurrentTime(time);

    // Resume playback if it was playing
    if (wasPlaying) {
      setTimeout(() => setIsPlaying(true), 100);
    }
  };

  // Cycle through playback speeds
  const cyclePlaybackSpeed = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  // Get current frame landmarks based on timestamp
  const getCurrentFrameLandmarks = (
    landmarks: PoseLandmarkData[],
    timestamp: number
  ): NormalizedLandmark[] | null => {
    if (landmarks.length === 0) return null;

    // Find the closest frame to current timestamp (in seconds)
    const timestampMs = timestamp * 1000;
    let closestFrame = landmarks[0];
    let minDiff = Math.abs(landmarks[0].timestamp - timestampMs);

    for (const frame of landmarks) {
      const diff = Math.abs(frame.timestamp - timestampMs);
      if (diff < minDiff) {
        minDiff = diff;
        closestFrame = frame;
      }
    }

    return closestFrame.landmarks;
  };

  const userCurrentLandmarks = getCurrentFrameLandmarks(userLandmarks, currentTime);
  const goldCurrentLandmarks = getCurrentFrameLandmarks(goldStandardLandmarks, currentTime);

  return (
    <View className="flex-1 bg-black">
      {/* Video Players */}
      <View className="flex-row">
        {/* User Video */}
        <View style={{ width: VIDEO_WIDTH, height: VIDEO_HEIGHT }}>
          <VideoView
            player={userPlayer}
            style={StyleSheet.absoluteFill}
            nativeControls={false}
          />
          {userCurrentLandmarks && (
            <PoseLandmarkOverlay
              landmarks={userCurrentLandmarks}
              width={VIDEO_WIDTH}
              height={VIDEO_HEIGHT}
              color="#00FF00"
              highlightedSegments={highlightedSegments}
            />
          )}
        </View>

        {/* Gold Standard Video */}
        <View style={{ width: VIDEO_WIDTH, height: VIDEO_HEIGHT }}>
          <VideoView
            player={goldPlayer}
            style={StyleSheet.absoluteFill}
            nativeControls={false}
          />
          {goldCurrentLandmarks && (
            <PoseLandmarkOverlay
              landmarks={goldCurrentLandmarks}
              width={VIDEO_WIDTH}
              height={VIDEO_HEIGHT}
              color="#FFD700"
              highlightedSegments={highlightedSegments}
            />
          )}
        </View>
      </View>

      {/* Playback Controls */}
      <View className="p-4 bg-gray-900">
        {/* Loading indicator */}
        {(!isUserLoaded || !isGoldLoaded) && (
          <View className="mb-4 text-white text-center">
            Loading videos...
          </View>
        )}

        {/* Control Buttons */}
        <View className="flex-row justify-center items-center mb-4 gap-4">
          {/* Play/Pause Button */}
          <Pressable
            onPress={togglePlayback}
            disabled={!isUserLoaded || !isGoldLoaded}
            className={`rounded-full py-3 px-6 items-center ${
              isUserLoaded && isGoldLoaded ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <View className="text-white text-lg font-semibold">
              {isPlaying ? 'Pause' : 'Play'}
            </View>
          </Pressable>

          {/* Playback Speed Button */}
          <Pressable
            onPress={cyclePlaybackSpeed}
            disabled={!isUserLoaded || !isGoldLoaded}
            className={`rounded-full py-3 px-6 items-center ${
              isUserLoaded && isGoldLoaded ? 'bg-gray-700' : 'bg-gray-600'
            }`}
          >
            <View className="text-white text-sm font-semibold">
              {playbackSpeed}x
            </View>
          </Pressable>
        </View>

        {/* Seek Bar */}
        <View className="flex-row items-center">
          <View className="text-white text-sm mr-2">
            {formatTime(currentTime)}
          </View>
          <View className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <Pressable
              onPress={(e) => {
                if (!isUserLoaded || !isGoldLoaded) return;
                const { locationX } = e.nativeEvent;
                const seekTime = (locationX / (SCREEN_WIDTH - 80)) * duration;
                handleSeek(seekTime);
              }}
              className="h-full"
            >
              <View
                className="h-full bg-blue-600"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </Pressable>
          </View>
          <View className="text-white text-sm ml-2">
            {formatTime(duration)}
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * PoseLandmarkOverlay Component
 * Renders pose landmarks and skeleton on top of video
 */
interface PoseLandmarkOverlayProps {
  landmarks: NormalizedLandmark[];
  width: number;
  height: number;
  color: string;
  highlightedSegments: BodySegment[];
}

function PoseLandmarkOverlay({
  landmarks,
  width,
  height,
  color,
  highlightedSegments,
}: PoseLandmarkOverlayProps) {
  // Define skeleton connections
  const connections: [number, number][] = [
    // Face
    [PoseLandmarkIndex.LEFT_EYE, PoseLandmarkIndex.RIGHT_EYE],
    [PoseLandmarkIndex.LEFT_EYE, PoseLandmarkIndex.NOSE],
    [PoseLandmarkIndex.RIGHT_EYE, PoseLandmarkIndex.NOSE],
    [PoseLandmarkIndex.LEFT_EAR, PoseLandmarkIndex.LEFT_EYE],
    [PoseLandmarkIndex.RIGHT_EAR, PoseLandmarkIndex.RIGHT_EYE],
    
    // Torso
    [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.RIGHT_SHOULDER],
    [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.LEFT_HIP],
    [PoseLandmarkIndex.RIGHT_SHOULDER, PoseLandmarkIndex.RIGHT_HIP],
    [PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.RIGHT_HIP],
    
    // Left arm
    [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.LEFT_ELBOW],
    [PoseLandmarkIndex.LEFT_ELBOW, PoseLandmarkIndex.LEFT_WRIST],
    [PoseLandmarkIndex.LEFT_WRIST, PoseLandmarkIndex.LEFT_INDEX],
    
    // Right arm
    [PoseLandmarkIndex.RIGHT_SHOULDER, PoseLandmarkIndex.RIGHT_ELBOW],
    [PoseLandmarkIndex.RIGHT_ELBOW, PoseLandmarkIndex.RIGHT_WRIST],
    [PoseLandmarkIndex.RIGHT_WRIST, PoseLandmarkIndex.RIGHT_INDEX],
    
    // Left leg
    [PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.LEFT_KNEE],
    [PoseLandmarkIndex.LEFT_KNEE, PoseLandmarkIndex.LEFT_ANKLE],
    [PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.LEFT_FOOT_INDEX],
    
    // Right leg
    [PoseLandmarkIndex.RIGHT_HIP, PoseLandmarkIndex.RIGHT_KNEE],
    [PoseLandmarkIndex.RIGHT_KNEE, PoseLandmarkIndex.RIGHT_ANKLE],
    [PoseLandmarkIndex.RIGHT_ANKLE, PoseLandmarkIndex.RIGHT_FOOT_INDEX],
  ];

  // Check if a landmark should be highlighted
  const isHighlighted = (index: number): boolean => {
    if (highlightedSegments.length === 0) return false;

    const segmentLandmarks: Record<BodySegment, number[]> = {
      shoulder: [PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.RIGHT_SHOULDER],
      elbow: [PoseLandmarkIndex.LEFT_ELBOW, PoseLandmarkIndex.RIGHT_ELBOW],
      wrist: [PoseLandmarkIndex.LEFT_WRIST, PoseLandmarkIndex.RIGHT_WRIST],
      hip: [PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.RIGHT_HIP],
      knee: [PoseLandmarkIndex.LEFT_KNEE, PoseLandmarkIndex.RIGHT_KNEE],
      ankle: [PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.RIGHT_ANKLE],
    };

    for (const segment of highlightedSegments) {
      if (segmentLandmarks[segment]?.includes(index)) {
        return true;
      }
    }

    return false;
  };

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Draw skeleton connections */}
      {connections.map(([startIdx, endIdx], index) => {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];

        if (!start || !end) return null;

        const x1 = start.x * width;
        const y1 = start.y * height;
        const x2 = end.x * width;
        const y2 = end.y * height;

        const highlighted = isHighlighted(startIdx) || isHighlighted(endIdx);

        return (
          <Line
            key={`line-${index}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={highlighted ? '#FF0000' : color}
            strokeWidth={highlighted ? 3 : 2}
            opacity={0.8}
          />
        );
      })}

      {/* Draw landmark points */}
      {landmarks.map((landmark, index) => {
        if (!landmark || landmark.visibility === 0) return null;

        const x = landmark.x * width;
        const y = landmark.y * height;
        const highlighted = isHighlighted(index);

        return (
          <Circle
            key={`point-${index}`}
            cx={x}
            cy={y}
            r={highlighted ? 6 : 4}
            fill={highlighted ? '#FF0000' : color}
            opacity={0.9}
          />
        );
      })}
    </Svg>
  );
}

/**
 * Format time in MM:SS format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
