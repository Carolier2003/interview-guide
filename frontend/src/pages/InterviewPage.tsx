import {useCallback, useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {interviewApi} from '../api/interview';
import ConfirmDialog from '../components/ConfirmDialog';
import InterviewConfigPanel from '../components/InterviewConfigPanel';
import InterviewChatPanel from '../components/InterviewChatPanel';
import InterviewRealtimePanel, { type RealtimePhase } from '../components/InterviewRealtimePanel';
import type {InterviewQuestion, InterviewSession} from '../types/interview';
import { Mic } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTtsPlayer } from '../hooks/useTtsPlayer';

type InterviewStage = 'config' | 'interview' | 'realtime';

interface Message {
  type: 'interviewer' | 'user';
  content: string;
  category?: string;
  questionIndex?: number;
}

interface InterviewProps {
  resumeText: string;
  resumeId?: number;
  onBack: () => void;
  onInterviewComplete: () => void;
}

const PREP_SECONDS = 5;
const RECORDING_MAX_SECONDS = 90;

export default function Interview({ resumeText, resumeId, onBack, onInterviewComplete }: InterviewProps) {
  const [stage, setStage] = useState<InterviewStage>('config');
  const [questionCount, setQuestionCount] = useState(8);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [checkingUnfinished, setCheckingUnfinished] = useState(false);
  const [unfinishedSession, setUnfinishedSession] = useState<InterviewSession | null>(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [forceCreateNew, setForceCreateNew] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);

  // Realtime mode states
  const [realtimePhase, setRealtimePhase] = useState<RealtimePhase>('tts');
  const [prepCountdown, setPrepCountdown] = useState(PREP_SECONDS);
  const [recordingCountdown, setRecordingCountdown] = useState(RECORDING_MAX_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);

  const prepTimerRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const realtimeTtsTriggeredRef = useRef<number>(-1);
  const realtimeTtsStartedRef = useRef<boolean>(false);
  const asrProcessingRef = useRef<boolean>(false);

  const {
    isRecording,
    audioBlob,
    recordingDuration,
    startRecording,
    stopRecording,
    reset: resetRecorder,
    error: recorderError,
    analyserNode,
  } = useAudioRecorder();

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const { isPlaying, play, stop } = useTtsPlayer();

  // TTS 缓存：题目文本 -> blob URL
  const ttsCacheRef = useRef<Map<string, string>>(new Map());
  const autoPlayedRef = useRef<Set<number>>(new Set());

  // 检查是否有未完成的面试（组件挂载时和resumeId变化时）
  useEffect(() => {
    if (resumeId) {
      checkUnfinishedSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  const checkUnfinishedSession = async () => {
    if (!resumeId) return;

    setCheckingUnfinished(true);
    try {
      const foundSession = await interviewApi.findUnfinishedSession(resumeId);
      if (foundSession) {
        setUnfinishedSession(foundSession);
      }
    } catch (err) {
      console.error('检查未完成面试失败', err);
    } finally {
      setCheckingUnfinished(false);
    }
  };

  const handleContinueUnfinished = () => {
    if (!unfinishedSession) return;
    setForceCreateNew(false);  // 重置强制创建标志
    restoreSession(unfinishedSession);
    setUnfinishedSession(null);
  };

    const handleStartNew = () => {
    setUnfinishedSession(null);
    setForceCreateNew(true);  // 标记需要强制创建新会话
  };

    const restoreSession = (sessionToRestore: InterviewSession) => {
    setSession(sessionToRestore);

        // 恢复当前问题
    const currentQ = sessionToRestore.questions[sessionToRestore.currentQuestionIndex];
    if (currentQ) {
      setCurrentQuestion(currentQ);

        // 如果当前问题已有答案，显示在输入框中
      if (currentQ.userAnswer) {
        setAnswer(currentQ.userAnswer);
      }

        // 恢复消息历史
      const restoredMessages: Message[] = [];
      for (let i = 0; i <= sessionToRestore.currentQuestionIndex; i++) {
        const q = sessionToRestore.questions[i];
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

        setStage('interview');
  };

    const startInterview = async () => {
    setIsCreating(true);
    setError('');

        try {
      // 创建新面试（如果 forceCreateNew 为 true，则强制创建新会话）
      const newSession = await interviewApi.createSession({
        resumeText,
        questionCount,
        resumeId,
        forceCreate: forceCreateNew
      });

            // 重置强制创建标志
      setForceCreateNew(false);

            // 如果返回的是未完成的会话（currentQuestionIndex > 0 或已有答案），恢复它
            const hasProgress = newSession.currentQuestionIndex > 0 ||
                          newSession.questions.some(q => q.userAnswer) ||
                          newSession.status === 'IN_PROGRESS';

            if (hasProgress) {
        // 这是恢复的会话
        restoreSession(newSession);
      } else {
        // 全新的会话
        setSession(newSession);

                if (newSession.questions.length > 0) {
          const firstQuestion = newSession.questions[0];
          setCurrentQuestion(firstQuestion);
          setMessages([{
            type: 'interviewer',
            content: firstQuestion.question,
            category: firstQuestion.category,
            questionIndex: 0
          }]);
        }

                setStage('interview');
      }
    } catch (err) {
      setError('创建面试失败，请重试');
      console.error(err);
      setForceCreateNew(false);  // 出错时也重置标志
    } finally {
      setIsCreating(false);
    }
  };

  const startRealtimeInterview = async () => {
    setIsCreating(true);
    setError('');
    setRealtimeError(null);
    try {
      const newSession = await interviewApi.createSession({
        resumeText,
        questionCount,
        resumeId,
        forceCreate: forceCreateNew
      });
      setForceCreateNew(false);

      const hasProgress = newSession.currentQuestionIndex > 0 ||
        newSession.questions.some(q => q.userAnswer) ||
        newSession.status === 'IN_PROGRESS';

      if (hasProgress) {
        // 恢复的会话暂用聊天模式（最简）
        restoreSession(newSession);
      } else {
        setSession(newSession);
        if (newSession.questions.length > 0) {
          const firstQuestion = newSession.questions[0];
          setCurrentQuestion(firstQuestion);
          setMessages([{
            type: 'interviewer',
            content: firstQuestion.question,
            category: firstQuestion.category,
            questionIndex: 0
          }]);
        }
        realtimeTtsTriggeredRef.current = -1;
        setPrepCountdown(PREP_SECONDS);
        setRecordingCountdown(RECORDING_MAX_SECONDS);
        setRealtimePhase('tts');
        setIsPaused(false);
        setStage('realtime');
      }
    } catch (err) {
      setError('创建面试失败，请重试');
      console.error(err);
      setForceCreateNew(false);
    } finally {
      setIsCreating(false);
    }
  };

    const handleSubmitAnswer = async (answerText: string) => {
    if (!session || !currentQuestion) return;

    setIsSubmitting(true);

    const userMessage: Message = {
      type: 'user',
      content: answerText
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await interviewApi.submitAnswer({
        sessionId: session.sessionId,
        questionIndex: currentQuestion.questionIndex,
        answer: answerText.trim()
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
        if (stage === 'realtime') {
          realtimeTtsTriggeredRef.current = -1;
          setPrepCountdown(PREP_SECONDS);
          setRecordingCountdown(RECORDING_MAX_SECONDS);
          setRealtimePhase('tts');
        }
      } else {
        // 面试已完成，评估将在后台进行，跳转到面试记录页
        if (stage === 'realtime') {
          setRealtimePhase('completed');
          setTimeout(() => {
            onInterviewComplete();
          }, 1500);
        } else {
          onInterviewComplete();
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '提交答案失败，请重试';
      if (stage === 'realtime') {
        setRealtimeError(msg + '，请重试或跳过本题');
      } else {
        setError(msg);
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 聊天模式的答案提交（需要非空）
  const handleChatSubmitAnswer = async () => {
    if (!answer.trim() || !session || !currentQuestion) return;
    await handleSubmitAnswer(answer.trim());
  };

  const handleCompleteEarly = async () => {
    if (!session) return;

    setIsSubmitting(true);
    try {
      await interviewApi.completeInterview(session.sessionId);
      setShowCompleteConfirm(false);
      // 面试已完成，评估将在后台进行，跳转到面试记录页
      onInterviewComplete();
    } catch (err) {
      setError('提前交卷失败，请重试');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 语音识别核心逻辑（auto-retry 最多3次），同时给 useEffect 和手动重试按钮复用
  const handleTranscribeAudio = useCallback(async (blob: Blob) => {
    if (!session) return;
    setIsTranscribing(true);
    setRealtimeError(null);
    if (stage === 'realtime') {
      setRealtimePhase('transcribing');
    }
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        const text = await interviewApi.transcribeAudio(session.sessionId, blob);
        if (stage === 'realtime') {
          await handleSubmitAnswer(text.trim());
        } else {
          setAnswer(prev => (prev ? prev + ' ' + text : text));
        }
        setIsTranscribing(false);
        resetRecorder();
        return;
      } catch (err) {
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        } else {
          const msg = err instanceof Error ? err.message : '语音识别失败';
          if (stage === 'realtime') {
            setRealtimeError(msg + '，可点击重试按钮再次识别');
          } else {
            setError(msg);
            resetRecorder();
          }
        }
      }
    }
    setIsTranscribing(false);
  }, [session, stage, resetRecorder, handleSubmitAnswer]);

  // 语音识别：录音停止后自动上传（防重复触发）
  useEffect(() => {
    if (audioBlob && session && !asrProcessingRef.current) {
      asrProcessingRef.current = true;
      handleTranscribeAudio(audioBlob).finally(() => {
        asrProcessingRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob, session, handleTranscribeAudio]);

  // 聊天模式：自动播放新题目 TTS
  useEffect(() => {
    if (stage === 'realtime') return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.type === 'interviewer') {
      const idx = messages.length - 1;
      if (!autoPlayedRef.current.has(idx)) {
        autoPlayedRef.current.add(idx);
        handlePlayTts(lastMsg.content, idx, true);
      }
    }
  }, [messages, stage]);

  // 实时模式：自动播放当前题目 TTS
  useEffect(() => {
    if (stage !== 'realtime' || !currentQuestion || isPaused) return;
    if (realtimePhase === 'tts' && realtimeTtsTriggeredRef.current !== currentQuestion.questionIndex && !isPlaying) {
      realtimeTtsTriggeredRef.current = currentQuestion.questionIndex;
      realtimeTtsStartedRef.current = false;
      handlePlayTts(currentQuestion.question, -1, true);
    }
  }, [stage, currentQuestion, realtimePhase, isPlaying, isPaused]);

  // 标记 TTS 真正开始播放
  useEffect(() => {
    if (stage === 'realtime' && realtimePhase === 'tts' && isPlaying && realtimeTtsTriggeredRef.current === currentQuestion?.questionIndex) {
      realtimeTtsStartedRef.current = true;
    }
  }, [isPlaying, stage, realtimePhase, currentQuestion]);

  // TTS 结束检测：实时模式下从 tts -> prep
  useEffect(() => {
    if (stage === 'realtime' && realtimePhase === 'tts' && !isPlaying && realtimeTtsStartedRef.current && realtimeTtsTriggeredRef.current === currentQuestion?.questionIndex) {
      realtimeTtsStartedRef.current = false;
      setRealtimePhase('prep');
      setPrepCountdown(PREP_SECONDS);
    }
  }, [isPlaying, stage, realtimePhase, currentQuestion]);

  // Prep 倒计时 -> 自动开始录音
  useEffect(() => {
    if (stage !== 'realtime' || realtimePhase !== 'prep' || isPaused) return;

    if (prepCountdown <= 0) {
      setRealtimePhase('recording');
      setRecordingCountdown(RECORDING_MAX_SECONDS);
      startRecording().catch(() => {
        setRealtimeError('无法启动录音，请检查麦克风权限');
      });
      return;
    }

    prepTimerRef.current = window.setTimeout(() => {
      setPrepCountdown(c => c - 1);
    }, 1000);

    return () => {
      if (prepTimerRef.current) {
        clearTimeout(prepTimerRef.current);
      }
    };
  }, [stage, realtimePhase, prepCountdown, isPaused, startRecording]);

  // Recording 最大时长倒计时 -> 自动停止录音
  useEffect(() => {
    if (stage !== 'realtime' || realtimePhase !== 'recording' || isPaused) return;

    if (recordingCountdown <= 0) {
      stopRecording();
      return;
    }

    recordingTimerRef.current = window.setTimeout(() => {
      setRecordingCountdown(c => c - 1);
    }, 1000);

    return () => {
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
    };
  }, [stage, realtimePhase, recordingCountdown, isPaused, stopRecording]);

  // 录音器错误同步到实时模式错误
  useEffect(() => {
    if (stage === 'realtime' && recorderError) {
      setRealtimeError(recorderError);
    }
  }, [recorderError, stage]);

  // 浏览器切后台自动暂停
  useEffect(() => {
    const handleVisibility = () => {
      if (stage === 'realtime' && document.hidden && !isPaused && realtimePhase !== 'completed') {
        handlePauseInterview();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, isPaused, realtimePhase]);

  // 当TTS播放结束时同步状态
  useEffect(() => {
    if (!isPlaying && playingMessageIndex !== null) {
      setPlayingMessageIndex(null);
    }
  }, [isPlaying, playingMessageIndex]);

  // 组件卸载时清理所有缓存的 blob URL
  useEffect(() => {
    return () => {
      ttsCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      ttsCacheRef.current.clear();
    };
  }, []);

  // 实时模式控制
  const handleSkipQuestion = async () => {
    if (!session || !currentQuestion) return;
    // 停止录音和TTS
    stopRecording();
    stop();
    if (prepTimerRef.current) clearTimeout(prepTimerRef.current);
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    await handleSubmitAnswer('');
  };

  const handlePauseInterview = () => {
    stop();
    stopRecording();
    if (prepTimerRef.current) clearTimeout(prepTimerRef.current);
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    setIsPaused(true);
  };

  const handleResumeInterview = () => {
    setRealtimeError(null);
    setIsPaused(false);
    setRealtimePhase('tts');
    realtimeTtsTriggeredRef.current = -1;
  };

  const handleExitInterview = () => {
    setShowCompleteConfirm(true);
  };

  // 语音播放（支持缓存复用）
  const handlePlayTts = async (text: string, messageIndex: number, autoPlay = false) => {
    if (!session) return;

    if (playingMessageIndex === messageIndex && isPlaying) {
      stop();
      setPlayingMessageIndex(null);
      return;
    }

    setPlayingMessageIndex(messageIndex);
    try {
      let url = ttsCacheRef.current.get(text);
      if (!url) {
        const blob = await interviewApi.synthesizeSpeech(session.sessionId, text);
        url = URL.createObjectURL(blob);
        ttsCacheRef.current.set(text, url);
      }
      play(url);
    } catch (err) {
      if (!autoPlay) {
        setError(err instanceof Error ? err.message : '语音合成失败');
      }
      setPlayingMessageIndex(null);
    }
  };

    // 配置界面
  const renderConfig = () => {
    return (
      <InterviewConfigPanel
        questionCount={questionCount}
        onQuestionCountChange={setQuestionCount}
        onStart={startInterview}
        onStartRealtime={startRealtimeInterview}
        isCreating={isCreating}
        checkingUnfinished={checkingUnfinished}
        unfinishedSession={unfinishedSession}
        onContinueUnfinished={handleContinueUnfinished}
        onStartNew={handleStartNew}
        resumeText={resumeText}
        onBack={onBack}
        error={error}
      />
    );
  };

    // 面试对话界面
  const renderInterview = () => {
    if (!session || !currentQuestion) return null;

    return (
      <InterviewChatPanel
        session={session}
        currentQuestion={currentQuestion}
        messages={messages}
        answer={answer}
        onAnswerChange={setAnswer}
        onSubmit={handleChatSubmitAnswer}
        onCompleteEarly={handleCompleteEarly}
        isSubmitting={isSubmitting}
        showCompleteConfirm={showCompleteConfirm}
        onShowCompleteConfirm={setShowCompleteConfirm}
        isTranscribing={isTranscribing}
        onPlayTts={handlePlayTts}
        playingTtsMessageIndex={playingMessageIndex}
        isRecording={isRecording}
        recordingDuration={recordingDuration}
        onToggleRecording={toggleRecording}
        analyserNode={analyserNode}
      />
    );
  };

  const renderRealtime = () => {
    if (!session || !currentQuestion) return null;

    return (
      <InterviewRealtimePanel
        session={session}
        currentQuestion={currentQuestion}
        phase={realtimePhase}
        prepCountdown={prepCountdown}
        recordingCountdown={recordingCountdown}
        recordingDuration={recordingDuration}
        analyserNode={analyserNode}
        onStopRecording={stopRecording}
        onSkipQuestion={handleSkipQuestion}
        onPauseInterview={handlePauseInterview}
        onResumeInterview={handleResumeInterview}
        onExitInterview={handleExitInterview}
        onRetry={audioBlob ? () => handleTranscribeAudio(audioBlob) : undefined}
        isPaused={isPaused}
        error={realtimeError}
      />
    );
  };

  const stageSubtitles = {
    config: '配置您的面试参数',
    interview: '认真回答每个问题，展示您的实力',
    realtime: '实时语音面试模式，模拟真实面试场景'
  };

    return (
    <div className="pb-6">
      {/* 页面头部 */}
        <motion.div
        className="text-center mb-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 flex items-center justify-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          模拟面试
        </h1>
            <p className="text-slate-500 dark:text-slate-400">{stageSubtitles[stage]}</p>
      </motion.div>

        <AnimatePresence mode="wait" initial={false}>
        {stage === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {isCreating ? <InterviewLoadingScreen /> : renderConfig()}
          </motion.div>
        )}
        {stage === 'interview' && (
          <motion.div
            key="interview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderInterview()}
          </motion.div>
        )}
        {stage === 'realtime' && (
          <motion.div
            key="realtime"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderRealtime()}
          </motion.div>
        )}
      </AnimatePresence>

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
  );
}

// 面试生成 loading 过渡页
function InterviewLoadingScreen() {
  const thinkingTexts = ['AI 正在分析简历…', '生成专属面试题目…', '构建面试场景…'];

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="relative max-w-md w-full">
        {/* 背景浮动光晕 */}
        <motion.div
          className="absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-primary-400/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-primary-300/20 blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        {/* 漂浮粒子 */}
        {[...Array(6)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-primary-500/40"
            style={{
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              left: `${15 + i * 14}%`,
              top: `${20 + (i % 2) * 60}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2.5 + i * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.2,
            }}
          />
        ))}

        <motion.div
          className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-12 text-center shadow-2xl shadow-slate-200/50 dark:shadow-none"
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* 顶部流光 */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />

          {/* 扫光效果 */}
          <motion.div
            className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
          />

          {/* 旋转轨道 + 脉冲圆环 */}
          <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
            {/* 外圈轨道 */}
            <motion.svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="12 12"
                className="text-primary-200 dark:text-primary-900/40"
              />
            </motion.svg>

            {/* 反向旋转的小球 */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            >
              <div className="absolute top-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-primary-400 shadow-md shadow-primary-500/40" />
            </motion.div>

            <motion.span
              className="absolute inset-2 rounded-full bg-primary-500/20"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.span
              className="absolute inset-5 rounded-full bg-primary-500/10"
              animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            />

            <motion.div
              className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </motion.div>
          </div>

          <motion.h3
            className="text-lg font-semibold text-slate-800 dark:text-slate-100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            AI 思考中
          </motion.h3>

          <motion.div
            className="mt-3 h-6 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              animate={{ y: [0, -24, -48, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="space-y-0"
            >
              {thinkingTexts.map((text, i) => (
                <p key={i} className="text-slate-500 dark:text-slate-400 h-6 flex items-center justify-center">
                  {text}
                </p>
              ))}
            </motion.div>
          </motion.div>

          {/* 动态进度点 */}
          <motion.div
            className="mt-5 flex items-center justify-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary-500"
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
              />
            ))}
          </motion.div>

          <motion.p
            className="mt-4 text-xs text-slate-400 dark:text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            正在根据您的简历定制面试题目，请稍候
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}
