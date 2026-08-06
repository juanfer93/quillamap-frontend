import { useEffect, useRef } from 'react';
import { Platform, Vibration } from 'react-native';

interface UseSecurityProximityAlertOptions {
  enabled: boolean;
  shouldAlert: boolean;
}

const playWebBeep = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const audioWindow = window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextClass = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = 880;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.18);
};

export const useSecurityProximityAlert = ({
  enabled,
  shouldAlert,
}: UseSecurityProximityAlertOptions) => {
  const didAlertRef = useRef(false);

  useEffect(() => {
    if (!enabled || !shouldAlert) {
      didAlertRef.current = false;
      return;
    }

    if (didAlertRef.current) {
      return;
    }

    didAlertRef.current = true;

    if (Platform.OS === 'web') {
      playWebBeep();
      return;
    }

    Vibration.vibrate(180);
  }, [enabled, shouldAlert]);
};
