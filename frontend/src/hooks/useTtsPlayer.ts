import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseTtsPlayerReturn {
  isPlaying: boolean;
  play: (audioUrl: string) => void;
  stop: () => void;
}

export function useTtsPlayer(): UseTtsPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback((audioUrl: string) => {
    // 如果正在播放，先停止（不释放 URL，由调用方管理缓存）
    stop();

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    currentUrlRef.current = audioUrl;

    audio.onended = () => {
      setIsPlaying(false);
    };

    audio.onerror = () => {
      setIsPlaying(false);
    };

    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      setIsPlaying(false);
    });
  }, [stop]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }
    };
  }, []);

  return {
    isPlaying,
    play,
    stop,
  };
}
