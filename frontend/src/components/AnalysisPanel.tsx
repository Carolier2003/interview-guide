import { useMemo } from 'react';
import { motion } from 'framer-motion';
import RadarChart from './RadarChart';
import ScoreProgressBar from './ScoreProgressBar';
import { formatDateTime } from '../utils/date';
import { AlertCircle, CheckCircle2, Clock, Download, Loader2, RefreshCw, Target, TrendingUp } from 'lucide-react';
import type { AnalyzeStatus } from '../api/history';

interface AnalysisPanelProps {
  analysis: any;
  analyzeStatus?: AnalyzeStatus;
  analyzeError?: string;
  onExport: () => void;
  exporting: boolean;
  onReanalyze?: () => void;
  reanalyzing?: boolean;
}

export default function AnalysisPanel({
  analysis,
  analyzeStatus,
  analyzeError,
  onExport,
  exporting,
  onReanalyze,
  reanalyzing,
}: AnalysisPanelProps) {
  const radarData = useMemo(() => {
    if (!analysis) return [];
    const projectScore = analysis.projectScore || 0;
    const skillMatchScore = analysis.skillMatchScore || 0;
    const contentScore = analysis.contentScore || 0;
    const structureScore = analysis.structureScore || 0;
    const expressionScore = analysis.expressionScore || 0;

    return [
      { subject: '表达专业性', score: expressionScore, fullMark: 10 },
      { subject: '技能匹配', score: skillMatchScore, fullMark: 20 },
      { subject: '内容完整性', score: contentScore, fullMark: 15 },
      { subject: '结构清晰度', score: structureScore, fullMark: 15 },
      { subject: '项目经验', score: projectScore, fullMark: 40 },
    ];
  }, [analysis]);

  const suggestionsByPriority = useMemo(() => {
    if (!analysis?.suggestions) return { high: [], medium: [], low: [] };
    const suggestions = analysis.suggestions;
    return {
      high: suggestions.filter((s: any) => s.priority === '高'),
      medium: suggestions.filter((s: any) => s.priority === '中'),
      low: suggestions.filter((s: any) => s.priority === '低'),
    };
  }, [analysis]);

  const hasErrorKeywords = analysis?.summary && (
    analysis.summary.includes('I/O error') ||
    analysis.summary.includes('分析过程中出现错误') ||
    analysis.summary.includes('简历分析失败') ||
    analysis.summary.includes('Remote host terminated') ||
    analysis.summary.includes('handshake')
  );
  const isAnalysisValid = analysis && analysis.overallScore >= 10 && analysis.summary && !hasErrorKeywords;

  const isProcessing = analyzeStatus === 'PENDING' || analyzeStatus === 'PROCESSING' || (analyzeStatus === undefined && !analysis);

  if (isProcessing) {
    const isExplicitProcessing = analyzeStatus === 'PROCESSING';
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center shadow-xl shadow-slate-200/40 dark:shadow-none"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700"
          >
            {isExplicitProcessing ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            ) : (
              <Clock className="h-8 w-8 text-amber-500" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100"
          >
            {isExplicitProcessing ? 'AI 正在分析中…' : '等待分析'}
          </h3>
          <p className="mt-2 text-slate-500 dark:text-slate-400"
          >
            {isExplicitProcessing ? '请稍候，AI 正在对您的简历进行深度分析' : '简历已上传成功，即将开始 AI 分析'}
          </p>
          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500"
          >页面将自动刷新显示分析结果</p>
        </motion.div>
      </div>
    );
  }

  if (analyzeStatus === 'FAILED' || !isAnalysisValid) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center shadow-xl shadow-slate-200/40 dark:shadow-none"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-500"
          >
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">分析失败</h3>
          <p className="mt-2 text-slate-500 dark:text-slate-400">AI 服务暂时不可用，请稍后重试</p>
          {(analyzeError || analysis?.summary) && (
            <div className="mx-auto mt-5 max-w-md rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-left text-sm text-red-600 dark:text-red-400"
            >
              {analyzeError || analysis.summary}
            </div>
          )}
          {onReanalyze && (
            <motion.button
              onClick={onReanalyze}
              disabled={reanalyzing}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className={`h-4 w-4 ${reanalyzing ? 'animate-spin' : ''}`} />
              {reanalyzing ? '重新分析中…' : '重新分析'}
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  const projectScore = analysis.projectScore || 0;
  const skillMatchScore = analysis.skillMatchScore || 0;
  const contentScore = analysis.contentScore || 0;
  const structureScore = analysis.structureScore || 0;
  const expressionScore = analysis.expressionScore || 0;

  return (
    <div className="space-y-8"
    >
      {/* Hero 核心评价 */}
      <motion.div
        className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
        <div className="relative px-6 py-10 md:px-10 md:py-12"
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between"
          >
            <div className="flex-1"
            >
              <motion.div
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/40 px-3 py-1.5 text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400 backdrop-blur-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                简历分析报告
              </motion.div>

              <motion.h2
                className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                综合评估
              </motion.h2>

              <motion.p
                className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {analysis.summary || '候选人具备扎实的技术基础，有大型项目架构经验。'}
              </motion.p>

              {analysis.strengths && analysis.strengths.length > 0 && (
                <motion.div
                  className="mt-8 flex flex-wrap gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {analysis.strengths.map((s: string, i: number) => (
                    <motion.span
                      key={i}
                      className="rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-300"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.55 + i * 0.05 }}
                    >
                      {s}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </div>

            <motion.div
              className="flex items-center gap-6 lg:justify-end"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-center"
              >
                <div className="text-6xl font-bold tracking-tighter text-slate-900 dark:text-white md:text-7xl"
                >
                  {analysis.overallScore || 0}
                </div>
                <div className="mt-1 text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500"
                >总分 / 100</div>
              </div>
              <div className="hidden h-16 w-px bg-slate-200 dark:bg-slate-700 lg:block"
              />
              <div className="text-left"
              >
                <div className="text-sm text-slate-400 dark:text-slate-500"
                >分析时间</div>
                <div className="mt-1 text-lg font-medium text-slate-900 dark:text-white"
                >
                  {formatDateTime(analysis.analyzedAt)}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* 雷达图 + 维度详情 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <motion.div
          className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200"
          >
            <Target className="h-5 w-5" />
            <span className="font-semibold">多维度评分</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-6 md:flex-row"
          >
            <div className="w-full max-w-sm"
            >
              <RadarChart data={radarData} height={280} />
            </div>
            <div className="w-full flex-1 space-y-4"
            >
              <ScoreProgressBar label="项目经验" score={projectScore} maxScore={40} color="bg-purple-500" delay={0.3} />
              <ScoreProgressBar label="技能匹配" score={skillMatchScore} maxScore={20} color="bg-blue-500" delay={0.4} />
              <ScoreProgressBar label="内容完整性" score={contentScore} maxScore={15} color="bg-emerald-500" delay={0.5} />
              <ScoreProgressBar label="结构清晰度" score={structureScore} maxScore={15} color="bg-cyan-500" delay={0.6} />
              <ScoreProgressBar label="表达专业性" score={expressionScore} maxScore={10} color="bg-primary-500" delay={0.7} />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-6 flex items-center gap-2 text-slate-700 dark:text-slate-200"
          >
            <TrendingUp className="h-5 w-5" />
            <span className="font-semibold">报告操作</span>
          </div>
          <div className="space-y-4"
          >
            <motion.button
              onClick={onExport}
              disabled={exporting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Download className="h-4 w-4" />
              {exporting ? '导出中…' : '导出分析报告'}
            </motion.button>

            {onReanalyze && (
              <motion.button
                onClick={onReanalyze}
                disabled={reanalyzing}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <RefreshCw className={`h-4 w-4 ${reanalyzing ? 'animate-spin' : ''}`} />
                {reanalyzing ? '重新分析中…' : '重新分析'}
              </motion.button>
            )}
          </div>

          <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50/60 p-5 dark:border-slate-700 dark:bg-slate-700/20"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400"
            >维度说明</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300"
            >
              <li className="flex items-center gap-2"
              >
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                项目经验（占比最高）
              </li>
              <li className="flex items-center gap-2"
              >
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                技能匹配
              </li>
              <li className="flex items-center gap-2"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                内容完整性
              </li>
              <li className="flex items-center gap-2"
              >
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                结构清晰度
              </li>
              <li className="flex items-center gap-2"
              >
                <span className="h-2 w-2 rounded-full bg-primary-500" />
                表达专业性
              </li>
            </ul>
          </div>
        </motion.div>
      </div>

      {/* 改进建议 */}
      <motion.div
        className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="mb-6 flex items-center gap-2 text-slate-700 dark:text-slate-200"
        >
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-semibold">改进建议</span>
          <span className="text-sm text-slate-400"
          >({analysis.suggestions?.length || 0} 条)</span>
        </div>

        <div className="space-y-8"
        >
          {suggestionsByPriority.high.length > 0 && (
            <SuggestionTimeline priority="高" suggestions={suggestionsByPriority.high} delay={0.5} />
          )}
          {suggestionsByPriority.medium.length > 0 && (
            <SuggestionTimeline priority="中" suggestions={suggestionsByPriority.medium} delay={0.6} />
          )}
          {suggestionsByPriority.low.length > 0 && (
            <SuggestionTimeline priority="低" suggestions={suggestionsByPriority.low} delay={0.7} />
          )}

          {analysis.suggestions?.length === 0 && (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400"
            >暂无改进建议</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function SuggestionTimeline({
  priority,
  suggestions,
  delay,
}: {
  priority: string;
  suggestions: any[];
  delay: number;
}) {
  const dotColor =
    priority === '高' ? 'bg-rose-500' : priority === '中' ? 'bg-amber-500' : 'bg-blue-500';
  const labelColor =
    priority === '高'
      ? 'text-rose-700 dark:text-rose-400'
      : priority === '中'
      ? 'text-amber-700 dark:text-amber-400'
      : 'text-blue-700 dark:text-blue-400';

  return (
    <div>
      <div className="mb-4 flex items-center gap-3"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
        <span className={`text-sm font-bold uppercase tracking-wide ${labelColor}`}
        >
          {priority}优先级 ({suggestions.length})
        </span>
        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700"
        />
      </div>
      <div className="relative ml-1.5 space-y-4 border-l-2 border-slate-100 pl-6 dark:border-slate-700"
      >
        {suggestions.map((s: any, i: number) => (
          <motion.div
            key={`${priority}-${i}`}
            className="relative rounded-2xl border border-slate-100 bg-slate-50/60 p-5 dark:border-slate-700 dark:bg-slate-700/20"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + i * 0.08 }}
          >
            <span className={`absolute -left-[31px] top-6 h-2.5 w-2.5 rounded-full ${dotColor} ring-4 ring-white dark:ring-slate-800`} />
            {s.category && (
              <span className="mb-2 inline-block rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {s.category}
              </span>
            )}
            <p className="font-semibold text-slate-900 dark:text-white"
            >{s.issue || '问题描述'}</p>
            <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300"
            >{s.recommendation || s}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
