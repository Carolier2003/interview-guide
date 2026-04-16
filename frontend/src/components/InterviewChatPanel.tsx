import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import type { InterviewQuestion, InterviewSession } from '../types/interview';
import { Mic, Send, Square, User, Volume2 } from 'lucide-react';

interface Message {
  type: 'interviewer' | 'user';
  content: string;
  category?: string;
  questionIndex?: number;
}

interface InterviewChatPanelProps {
  session: InterviewSession;
  currentQuestion: InterviewQuestion | null;
  messages: Message[];
  answer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  onCompleteEarly: () => void;
  isSubmitting: boolean;
  showCompleteConfirm: boolean;
  onShowCompleteConfirm: (show: boolean) => void;
  isTranscribing?: boolean;
  onPlayTts?: (text: string, messageIndex: number) => void;
  playingTtsMessageIndex?: number | null;
  isRecording?: boolean;
  recordingDuration?: number;
  onToggleRecording?: () => void;
  analyserNode?: AnalyserNode | null;
}

export default function InterviewChatPanel({
  session,
  currentQuestion,
  messages,
  answer,
  onAnswerChange,
  onSubmit,
  isSubmitting,
  onShowCompleteConfirm,
  isTranscribing,
  onPlayTts,
  playingTtsMessageIndex,
  isRecording,
  recordingDuration,
  onToggleRecording,
  analyserNode,
}: InterviewChatPanelProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const progress = useMemo(() => {
    if (!session || !currentQuestion) return 0;
    return ((currentQuestion.questionIndex + 1) / session.totalQuestions) * 100;
  }, [session, currentQuestion]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      onSubmit();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-4xl mx-auto">
      {/* 进度条 - 极简顶部条 */}
      <div className="relative mb-6 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/60 h-2">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* 进度光点 */}
        <motion.div
          className="absolute top-0 bottom-0 w-2 rounded-full bg-white/80 blur-[2px]"
          animate={{ left: `calc(${progress}% - 4px)` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* 进度信息 */}
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            第 {currentQuestion ? currentQuestion.questionIndex + 1 : 0} 题
          </span>
          <span className="text-sm text-slate-400 dark:text-slate-500">
            / {session.totalQuestions}
          </span>
        </div>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {Math.round(progress)}%
        </span>
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col min-h-0">
        <Virtuoso
          ref={virtuosoRef}
          data={messages}
          initialTopMostItemIndex={messages.length - 1}
          followOutput="smooth"
          className="flex-1"
          itemContent={(index, msg) => (
            <div className="pb-5 px-5 first:pt-6 md:px-8">
              <MessageBubble
                message={msg}
                messageIndex={index}
                onPlayTts={onPlayTts}
                playingTtsMessageIndex={playingTtsMessageIndex}
              />
            </div>
          )}
        />

        {/* 输入区域 */}
        <div className="border-t border-slate-100 dark:border-slate-700/60 p-4 md:p-6 bg-slate-50/60 dark:bg-slate-700/20">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={answer}
                onChange={(e) => onAnswerChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你的回答… (Ctrl / Cmd + Enter 提交)"
                className="w-full px-4 py-3.5 pr-10 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/60 resize-none text-sm leading-relaxed"
                rows={3}
                disabled={isSubmitting || isRecording}
              />
              <div className="absolute right-3 bottom-3 text-xs text-slate-400 pointer-events-none">
                ↵
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <motion.button
                onClick={onSubmit}
                disabled={!answer.trim() || isSubmitting || isRecording}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: isSubmitting || !answer.trim() || isRecording ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting || !answer.trim() || isRecording ? 1 : 0.98 }}
              >
                {isSubmitting ? (
                  <motion.div
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </motion.button>
              <motion.button
                onClick={() => onShowCompleteConfirm(true)}
                disabled={isSubmitting || isRecording}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                whileHover={{ scale: isSubmitting || isRecording ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting || isRecording ? 1 : 0.98 }}
              >
                提前交卷
              </motion.button>
            </div>
          </div>

          {/* 语音输入区域 */}
          <div className="mt-3 flex items-center gap-3">
            <motion.button
              onClick={onToggleRecording}
              disabled={isSubmitting || isTranscribing}
              className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all select-none ${
                isRecording
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              whileTap={{ scale: isSubmitting || isTranscribing ? 1 : 0.95 }}
            >
              {isRecording ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>结束录音 {recordingDuration ? `${recordingDuration}s` : ''}</span>
                </>
              ) : isTranscribing ? (
                <>
                  <motion.div
                    className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span>识别中…</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>点击录音</span>
                </>
              )}
            </motion.button>

            {/* 录音波形可视化 */}
            {isRecording && analyserNode && (
              <WaveformVisualizer analyserNode={analyserNode} />
            )}

            <span className="text-xs text-slate-400 dark:text-slate-500">
              {isRecording ? '再次点击结束录音并自动识别' : '点击开始语音输入'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 波形可视化组件
function WaveformVisualizer({ analyserNode }: { analyserNode: AnalyserNode }) {
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

// 消息气泡组件
function MessageBubble({
  message,
  messageIndex,
  onPlayTts,
  playingTtsMessageIndex,
}: {
  message: Message;
  messageIndex: number;
  onPlayTts?: (text: string, messageIndex: number) => void;
  playingTtsMessageIndex?: number | null;
}) {
  const isPlaying = playingTtsMessageIndex === messageIndex;

  if (message.type === 'interviewer') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3"
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          <User className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              面试官
            </span>
            {message.category && (
              <span className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                {message.category}
              </span>
            )}
            {onPlayTts && (
              <motion.button
                onClick={() => onPlayTts(message.content, messageIndex)}
                className={`ml-auto inline-flex items-center justify-center rounded-full p-1.5 transition-colors ${
                  isPlaying
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300'
                }`}
                whileTap={{ scale: 0.9 }}
                title={isPlaying ? '播放中' : '语音播报'}
              >
                <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-pulse' : ''}`} />
              </motion.button>
            )}
          </div>
          <div className="inline-block max-w-[92%] rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 p-4 text-slate-800 dark:text-slate-100 leading-relaxed text-sm">
            {message.content}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 justify-end"
    >
      <div className="flex-1 max-w-[85%] flex flex-col items-end">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          我
        </div>
        <div className="inline-block rounded-2xl rounded-tr-none bg-primary-600 text-white p-4 leading-relaxed text-sm">
          {message.content}
        </div>
      </div>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-500 text-white">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    </motion.div>
  );
}
