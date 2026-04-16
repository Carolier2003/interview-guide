import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface WaveformVisualizerProps {
  analyserNode: AnalyserNode;
}

export default function WaveformVisualizer({ analyserNode }: WaveformVisualizerProps) {
  const [data, setData] = useState<number[]>(new Array(16).fill(0));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const tick = () => {
      analyserNode.getByteFrequencyData(dataArray);
      // 采样 16 个点用于展示
      const step = Math.floor(bufferLength / 16);
      const values: number[] = [];
      for (let i = 0; i < 16; i++) {
        const v = dataArray[i * step] / 255;
        values.push(v);
      }
      setData(values);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [analyserNode]);

  return (
    <div className="flex items-center gap-[3px] h-6">
      {data.map((v, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-red-400"
          animate={{ height: Math.max(4, v * 20) }}
          transition={{ duration: 0.05 }}
        />
      ))}
    </div>
  );
}
