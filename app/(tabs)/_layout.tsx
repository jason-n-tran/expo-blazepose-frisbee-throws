import { NativeTabs, Label } from 'expo-router/unstable-native-tabs';
import { Ionicons } from '@expo/vector-icons';

export default function TabsHost() {
    return (
        <NativeTabs>
            <NativeTabs.Trigger name="index">
                <Label>Home</Label>
                <Ionicons name="chatbubbles-outline" size={24} color="black" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="settings">
                <Ionicons name="settings-outline" size={24} color="black" />
                <Label>Settings</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="feed">
                <Ionicons name="time-outline" size={24} color="black" />
                <Label>Feed</Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    );
};
