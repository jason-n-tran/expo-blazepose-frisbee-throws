import { NativeTabs, Label, Icon, VectorIcon } from 'expo-router/unstable-native-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Camera } from 'react-native-vision-camera'
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function TabsHost() {
    const cameraPermission = Camera.getCameraPermissionStatus()
    const microphonePermission = Camera.getMicrophonePermissionStatus()
    console.log(`Re-rendering Navigator. Camera: ${cameraPermission} | Microphone: ${microphonePermission}`)
    
    const showPermissionsPage = cameraPermission !== 'granted' || microphonePermission === 'not-determined'
    const router = useRouter();
    const segments = useSegments();

    // Handle navigation based on initialization state
    useEffect(() => {
        console.log('[Layout] ===== Navigation Effect Triggered =====');
        console.log('[Layout] segments:', segments);
        
        // Use setTimeout to ensure navigation happens after render
        const timer = setTimeout(() => {
        if (showPermissionsPage) {
            // Navigate to model setup screen
            if (!segments.includes('permissions')) {
            console.log('[Layout] → Navigating to permissions page');
            router.replace('/permissions');
            } else {
            console.log('[Layout] Already on permissions screen');
            }
        } else {
            console.log('[Layout] No navigation action needed');
        }
        }, 0);

        return () => clearTimeout(timer);
    }, [showPermissionsPage, segments, router]);
    return (
        <NativeTabs minimizeBehavior="onScrollDown">
            <NativeTabs.Trigger name="index">
                <Label>Home</Label>
                {Platform.select({
                    ios: <Icon sf="house.fill" />,
                    android: <Icon src={<VectorIcon family={Ionicons} name="home" />} />,
                })}
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="settings">
                {Platform.select({
                    ios: <Icon sf="house.fill" />,
                    android: <Icon src={<VectorIcon family={Ionicons} name="settings-outline" />} />,
                })}
                <Label>Settings</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="feed">
                {Platform.select({
                    ios: <Icon sf="house.fill" />,
                    android: <Icon src={<VectorIcon family={Ionicons} name="list" />} />,
                })}
                <Label>Feed</Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    );
};
