import { AnimatePresence, motion } from 'framer-motion';
import type { InterviewSession } from '../types/interview';

interface InterviewConfigPanelProps {
  questionCount: number;
  onQuestionCountChange: (count: number) => void;
  onStart: () => void;
  isCreating: boolean;
  checkingUnfinished: boolean;
  unfinishedSession: InterviewSession | null;
  onContinueUnfinished: () => void;
  onStartNew: () => void;
  resumeText: string;
  onBack: () => void;
  error?: string;
}

export default function InterviewConfigPanel({
  questionCount,
  onQuestionCountChange,
  onStart,
  isCreating,
  checkingUnfinished,
  unfinishedSession,
  onContinueUnfinished,
  onStartNew,
  resumeText,
  onBack,
  error
}: InterviewConfigPanelProps) {
  const questionCounts = [6, 8, 10, 12, 15];

  return (
    <motion.div
      className="max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        {/* 顶部装饰线 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />

        <div className="p-5 md:p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <motion.h2
                className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                面试配置
              </motion.h2>
              <motion.p
                className="mt-1 text-sm text-slate-500 dark:text-slate-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                选择题目数量，AI 将基于您的简历定制专属面试
              </motion.p>
            </div>
            <motion.div
              className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </motion.div>
          </div>

          {/* 未完成面试提示 */}
          <AnimatePresence>
            {checkingUnfinished && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 p-4 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                  <motion.div
                    className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  正在检查是否有未完成的面试…
                </div>
              </motion.div>
            )}

            {unfinishedSession && !checkingUnfinished && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-5 overflow-hidden rounded-xl border border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/30 dark:to-primary-950/20"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-primary-900 dark:text-primary-300">检测到未完成的模拟面试</h3>
                      <p className="mt-0.5 text-xs text-primary-700 dark:text-primary-400">
                        已完成 {unfinishedSession.currentQuestionIndex} / {unfinishedSession.totalQuestions} 题
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <motion.button
                      onClick={onContinueUnfinished}
                      className="flex-1 rounded-lg bg-primary-500 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-primary-500/20 transition-colors hover:bg-primary-600"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      继续完成
                    </motion.button>
                    <motion.button
                      onClick={onStartNew}
                      className="flex-1 rounded-lg border border-primary-300 dark:border-primary-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-primary-700 dark:text-primary-400 transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/20"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      开始新的
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 题目数量 */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              题目数量
            </label>
            <div className="grid grid-cols-5 gap-2">
              {questionCounts.map((count) => (
                <motion.button
                  key={count}
                  onClick={() => onQuestionCountChange(count)}
                  className={`relative rounded-lg px-2 py-2 text-sm font-semibold transition-all ${
                    questionCount === count
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                      : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700'
                  }`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {count}
                </motion.button>
              ))}
            </div>
          </div>

          {/* 简历预览 */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-slate-600 dark:text-slate-400">
              简历预览（前 500 字）
            </label>
            <div className="relative">
              <textarea
                value={resumeText.substring(0, 500) + (resumeText.length > 500 ? '…' : '')}
                readOnly
                className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-600 focus:outline-none dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-400"
              />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 rounded-b-xl bg-gradient-to-t from-slate-50 to-transparent dark:from-slate-900/60" />
            </div>
          </div>

          {/* 分布说明 */}
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-700/20">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              题目分布：项目经历 20% + MySQL 20% + Redis 20% + Java 基础/集合/并发 30% + Spring 10%
            </p>
          </div>

          {/* 错误提示 */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-5 rounded-lg border border-red-200 bg-red-50/60 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
              >
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3">
            <motion.button
              onClick={onBack}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              返回
            </motion.button>
            <motion.button
              onClick={onStart}
              disabled={isCreating}
              className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/20 transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              whileHover={{ scale: isCreating ? 1 : 1.02 }}
              whileTap={{ scale: isCreating ? 1 : 0.98 }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {isCreating ? (
                  <>
                    <motion.span
                      className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    正在生成…
                  </>
                ) : (
                  <>
                    开始面试
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
