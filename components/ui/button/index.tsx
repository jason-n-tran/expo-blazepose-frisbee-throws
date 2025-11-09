import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { PressableProps, TextProps, ViewProps } from 'react-native';

interface ButtonProps extends PressableProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'solid' | 'outline';
  children?: React.ReactNode;
}

export function Button({ 
  size = 'md', 
  variant = 'solid',
  className = '',
  children,
  ...props 
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
    xl: 'px-10 py-5',
  };

  const variantClasses = {
    solid: 'bg-primary-500',
    outline: 'border-2 border-primary-500 bg-transparent',
  };

  return (
    <Pressable
      className={`rounded-lg items-center justify-center flex-row ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </Pressable>
  );
}

interface ButtonTextProps extends TextProps {
  children?: React.ReactNode;
}

export function ButtonText({ className = '', children, ...props }: ButtonTextProps) {
  return (
    <Text className={`text-white font-semibold ${className}`} {...props}>
      {children}
    </Text>
  );
}

interface ButtonIconProps extends ViewProps {
  as?: any;
  name?: string;
  size?: number;
  color?: string;
}

export function ButtonIcon({ as: IconComponent, name, size = 20, color = 'white', ...props }: ButtonIconProps) {
  if (!IconComponent || !name) {
    return null;
  }
  
  return <IconComponent name={name} size={size} color={color} {...props} />;
}
