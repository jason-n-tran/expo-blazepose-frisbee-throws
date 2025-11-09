import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { VideoInputSelector } from '@/components/VideoInputSelector';
import * as ImagePicker from 'expo-image-picker';

export default function InputSelectionScreen() {
  const router = useRouter();
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelectVideo = async () => {
    if (isSelecting) return;
    
    setIsSelecting(true);
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant media library access to select videos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker with video filter
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        
        // Validate video format
        const uri = video.uri;
        const isValidFormat = uri.toLowerCase().endsWith('.mp4') || 
                             uri.toLowerCase().endsWith('.mov') ||
                             uri.toLowerCase().includes('mp4') ||
                             uri.toLowerCase().includes('mov');
        
        if (!isValidFormat) {
          Alert.alert(
            'Invalid Format',
            'Please select a video in MP4 or MOV format.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Check video duration if available
        if (video.duration && video.duration > 60000) { // duration in ms
          Alert.alert(
            'Video Too Long',
            'Please select a video that is 60 seconds or shorter.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Navigate to processing screen with video URI
        router.push({
          pathname: '/analysis/processing',
          params: { videoUri: uri }
        });
      }
    } catch (error) {
      console.error('Error selecting video:', error);
      Alert.alert(
        'Error',
        'Failed to select video. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <VideoInputSelector onSelectPressed={handleSelectVideo} />
  );
}
