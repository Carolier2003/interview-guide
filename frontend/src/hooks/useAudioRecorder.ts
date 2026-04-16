import { useCallback, useRef, useState } from 'react';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  recordingDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  reset: () => void;
  error: string | null;
  analyserNode: AnalyserNode | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const reset = useCallback(() => {
    setAudioBlob(null);
    setRecordingDuration(0);
    setError(null);
    chunksRef.current = [];

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAnalyserNode(null);
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      // stream 会在 onstop 中关闭
    } else {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsRecording(false);
    }

    // 关闭 AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAnalyserNode(null);
  }, []);

  const startRecording = useCallback(async () => {
    reset();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 创建 AudioContext 和 AnalyserNode 用于波形可视化
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setAnalyserNode(analyser);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalMimeType = mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalMimeType });

        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setIsRecording(false);

        if (blob.size > 500) {
          setAudioBlob(blob);
        } else {
          setError('录音时间太短，请重试');
        }
      };

      recorder.onerror = () => {
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setIsRecording(false);
        setError('录音出现错误，请重试');

        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
        analyserRef.current = null;
        setAnalyserNode(null);
      };

      recorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();

      timerRef.current = window.setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('麦克风权限被拒绝，请在浏览器设置中允许使用麦克风');
      } else {
        setError('无法启动录音，请检查麦克风设备');
      }
      setIsRecording(false);
    }
  }, [reset]);

  return {
    isRecording,
    audioBlob,
    recordingDuration,
    startRecording,
    stopRecording,
    reset,
    error,
    analyserNode,
  };
}
