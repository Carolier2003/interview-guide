import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getScoreColor } from '../utils/score';
import type { InterviewDetail, AnswerItem } from '../api/history';

interface InterviewDetailPanelProps {
  interview: InterviewDetail;
}

/**
 * 面试详情面板组件 - Editorial Data Report 风格
 */
export default function InterviewDetailPanel({ interview }: InterviewDetailPanelProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(() => {
    const allIndices = new Set<number>();
    if (interview.answers) {
      interview.answers.forEach((_, idx) => allIndices.add(idx));
    }
    return allIndices;
  });

  const toggleQuestion = (index: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // 按分类统计得分
  const categoryStats = useMemo(() => {
    if (!interview.answers?.length) return [];
    const map = new Map<string, { scores: number[]; count: number }>();
    interview.answers.forEach(a => {
      const cat = a.category || '综合';
      const existing = map.get(cat) || { scores: [], count: 0 };
      existing.scores.push(a.score);
      existing.count++;
      map.set(cat, existing);
    });
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      avg: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      count: data.count,
    }));
  }, [interview.answers]);

  // 计算圆环进度
  const { circumference, strokeDashoffset } = useMemo(() => {
    const percent = interview.overallScore !== null ? interview.overallScore : 0;
    const circ = 2 * Math.PI * 58;
    const offset = circ - (percent / 100) * circ;
    return { circumference: circ, strokeDashoffset: offset };
  }, [interview.overallScore]);

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero 评分卡片 */}
      <ScoreHero
        score={interview.overallScore}
        feedback={interview.overallFeedback}
        categoryStats={categoryStats}
        circumference={circumference}
        strokeDashoffset={strokeDashoffset}
      />

      {/* 优势 & 建议 双栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {interview.strengths && interview.strengths.length > 0 && (
          <StrengthsSection strengths={interview.strengths} />
        )}
        {interview.improvements && interview.improvements.length > 0 && (
          <ImprovementsSection improvements={interview.improvements} />
        )}
      </div>

      {/* 问答记录 */}
      <QuestionsSection
        answers={interview.answers || []}
        expandedQuestions={expandedQuestions}
        toggleQuestion={toggleQuestion}
      />
    </motion.div>
  );
}

