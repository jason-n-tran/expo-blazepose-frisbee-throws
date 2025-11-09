import { NativeTabs, Label, Icon, VectorIcon } from 'expo-router/unstable-native-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Camera } from 'react-native-vision-camera'
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function TabsHost() {
    const cameraPermission = Camera.getCameraPermissionStatus()
    
    // Only require camera permission - microphone is optional
    const showPermissionsPage = cameraPermission !== 'granted'
    
    // If permissions aren't granted, don't render tabs at all - just render permissions page
    if (showPermissionsPage) {
        return (
            <NativeTabs>
                <NativeTabs.Trigger name="permissions" />
            </NativeTabs>
        )
    }
    
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
