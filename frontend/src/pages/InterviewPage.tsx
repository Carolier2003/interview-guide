import {useEffect, useRef, useState} from 'react';
import {motion} from 'framer-motion';
import {interviewApi, type CreateSessionProgressEvent} from '../api/interview';
import ConfirmDialog from '../components/ConfirmDialog';
import InterviewChatPanel from '../components/InterviewChatPanel';
import InterviewPageHeader from '../components/InterviewPageHeader';
import type {InterviewQuestion, InterviewSession} from '../types/interview';
import type {Difficulty} from '../components/UnifiedInterviewModal';
import type {CategoryDTO} from '../api/skill';
import { CUSTOM_SKILL_ID } from '../hooks/useInterviewConfig';

interface Message {
  type: 'interviewer' | 'user';
  content: string;
  category?: string;
  questionIndex?: number;
}

interface InterviewProps {
  resumeText: string;
  resumeId?: number;
  sessionIdToResume?: string;
  initialConfig?: {
    questionCount?: number;
    llmProvider?: string;
    skillId?: string;
    difficulty?: Difficulty;
    customCategories?: CategoryDTO[];
    jdText?: string;
  };
  onBack: () => void;
  onInterviewComplete: () => void;
}

export default function Interview({
  resumeText,
  resumeId,
  sessionIdToResume,
  initialConfig,
  onBack,
  onInterviewComplete,
}: InterviewProps) {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [progress, setProgress] = useState<CreateSessionProgressEvent | null>(null);
  const startedRef = useRef(false);

  const questionCount = initialConfig?.questionCount ?? 8;
  const llmProvider = initialConfig?.llmProvider ?? '';
  const skillId = initialConfig?.skillId ?? 'java-backend';
  const difficulty = initialConfig?.difficulty ?? 'mid';
  const customCategories = initialConfig?.customCategories;
  const jdText = initialConfig?.jdText;

  // 自动开始面试（恢复已有会话 或 创建新会话）
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      if (sessionIdToResume) {
        resumeExistingSession(sessionIdToResume);
      } else {
        startInterview();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startInterview = async () => {
    setIsCreating(true);
    setError('');
    setProgress({ phase: 'connecting', percent: 0, message: '正在连接服务...' });

    await interviewApi.createSessionStream(
      {
        resumeText,
        questionCount,
        resumeId,
        forceCreate: true,
        llmProvider,
        skillId,
        difficulty,
        customCategories: skillId === CUSTOM_SKILL_ID ? customCategories : undefined,
        jdText: skillId === CUSTOM_SKILL_ID ? jdText : undefined,
      },
      {
        onProgress: (event) => setProgress(event),
        onSession: (newSession) => {
          setProgress({ phase: 'completed', percent: 100, message: '题目准备完成' });
          setTimeout(() => {
            initSession(newSession);
            setIsCreating(false);
          }, 500);
        },
        onError: (err) => {
          setError(err.message || '创建面试失败，请重试');
          setIsCreating(false);
          console.error(err);
        },
      },
    );
  };

  const resumeExistingSession = async (sessionId: string) => {
    setIsCreating(true);
    setError('');

    try {
      const existingSession = await interviewApi.getSession(sessionId);
      initSession(existingSession);

      // 恢复已填写的答案
      const currentQ = existingSession.questions[existingSession.currentQuestionIndex];
      if (currentQ?.userAnswer) {
        setAnswer(currentQ.userAnswer);
      }
    } catch (err) {
      setError('恢复面试失败，请重试');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const initSession = (s: InterviewSession) => {
    setSession(s);

    if (s.questions.length > 0) {
      const idx = Math.min(s.currentQuestionIndex, s.questions.length - 1);
      const currentQ = s.questions[idx];
      setCurrentQuestion(currentQ);

      // 重建消息历史
      const restoredMessages: Message[] = [];
      for (let i = 0; i <= idx; i++) {
        const q = s.questions[i];
        restoredMessages.push({
          type: 'interviewer',
          content: q.question,
          category: q.category,
          questionIndex: i
        });
        if (q.userAnswer) {
          restoredMessages.push({
            type: 'user',
            content: q.userAnswer
          });
        }
      }
      setMessages(restoredMessages);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !session || !currentQuestion) return;

    setIsSubmitting(true);

    const userMessage: Message = {
      type: 'user',
      content: answer
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await interviewApi.submitAnswer({
        sessionId: session.sessionId,
        questionIndex: currentQuestion.questionIndex,
        answer: answer.trim()
      });

      setAnswer('');

      if (response.hasNextQuestion && response.nextQuestion) {
        setCurrentQuestion(response.nextQuestion);
        setMessages(prev => [...prev, {
          type: 'interviewer',
          content: response.nextQuestion!.question,
          category: response.nextQuestion!.category,
          questionIndex: response.nextQuestion!.questionIndex
        }]);
      } else {
        onInterviewComplete();
      }
    } catch (err) {
      setError('提交答案失败，请重试');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteEarly = async () => {
    if (!session) return;

    setIsSubmitting(true);
    try {
      await interviewApi.completeInterview(session.sessionId);
      setShowCompleteConfirm(false);
      onInterviewComplete();
    } catch (err) {
      setError('提前交卷失败，请重试');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasResume = resumeText && resumeText.trim().length > 0;

  const stages = [
    { keys: ['preparing'], label: '准备出题环境', threshold: 20 },
    ...(hasResume ? [{ keys: ['generating_resume', 'resume_done'], label: '生成简历相关问题', threshold: 60 }] : []),
    { keys: ['generating_direction', 'direction_done'], label: '生成方向题', threshold: 80 },
    { keys: ['finalizing', 'completed'], label: '整合题目', threshold: 100 },
  ];

  const getStageStatus = (stage: typeof stages[number]) => {
    if (!progress) return 'pending';
    if (stage.keys.includes(progress.phase)) return 'active';
    if (progress.percent >= stage.threshold) return 'done';
    return 'pending';
  };

  // 加载中
  if (isCreating) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-lg">
          {/* 背景光晕 */}
          <div className="relative">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-56 bg-primary-500/10 dark:bg-primary-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-lg dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 p-8">
              {/* 顶部 AI 动画 */}
              <div className="flex justify-center mb-6">
                <div className="flex items-end gap-[3px] h-8">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary-500 rounded-full animate-[bounce_1.2s_ease-in-out_infinite]"
                      style={{
                        animationDelay: `${i * 0.15}s`,
                        height: i === 1 ? '100%' : '60%',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* 标题 */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  AI 正在为您准备面试
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {progress?.message || '正在连接服务...'}
                </p>
              </div>

              {/* 进度条 */}
              <div className="mb-10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">总体进度</span>
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                    {progress?.percent ?? 0}%
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-primary-400 to-primary-600"
                    style={{ width: `${progress?.percent ?? 0}%` }}
                  />
                </div>
              </div>

              {/* 阶段时间线 */}
              <div className="space-y-0">
                {stages.map((stage, idx) => {
                  const status = getStageStatus(stage);
                  const isLast = idx === stages.length - 1;
                  return (
                    <div key={idx} className="flex gap-4">
                      {/* 左侧图标 + 连接线 */}
                      <div className="flex flex-col items-center">
                        {status === 'done' && (
                          <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-sm shadow-green-500/30">
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                        {status === 'active' && (
                          <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center shadow-sm shadow-primary-500/30">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          </div>
                        )}
                        {status === 'pending' && (
                          <div className="w-7 h-7 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
                        )}
                        {!isLast && (
                          <div className={`w-0.5 flex-1 mt-1 ${
                            status === 'done' ? 'bg-green-400 dark:bg-green-600' : 'bg-slate-200 dark:bg-slate-700'
                          }`} />
                        )}
                      </div>

                      {/* 右侧内容 */}
                      <div className={`pb-6 ${isLast ? '' : ''}`}>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className={`text-sm font-medium ${
                            status === 'done'
                              ? 'text-green-700 dark:text-green-400'
                              : status === 'active'
                              ? 'text-primary-700 dark:text-primary-300'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {stage.label}
                          </span>
                          {status === 'active' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium">
                              进行中
                            </span>
                          )}
                        </div>
                        {status === 'active' && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            请稍候，这通常需要几秒钟...
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error && !session) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={startInterview}
              className="px-5 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              重试
            </button>
            <button
              onClick={onBack}
              className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !currentQuestion) return null;

  return (
    <div className="pb-10">
      <div className="max-w-7xl mx-auto">
      <InterviewPageHeader
        title="模拟面试"
        subtitle="认真回答每个问题，展示您的实力"
        icon={(
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <InterviewChatPanel
          session={session}
          currentQuestion={currentQuestion}
          messages={messages}
          answer={answer}
          onAnswerChange={setAnswer}
          onSubmit={handleSubmitAnswer}
          onCompleteEarly={handleCompleteEarly}
          isSubmitting={isSubmitting}
          showCompleteConfirm={showCompleteConfirm}
          onShowCompleteConfirm={setShowCompleteConfirm}
        />
      </motion.div>

      {/* 提前交卷确认对话框 */}
      <ConfirmDialog
        open={showCompleteConfirm}
        title="提前交卷"
        message="确定要提前交卷吗？未回答的问题将按0分计算。"
        confirmText="确定交卷"
        cancelText="取消"
        confirmVariant="warning"
        loading={isSubmitting}
        onConfirm={handleCompleteEarly}
        onCancel={() => setShowCompleteConfirm(false)}
      />
      </div>
    </div>
  );
}
