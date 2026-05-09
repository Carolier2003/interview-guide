import { request } from './request';
import type {
  CreateInterviewRequest,
  CurrentQuestionResponse,
  InterviewReport,
  InterviewSession,
  SubmitAnswerRequest,
  SubmitAnswerResponse
} from '../types/interview';

const SSE_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:8080';

export interface CreateSessionProgressEvent {
  phase: string;
  percent: number;
  message: string;
}

export interface CreateSessionStreamCallbacks {
  onProgress: (event: CreateSessionProgressEvent) => void;
  onSession: (session: InterviewSession) => void;
  onError: (error: Error) => void;
}

export interface TextSessionMeta {
  sessionId: string;
  skillId: string;
  difficulty: string;
  resumeId: number | null;
  totalQuestions: number;
  status: string;
  evaluateStatus: string | null;
  evaluateError: string | null;
  overallScore: number | null;
  createdAt: string;
  completedAt: string | null;
}

export const interviewApi = {
  /**
   * 列出所有文字面试会话
   */
  async listSessions(): Promise<TextSessionMeta[]> {
    return request.get<TextSessionMeta[]>('/api/interview/sessions');
  },

  /**
   * 创建面试会话
   */
  async createSession(req: CreateInterviewRequest): Promise<InterviewSession> {
    return request.post<InterviewSession>('/api/interview/sessions', req, {
      timeout: 180000, // 3分钟超时，AI生成问题需要时间
    });
  },

  /**
   * 创建面试会话（SSE 流式 + 进度推送）
   */
  async createSessionStream(
    req: CreateInterviewRequest,
    callbacks: CreateSessionStreamCallbacks,
    signal?: AbortSignal,
  ): Promise<void> {
    let response: Response;
    try {
      response = await fetch(`${SSE_BASE_URL}/api/interview/sessions/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(req),
        signal,
      });
    } catch (e) {
      callbacks.onError(e instanceof Error ? e : new Error(String(e)));
      return;
    }

    if (!response.ok) {
      let message = `请求失败 (${response.status})`;
      try {
        const data = await response.json();
        if (data && typeof data === 'object' && 'message' in data && data.message) {
          message = String(data.message);
        }
      } catch {
        // ignore parse error
      }
      callbacks.onError(new Error(message));
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError(new Error('无法获取响应流'));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    const dispatchEvent = (eventType: string, data: string) => {
      const trimmed = data.trim();
      if (!trimmed) return;
      try {
        if (eventType === 'progress') {
          callbacks.onProgress(JSON.parse(trimmed) as CreateSessionProgressEvent);
        } else if (eventType === 'session') {
          callbacks.onSession(JSON.parse(trimmed) as InterviewSession);
        } else if (eventType === 'error') {
          const errBody = JSON.parse(trimmed) as { code?: number; message?: string };
          callbacks.onError(new Error(errBody.message || '创建面试失败'));
        }
      } catch (parseErr) {
        callbacks.onError(parseErr instanceof Error ? parseErr : new Error(String(parseErr)));
      }
    };

    const processBlock = (block: string) => {
      let eventType = 'message';
      const dataLines: string[] = [];
      for (const rawLine of block.split('\n')) {
        const line = rawLine.replace(/\r$/, '');
        if (!line) continue;
        if (line.startsWith(':')) continue; // SSE comment
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).replace(/^ /, ''));
        }
      }
      if (dataLines.length > 0) {
        dispatchEvent(eventType, dataLines.join('\n'));
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim()) {
            processBlock(buffer);
          }
          break;
        }
        buffer += decoder.decode(value, { stream: true });

        let sepIndex: number;
        while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);
          processBlock(block);
        }
      }
    } catch (e) {
      callbacks.onError(e instanceof Error ? e : new Error(String(e)));
    }
  },

  /**
   * 获取会话信息
   */
  async getSession(sessionId: string): Promise<InterviewSession> {
    return request.get<InterviewSession>(`/api/interview/sessions/${sessionId}`);
  },

  /**
   * 获取当前问题
   */
  async getCurrentQuestion(sessionId: string): Promise<CurrentQuestionResponse> {
    return request.get<CurrentQuestionResponse>(`/api/interview/sessions/${sessionId}/question`);
  },

  /**
   * 提交答案
   */
  async submitAnswer(req: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    return request.post<SubmitAnswerResponse>(
      `/api/interview/sessions/${req.sessionId}/answers`,
      { questionIndex: req.questionIndex, answer: req.answer },
      {
        timeout: 180000, // 3分钟超时
      }
    );
  },

  /**
   * 获取面试报告
   */
  async getReport(sessionId: string): Promise<InterviewReport> {
    return request.get<InterviewReport>(`/api/interview/sessions/${sessionId}/report`, {
      timeout: 180000, // 3分钟超时，AI评估需要时间
    });
  },

  /**
   * 查找未完成的面试会话
   */
  async findUnfinishedSession(resumeId: number): Promise<InterviewSession | null> {
    try {
      return await request.get<InterviewSession>(`/api/interview/sessions/unfinished/${resumeId}`);
    } catch {
      // 如果没有未完成的会话，返回null
      return null;
    }
  },

  /**
   * 暂存答案（不进入下一题）
   */
  async saveAnswer(req: SubmitAnswerRequest): Promise<void> {
    return request.put<void>(
      `/api/interview/sessions/${req.sessionId}/answers`,
      { questionIndex: req.questionIndex, answer: req.answer }
    );
  },

  /**
   * 提前交卷
   */
  async completeInterview(sessionId: string): Promise<void> {
    return request.post<void>(`/api/interview/sessions/${sessionId}/complete`);
  },

  /**
   * 语音识别（ASR）
   */
  async transcribeAudio(sessionId: string, audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    const ext = audioBlob.type.includes('mp4')
      ? '.mp4'
      : audioBlob.type.includes('webm')
      ? '.webm'
      : '.webm';
    formData.append('audio', audioBlob, `recording${ext}`);
    return request.upload<string>(`/api/interview/sessions/${sessionId}/asr`, formData);
  },

  /**
   * 语音合成（TTS）
   */
  async synthesizeSpeech(sessionId: string, text: string): Promise<Blob> {
    const instance = request.getInstance();
    const response = await instance.post(
      `/api/interview/sessions/${sessionId}/tts`,
      { text },
      { responseType: 'blob' }
    );
    return response.data as Blob;
  },
};