// ============================================================
// ScoreHero - 大胆的编辑风格评分展示
// ============================================================
function ScoreHero({
  score,
  feedback,
  categoryStats,
  circumference,
  strokeDashoffset,
}: {
  score: number | null;
  feedback: string | null;
  categoryStats: { name: string; avg: number; count: number }[];
  circumference: number;
  strokeDashoffset: number;
}) {
  const scoreValue = score ?? 0;
  const scoreLabel = scoreValue >= 85 ? '优秀' : scoreValue >= 70 ? '良好' : scoreValue >= 60 ? '合格' : '待提升';

  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* 背景纹理 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* 顶部装饰条 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />

      <div className="relative px-6 py-10 md:px-10 md:py-12">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10">
          {/* 左侧：大分数 + 文案 */}
          <div className="flex-1">
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/40 px-3 py-1.5 text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400 backdrop-blur-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              面试评估报告
            </motion.div>

            <motion.h2
              className="mt-5 text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              {scoreLabel}
              <span className="text-slate-400 dark:text-slate-500 font-normal"> · 综合表现</span>
            </motion.h2>

            <motion.p
              className="mt-4 max-w-2xl text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              {feedback || '表现良好，展示了扎实的技术基础。建议在后续面试中更加注重细节表达和体系化思维的呈现。'}
            </motion.p>

            {/* 分类得分条 */}
            {categoryStats.length > 0 && (
              <motion.div
                className="mt-8 flex flex-wrap gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {categoryStats.map((cat, i) => (
                  <motion.div
                    key={cat.name}
                    className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 px-4 py-3 backdrop-blur-sm transition-colors hover:border-primary-300 dark:hover:border-slate-500"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.55 + i * 0.06 }}
                  >
                    <div className="text-xs text-slate-500 dark:text-slate-400">{cat.name}</div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-semibold text-slate-900 dark:text-white">{cat.avg}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">分</span>
                    </div>
                    {/* 底部进度装饰 */}
                    <div className="absolute bottom-0 left-0 h-0.5 bg-primary-500/80" style={{ width: `${cat.avg}%` }} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* 右侧：圆环评分 */}
          <motion.div
            className="flex items-center justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="relative">
              {/* 背景光晕 */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500/10 to-primary-300/5 blur-2xl" />

              <svg className="relative h-44 w-44 md:h-52 md:w-52 -rotate-90" viewBox="0 0 140 140">
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                  {/* 内侧阴影滤镜 */}
                  <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="currentColor" floodOpacity="0.08" />
                  </filter>
                </defs>

                {/* 外圈刻度点（24个） */}
                {[...Array(24)].map((_, i) => {
                  const angle = (i * 15 * Math.PI) / 180;
                  const x1 = 70 + Math.cos(angle) * 64;
                  const y1 = 70 + Math.sin(angle) * 64;
                  const x2 = 70 + Math.cos(angle) * 61;
                  const y2 = 70 + Math.sin(angle) * 61;
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      className="text-slate-200 dark:text-slate-700"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* 背景细环 */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  className="stroke-slate-100 dark:stroke-slate-700/60"
                  strokeWidth="3"
                  fill="none"
                />

                {/* 背景主环 */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  className="stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference / 4} ${circumference / 4 * 3}`}
                  transform="rotate(-90 70 70)"
                />

                {/* 进度环 */}
                <motion.circle
                  cx="70"
                  cy="70"
                  r="54"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(20,184,166,0.35))' }}
                />
              </svg>

              {/* 中心内容 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  className="mb-1 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm shadow-primary-500/25"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {scoreLabel}
                </motion.div>
                <motion.span
                  className="text-5xl md:text-6xl font-bold tracking-tighter text-slate-900 dark:text-white"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  {score ?? '-'}
                </motion.span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">总分 / 100</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// StrengthsSection - 表现优势
// ============================================================
function StrengthsSection({ strengths }: { strengths: string[] }) {
  return (
    <motion.div
      className="relative rounded-2xl border border-emerald-500/10 bg-emerald-50/40 dark:bg-emerald-950/20 p-6 md:p-8"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <div className="absolute top-0 left-0 h-full w-1 rounded-l-2xl bg-emerald-500" />
      <h4 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        表现优势
      </h4>
      <ul className="space-y-4">
        {strengths.map((s, i) => (
          <motion.li
            key={i}
            className="flex items-start gap-3 text-slate-700 dark:text-slate-200"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
          >
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
            <span className="leading-relaxed">{s}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

// ============================================================
// ImprovementsSection - 改进建议
// ============================================================
function ImprovementsSection({ improvements }: { improvements: string[] }) {
  return (
    <motion.div
      className="relative rounded-2xl border border-amber-500/10 bg-amber-50/40 dark:bg-amber-950/20 p-6 md:p-8"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="absolute top-0 left-0 h-full w-1 rounded-l-2xl bg-amber-500" />
      <h4 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        改进建议
      </h4>
      <ul className="space-y-4">
        {improvements.map((s, i) => (
          <motion.li
            key={i}
            className="flex items-start gap-3 text-slate-700 dark:text-slate-200"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
          >
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
            <span className="leading-relaxed">{s}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

// ============================================================
// QuestionsSection - 问答记录详情
// ============================================================
function QuestionsSection({
  answers,
  expandedQuestions,
  toggleQuestion,
}: {
  answers: AnswerItem[];
  expandedQuestions: Set<number>;
  toggleQuestion: (index: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="mb-5 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          问答记录详情
        </h4>
        <span className="text-sm text-slate-500 dark:text-slate-400">共 {answers.length} 题</span>
      </div>

      <div className="space-y-4">
        {answers.map((answer, idx) => (
          <QuestionCard
            key={idx}
            answer={answer}
            index={idx}
            isExpanded={expandedQuestions.has(idx)}
            onToggle={() => toggleQuestion(idx)}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// QuestionCard - 单个问题卡片
// ============================================================
function QuestionCard({
  answer,
  index,
  isExpanded,
  onToggle,
}: {
  answer: AnswerItem;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const scoreClasses = getScoreColor(answer.score, [80, 60]);
  const scoreLabel = answer.score >= 85 ? '卓越' : answer.score >= 70 ? '良好' : answer.score >= 60 ? '及格' : '需加强';

  return (
    <motion.div
      className="group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 transition-all hover:border-slate-300 dark:hover:border-slate-600"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
    >
      {/* 头部 */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-700/20"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300">
            {answer.questionIndex + 1}
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                {answer.category || '综合'}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreClasses}`}>
                {scoreLabel} · {answer.score}分
              </span>
            </div>
            <p className="line-clamp-1 text-sm font-medium text-slate-800 dark:text-slate-100 md:text-base">
              {answer.question}
            </p>
          </div>
        </div>

        <motion.div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-slate-600 text-slate-400 transition-colors group-hover:border-slate-300 group-hover:text-slate-600 dark:group-hover:border-slate-500 dark:group-hover:text-slate-300"
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </button>

      {/* 展开内容 */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 dark:border-slate-700/60 px-5 pb-6 pt-5 space-y-5">
              {/* 你的回答 */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-700/30 p-4 md:p-5">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  你的回答
                </div>
                <p
                  className={`whitespace-pre-wrap leading-relaxed ${
                    !answer.userAnswer || answer.userAnswer === '不知道'
                      ? 'text-primary-600 dark:text-primary-400 font-medium'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {answer.userAnswer || '(未回答)'}
                </p>
              </div>

              {/* AI 深度评价 */}
              {answer.feedback && (
                <div className="rounded-xl border-l-4 border-primary-400 bg-primary-50/40 dark:bg-primary-950/20 p-4 md:p-5">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-400">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    AI 深度评价
                  </div>
                  <p className="leading-relaxed text-slate-700 dark:text-slate-200">{answer.feedback}</p>
                </div>
              )}

              {/* 参考答案 */}
              {answer.referenceAnswer && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/60 p-4 md:p-5">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M9 12h6" />
                      <path d="M12 9v6" />
                    </svg>
                    参考答案
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-200">{answer.referenceAnswer}</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
