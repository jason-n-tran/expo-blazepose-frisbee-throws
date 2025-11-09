/**
 * ErrorDialog Component
 * 
 * Displays user-friendly error messages with retry options using Gluestack UI AlertDialog
 */

import React from 'react';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  ButtonText,
  Heading,
  Text,
} from '@/components/ui';
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
    <AlertDialog isOpen={isOpen} onClose={onClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent className="bg-white dark:bg-gray-900">
        <AlertDialogHeader>
          <Heading size="lg" className="text-gray-900 dark:text-white">
            {title}
          </Heading>
        </AlertDialogHeader>
        
        <AlertDialogBody>
          <Text className="text-gray-700 dark:text-gray-300 mb-3">
            {message}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm">
            {suggestion}
          </Text>
        </AlertDialogBody>
        
        <AlertDialogFooter className="flex-row gap-3">
          <Button
            variant="outline"
            onPress={onClose}
            className="flex-1"
          >
            <ButtonText>Close</ButtonText>
          </Button>
          
          {showRetry && canRetry && onRetry && (
            <Button
              onPress={() => {
                onClose();
                onRetry();
              }}
              className="flex-1"
            >
              <ButtonText>Retry</ButtonText>
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
