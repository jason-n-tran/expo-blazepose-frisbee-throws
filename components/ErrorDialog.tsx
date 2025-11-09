/**
 * ErrorDialog Component
 * 
 * Displays user-friendly error messages with retry options using React Native Modal
 */

import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { AnalysisError } from '@/types/errors';

interface ErrorDialogProps {
  isOpen: boolean;
  error: AnalysisError | Error | null;
  onClose: () => void;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorDialog({
  isOpen,
  error,
  onClose,
  onRetry,
  showRetry = true,
}: ErrorDialogProps) {
  if (!error) return null;

  const isAnalysisError = error instanceof AnalysisError;
  const title = 'Error';
  const message = isAnalysisError ? error.getUserMessage() : error.message;
  const suggestion = isAnalysisError ? error.getSuggestedAction() : 'Please try again.';
  const canRetry = isAnalysisError ? error.recoverable : true;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center p-6">
        <View className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md">
          {/* Header */}
          <Text className="text-gray-900 dark:text-white text-xl font-bold mb-4">
            {title}
          </Text>
          
          {/* Body */}
          <Text className="text-gray-700 dark:text-gray-300 text-base mb-3">
            {message}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            {suggestion}
          </Text>
          
          {/* Footer */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg py-3 items-center"
            >
              <Text className="text-gray-900 dark:text-white font-semibold">
                Close
              </Text>
            </Pressable>
            
            {showRetry && canRetry && onRetry && (
              <Pressable
                onPress={() => {
                  onClose();
                  onRetry();
                }}
                className="flex-1 bg-blue-600 rounded-lg py-3 items-center"
              >
                <Text className="text-white font-semibold">
                  Retry
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
