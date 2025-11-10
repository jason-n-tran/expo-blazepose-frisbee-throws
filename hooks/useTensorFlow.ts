/**
 * useTensorFlow Hook
 * 
 * Initializes TensorFlow.js for React Native
 * Must be called before using any TensorFlow models
 */

import { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { Platform } from 'react-native';

export function useTensorFlow() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initTensorFlow() {
      try {
        console.log('[TensorFlow] Initializing...');
        
        // Only initialize on native platforms
        if (Platform.OS !== 'web') {
          await tf.ready();
          console.log('[TensorFlow] Backend:', tf.getBackend());
        } else {
          // Web platform uses default backend
          await tf.ready();
        }
        
        if (mounted) {
          setIsReady(true);
          console.log('[TensorFlow] Ready');
        }
      } catch (err) {
        console.error('[TensorFlow] Initialization error:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize TensorFlow'));
        }
      }
    }

    initTensorFlow();

    return () => {
      mounted = false;
    };
  }, []);

  return { isReady, error };
}
