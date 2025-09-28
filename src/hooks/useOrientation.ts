import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

export type Orientation = 'portrait' | 'landscape';

export function useOrientation() {
  const initial = Dimensions.get('window');
  const [orientation, setOrientation] = useState<Orientation>(() => (initial.width > initial.height ? 'landscape' : 'portrait'));
  const [screen, setScreen] = useState(initial);

  useEffect(() => {
    const handler = ({ window }: { window: { width: number; height: number; scale?: number; fontScale?: number } }) => {
      const w = { width: window.width, height: window.height, scale: window.scale ?? 1, fontScale: window.fontScale ?? 1 } as any;
      setScreen(w);
      setOrientation(window.width > window.height ? 'landscape' : 'portrait');
    };

    const subscription = Dimensions.addEventListener('change', handler as any);
    return () => subscription?.remove();
  }, []);

  return { orientation, screen };
}

export default useOrientation;