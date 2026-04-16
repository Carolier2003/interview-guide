import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { InterviewQuestion, InterviewSession } from '../types/interview';
import { Mic, Pause, Play, SkipForward, LogOut, Volume2, Radio, RotateCcw } from 'lucide-react';
import WaveformVisualizer from './WaveformVisualizer';

export type RealtimePhase =
  | 'tts'
  | 'prep'
  | 'recording'
  | 'transcribing'
  | 'submitting'
  | 'completed';

interface InterviewRealtimePanelProps {
  session: InterviewSession;
  currentQuestion: InterviewQuestion;
  phase: RealtimePhase;
  prepCountdown: number;
  recordingCountdown: number;
  recordingDuration: number;
  analyserNode: AnalyserNode | null;
  onStopRecording: () => void;
  onSkipQuestion: () => void;
  onPauseInterview: () => void;
  onResumeInterview: () => void;
  onExitInterview: () => void;
  onRetry?: () => void;
  isPaused: boolean;
  error: string | null;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function InterviewRealtimePanel({
  session,
  currentQuestion,
  phase,
  prepCountdown,
  recordingCountdown,
  recordingDuration,
  analyserNode,
  onStopRecording,
  onSkipQuestion,
  onPauseInterview,
  onResumeInterview,
  onExitInterview,
  onRetry,
  isPaused,
  error,
}: InterviewRealtimePanelProps) {
  const progress = ((currentQuestion.questionIndex + 1) / session.totalQuestions) * 100;
  const reducedMotion = useReducedMotion();

  const recordingProgress = recordingDuration / (recordingDuration + recordingCountdown);
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference * (1 - recordingProgress);

  const transitionFast = reducedMotion
    ? { duration: 0 }
    : { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

  return (
    <div className="relative flex flex-col h-[calc(100vh-180px)] max-w-4xl mx-auto">
      {/* 顶部：进度条 + 题号 + 模式标签 */}
      <div className="mb-5">
        <div className="relative mb-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/60 h-2">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              第 {currentQuestion.questionIndex + 1} 题
            </span>
            <span className="text-sm text-slate-400 dark:text-slate-500">/ {session.totalQuestions}</span>
            <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
              <Radio className="h-3 w-3" />
              实时模式
            </span>
          </div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* 中部：题目卡片 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          key={currentQuestion.questionIndex}
          initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={transitionFast}
          className="w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 md:p-10 shadow-xl shadow-slate-200/40 dark:shadow-none"
        >
          <div className="mb-4 flex items-center gap-2">
            {currentQuestion.category && (
              <span className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                {currentQuestion.category}
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-medium leading-relaxed text-slate-900 dark:text-slate-100">
            {currentQuestion.question}
          </h2>
        </motion.div>

        {/* 下部：Phase 状态区 */}
        <div className="mt-8 w-full max-w-3xl">
          <AnimatePresence mode="wait">
            {phase === 'tts' && (
              <motion.div
                key="tts"
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="flex items-center gap-3 rounded-full border border-primary-200 bg-primary-50 px-5 py-2.5 text-primary-700 dark:border-primary-900/50 dark:bg-primary-950/30 dark:text-primary-400">
                  {!reducedMotion && (
                    <motion.span
                      className="relative flex h-3 w-3"
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-primary-500" />
                    </motion.span>
                  )}
                  {reducedMotion && (
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-primary-500" />
                  )}
                  <span className="text-sm font-medium">AI 正在朗读题目…</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Volume2 className="h-3.5 w-3.5" />
                  请认真听题
                </div>
              </motion.div>
            )}

            {phase === 'prep' && (
              <motion.div
                key="prep"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center"
                aria-live="polite"
                aria-atomic="true"
                role="status"
              >
                <div className="text-6xl font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                  {prepCountdown}
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">准备时间，请思考答案</p>
              </motion.div>
            )}

            {phase === 'recording' && (
              <motion.div
                key="recording"
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 dark:border-red-900/40 dark:bg-red-950/20">
                  <div className="relative flex h-12 w-12 items-center justify-center">
                    {/* 圆形进度环 */}
                    <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48">
                      <circle
                        cx="24"
                        cy="24"
                        r="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-red-200 dark:text-red-900/40"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="text-red-500 transition-all duration-700"
                        style={{
                          strokeDasharray: circumference,
                          strokeDashoffset,
                        }}
                      />
                    </svg>
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white">
                      <Mic className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold text-red-700 dark:text-red-400 tabular-nums">
                      {formatTime(recordingDuration)}
                    </span>
                    <span className="text-xs text-red-600/80 dark:text-red-400/80 tabular-nums">
                      剩余 {formatTime(recordingCountdown)}
                    </span>
                  </div>
                  {analyserNode && <WaveformVisualizer analyserNode={analyserNode} />}
                </div>
                <motion.button
                  type="button"
                  onClick={onStopRecording}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  结束回答
                </motion.button>
              </motion.div>
            )}

            {(phase === 'transcribing' || phase === 'submitting') && (
              <motion.div
                key="processing"
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <motion.div
                  className="h-8 w-8 rounded-full border-4 border-primary-200 border-t-primary-500"
                  animate={reducedMotion ? undefined : { rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {phase === 'transcribing' ? '正在识别您的回答…' : '正在提交答案…'}
                </p>
              </motion.div>
            )}

            {phase === 'completed' && (
              <motion.div
                key="completed"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-label="完成">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-base font-medium text-slate-800 dark:text-slate-100">面试已完成</p>
                <p className="text-xs text-slate-400">正在生成评估报告…</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 底部控制栏 */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {phase !== 'completed' && phase !== 'transcribing' && phase !== 'submitting' && (
            <>
              <motion.button
                type="button"
                onClick={onSkipQuestion}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                whileTap={{ scale: 0.97 }}
              >
                <SkipForward className="h-4 w-4" />
                跳过
              </motion.button>
              <motion.button
                type="button"
                onClick={isPaused ? onResumeInterview : onPauseInterview}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                whileTap={{ scale: 0.97 }}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? '继续' : '暂停'}
              </motion.button>
            </>
          )}
        </div>
        <motion.button
          type="button"
          onClick={onExitInterview}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
          whileTap={{ scale: 0.97 }}
        >
          <LogOut className="h-4 w-4" />
          退出面试
        </motion.button>
      </div>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            className="absolute bottom-20 left-0 right-0 mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400"
          >
            <div className="flex flex-col items-center gap-2">
              <span>{error}</span>
              {onRetry && (
                <motion.button
                  type="button"
                  onClick={onRetry}
                  className="flex items-center gap-1 rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                  whileTap={{ scale: 0.97 }}
                >
                  <RotateCcw className="h-3 w-3" />
                  重试
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 暂停覆盖层 */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-slate-900/40 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-2xl dark:bg-slate-800">
              <Pause className="h-10 w-10 text-slate-400" />
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">面试已暂停</p>
              <motion.button
                type="button"
                onClick={onResumeInterview}
                className="flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
                whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="h-4 w-4" />
                继续面试
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
