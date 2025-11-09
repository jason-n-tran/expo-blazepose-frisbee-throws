import React, { useCallback, useMemo, useState } from 'react'
import { StyleSheet, View, ActivityIndicator, Image, Text } from 'react-native'
import { VideoView, useVideoPlayer } from 'expo-video'
import { SAFE_AREA_PADDING } from '../Constants'
import { useIsForeground } from '@/hooks/useIsForeground'
import { PressableOpacity } from 'react-native-pressable-opacity'
import IonIcon from '@expo/vector-icons/Ionicons'
import { Alert } from 'react-native'
import * as MediaLibrary from 'expo-media-library'
import { StatusBarBlurBackground } from '@/components/StatusBarBlurBackground'
import { useIsFocused } from '@react-navigation/core'
import { useRouter, useLocalSearchParams } from 'expo-router'

const requestSavePermission = async (): Promise<boolean> => {
  const { status } = await MediaLibrary.requestPermissionsAsync()
  return status === 'granted'
}

export default function MediaViewer(): React.ReactElement {
  const params = useLocalSearchParams<{ path: string; type: 'photo' | 'video'; fromAnalysis?: string }>()
  const path = params.path as string
  const type = params.type as 'photo' | 'video'
  const fromAnalysis = params.fromAnalysis === 'true'
  const router = useRouter()
  const isForeground = useIsForeground()
  const isScreenFocused = useIsFocused()
  const isVideoPaused = !isForeground || !isScreenFocused
  const [savingState, setSavingState] = useState<'none' | 'saving' | 'saved'>('none')

  React.useEffect(() => {
    console.log('[MediaViewer] Component mounted/updated');
    console.log('[MediaViewer] Path:', path);
    console.log('[MediaViewer] Type:', type);
    console.log('[MediaViewer] From Analysis:', fromAnalysis);
    console.log('[MediaViewer] Should show analyze button:', fromAnalysis && type === 'video');
  }, [path, type, fromAnalysis])

  const source = useMemo(() => (path ? `file://${path}` : ''), [path])
  
  const player = useVideoPlayer(source, (player) => {
    if (type === 'video') {
      player.loop = true
      player.play()
    }
  })

  React.useEffect(() => {
    console.log('MediaViewer params:', { path, type })
  }, [path, type])

  const onImageLoad = useCallback(() => {
    console.log('Image loaded successfully')
  }, [])
  
  const onImageError = useCallback((error: any) => {
    console.error('Image load error:', error)
  }, [])

  const onSavePressed = useCallback(async () => {
    try {
      setSavingState('saving')

      const hasPermission = await requestSavePermission()
      if (!hasPermission) {
        Alert.alert('Permission denied!', 'Vision Camera does not have permission to save the media to your camera roll.')
        return
      }
      await MediaLibrary.saveToLibraryAsync(`file://${path}`)
      setSavingState('saved')
    } catch (e) {
      const message = e instanceof Error ? e.message : JSON.stringify(e)
      setSavingState('none')
      Alert.alert('Failed to save!', `An unexpected error occured while trying to save your ${type}. ${message}`)
    }
  }, [path, type])

  const onAnalyzePressed = useCallback(() => {
    console.log('[MediaViewer] Analyze button pressed');
    console.log('[MediaViewer] Video path:', path);
    console.log('[MediaViewer] Navigating to processing with URI:', `file://${path}`);
    
    router.push({
      pathname: '/analysis/processing',
      params: { videoUri: `file://${path}` }
    })
  }, [path, router])

  React.useEffect(() => {
    if (type === 'video' && player) {
      if (isVideoPaused) {
        player.pause()
      } else {
        player.play()
      }
    }
  }, [isVideoPaused, type, player])

  if (!path) {
    return (
      <View style={styles.emptyContainer}>
        <IonIcon name="images-outline" size={80} color="#ccc" />
        <Text style={styles.emptyText}>No media to display</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {type === 'photo' && (
        <Image 
          source={{ uri: source }} 
          style={StyleSheet.absoluteFill} 
          resizeMode="cover" 
          onLoad={onImageLoad}
          onError={onImageError}
        />
      )}
      {type === 'video' && (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      )}

      <PressableOpacity style={styles.closeButton} onPress={router.back}>
        <IonIcon name="close" size={35} color="white" style={styles.icon} />
      </PressableOpacity>

      <PressableOpacity style={styles.saveButton} onPress={onSavePressed} disabled={savingState !== 'none'}>
        {savingState === 'none' && <IonIcon name="download" size={35} color="white" style={styles.icon} />}
        {savingState === 'saved' && <IonIcon name="checkmark" size={35} color="white" style={styles.icon} />}
        {savingState === 'saving' && <ActivityIndicator color="white" />}
      </PressableOpacity>

      {fromAnalysis && type === 'video' && (
        <PressableOpacity style={styles.analyzeButton} onPress={onAnalyzePressed}>
          <IonIcon name="analytics" size={35} color="white" style={styles.icon} />
        </PressableOpacity>
      )}

      <StatusBarBlurBackground />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  closeButton: {
    position: 'absolute',
    top: SAFE_AREA_PADDING.paddingTop,
    left: SAFE_AREA_PADDING.paddingLeft,
    width: 40,
    height: 40,
  },
  saveButton: {
    position: 'absolute',
    bottom: SAFE_AREA_PADDING.paddingBottom,
    left: SAFE_AREA_PADDING.paddingLeft,
    width: 40,
    height: 40,
  },
  analyzeButton: {
    position: 'absolute',
    bottom: SAFE_AREA_PADDING.paddingBottom,
    right: SAFE_AREA_PADDING.paddingRight,
    width: 40,
    height: 40,
  },
  icon: {
    textShadowColor: 'black',
    textShadowOffset: {
      height: 0,
      width: 0,
    },
    textShadowRadius: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
})
