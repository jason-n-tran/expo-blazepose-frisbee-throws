import React, { useCallback, useEffect, useState } from 'react'
import type { ImageRequireSource } from 'react-native'
import { Linking } from 'react-native'
import { StyleSheet, View, Text, Image } from 'react-native'
import type { CameraPermissionStatus } from 'react-native-vision-camera'
import { Camera } from 'react-native-vision-camera'
import { CONTENT_SPACING, SAFE_AREA_PADDING } from '../../Constants'
import { useRouter } from 'expo-router'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const BANNER_IMAGE = require('@/assets/11.png') as ImageRequireSource

export default function PermissionsPage(): React.ReactElement {
  const router = useRouter()
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<CameraPermissionStatus>(() => Camera.getCameraPermissionStatus())
  const [microphonePermissionStatus, setMicrophonePermissionStatus] = useState<CameraPermissionStatus>(() => Camera.getMicrophonePermissionStatus())

  const requestMicrophonePermission = useCallback(async () => {
    const currentStatus = Camera.getMicrophonePermissionStatus()
    
    // If already denied, go straight to settings
    if (currentStatus === 'denied') {
      await Linking.openSettings()
      return
    }
    
    const permission = await Camera.requestMicrophonePermission()
    setMicrophonePermissionStatus(permission)
    
    // Only open settings if user explicitly denied (not on first request)
    if (permission === 'denied' && currentStatus === 'not-determined') {
      await Linking.openSettings()
    }
  }, [])

  const requestCameraPermission = useCallback(async () => {
    const currentStatus = Camera.getCameraPermissionStatus()
    
    // If already denied, go straight to settings
    if (currentStatus === 'denied') {
      await Linking.openSettings()
      return
    }
    
    const permission = await Camera.requestCameraPermission()
    setCameraPermissionStatus(permission)
    
    // Only open settings if user explicitly denied (not on first request)
    if (permission === 'denied' && currentStatus === 'not-determined') {
      await Linking.openSettings()
    }
  }, [])

  useEffect(() => {
    // Only camera permission is required, microphone is optional
    if (cameraPermissionStatus === 'granted') {
      router.replace('/(tabs)')
    }
  }, [cameraPermissionStatus, router])

  return (
    <View style={styles.container}>
      <Image source={BANNER_IMAGE} style={styles.banner} />
      <Text style={styles.welcome}>Welcome to{'\n'}Vision Camera.</Text>
      <View style={styles.permissionsContainer}>
        {cameraPermissionStatus !== 'granted' && (
          <Text style={styles.permissionText}>
            Vision Camera needs <Text style={styles.bold}>Camera permission</Text>.{' '}
            <Text style={styles.hyperlink} onPress={requestCameraPermission}>
              Grant
            </Text>
          </Text>
        )}
        {microphonePermissionStatus !== 'granted' && cameraPermissionStatus === 'granted' && (
          <Text style={styles.permissionText}>
            Vision Camera can use <Text style={styles.bold}>Microphone permission</Text> for video recording.{' '}
            <Text style={styles.hyperlink} onPress={requestMicrophonePermission}>
              Grant
            </Text>
            {' or '}
            <Text style={styles.hyperlink} onPress={() => router.replace('/(tabs)')}>
              Skip
            </Text>
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  welcome: {
    fontSize: 38,
    fontWeight: 'bold',
    maxWidth: '80%',
  },
  banner: {
    position: 'absolute',
    opacity: 0.4,
    bottom: 0,
    left: 0,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    ...SAFE_AREA_PADDING,
  },
  permissionsContainer: {
    marginTop: CONTENT_SPACING * 2,
  },
  permissionText: {
    fontSize: 17,
  },
  hyperlink: {
    color: '#007aff',
    fontWeight: 'bold',
  },
  bold: {
    fontWeight: 'bold',
  },
})