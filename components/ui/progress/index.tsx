import React from 'react';
import { View } from 'react-native';
import type { ViewProps } from 'react-native';

interface ProgressProps extends ViewProps {
  value: number; // 0-100
  children?: React.ReactNode;
}

export function Progress({ value, className = '', children, ...props }: ProgressProps) {
  return (
    <View className={`rounded-full overflow-hidden ${className}`} {...props}>
      {children}
    </View>
  );
}

interface ProgressFilledTrackProps extends ViewProps {
  children?: React.ReactNode;
}

export function ProgressFilledTrack({ className = '', style, ...props }: ProgressFilledTrackProps) {
  return (
    <View 
      className={`h-full rounded-full ${className}`}
      style={[{ width: '100%' }, style]}
      {...props}
    />
  );
}
