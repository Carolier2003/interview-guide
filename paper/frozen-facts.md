# 项目事实底稿（冻结）

## 1. 基本信息
- **论文标题**：基于大语言模型的简历分析和模拟面试系统
- **学校**：湖南工商大学 计算机学院
- **类型**：本科毕业设计
- **项目名**：InterviewGuide（智能AI面试官平台）
- **代码仓库**：/Users/carol/workspace/interview-guide
- **当前分支**：feature/voice-asr-tts

## 2. 技术栈（已确认）

### 后端
- 语言：Java 21
- 框架：Spring Boot 4.0
- AI框架：Spring AI 2.0
- 数据库：PostgreSQL 14+ + pgvector扩展
- 缓存/消息队列：Redis 6+（Stream用于异步任务）
- 文档解析：Apache Tika 2.9.2
- PDF导出：iText 8.0.5
- 对象映射：MapStruct 1.6.3
- 构建工具：Gradle 8.14
- 对象存储：S3兼容存储（RustFS/MinIO）

### 前端
- 框架：React 18.3
- 语言：TypeScript 5.6
- 构建：Vite 5.4
- 样式：Tailwind CSS 4.1
- 路由：React Router 7.11
- 动画：Framer Motion 12.23
- 图表：Recharts 3.6

### 语音服务
- 框架：Python FastAPI
- ASR：sherpa-onnx (paraformer中文模型)
- TTS：MeloTTS
- 部署：uvicorn

### AI服务
- 模型：阿里云 DashScope (qwen-plus/qwen-max/qwen-long)
- API：百炼平台

## 3. 功能模块（已确认）

### 模块1：简历管理
- 多格式解析：PDF、DOCX、DOC、TXT
- 异步处理流：Redis Stream，状态流转 PENDING → PROCESSING → COMPLETED / FAILED
- 稳定性：失败自动重试（最多3次）、基于内容哈希的重复检测
- 分析报告导出：结构化PDF简历分析报告
- 核心实体：ResumeEntity（简历文件）、ResumeAnalysisEntity（评测结果）
- 评测维度：总分(0-100)、内容完整性(0-25)、结构清晰度(0-20)、技能匹配度(0-25)、表达专业性(0-15)、项目经验(0-15)

### 模块2：模拟面试
- 个性化出题：基于简历内容智能生成针对性面试题目
- 智能追问流：支持多轮智能追问（默认1条），线性问答流
- 分批评估机制：规避大模型Token溢出风险，长文本评估稳定性
- 智能汇总：对分批评估结果二次汇总，多维度改进建议、表现趋势与统计信息
- 报告导出：异步生成并导出PDF模拟面试评估报告
- 实时语音面试：ASR语音识别 + TTS语音合成（当前分支feature/voice-asr-tts已实现）
- 核心实体：InterviewSessionEntity（会话）、InterviewAnswerEntity（答案记录）
- 会话状态：CREATED → IN_PROGRESS → COMPLETED → EVALUATED

### 模块3：知识库管理
- 文档智能处理：PDF、DOCX、Markdown自动上传、分块、异步向量化
- RAG检索增强：集成向量数据库(pgvector)，检索增强生成(RAG)
- 流式响应：基于SSE(Server-Sent Events)的打字机式流式响应
- 智能问答：基于知识库内容的智能问答，知识库统计信息
- 核心实体：KnowledgeBaseEntity（知识库文档）、RagChatSessionEntity（聊天会话）、RagChatMessageEntity（聊天消息）
- 向量状态：PENDING → COMPLETED

## 4. 数据库实体关系（已确认）

### 简历域
- ResumeEntity：id, fileHash, originalFilename, fileSize, contentType, storageKey, storageUrl, resumeText, uploadedAt, lastAccessedAt, accessCount, analyzeStatus, analyzeError
- ResumeAnalysisEntity：id, resume(ManyToOne), overallScore, contentScore, structureScore, skillMatchScore, expressionScore, projectScore, summary, strengthsJson, suggestionsJson, analyzedAt

### 面试域
- InterviewSessionEntity：id, sessionId, resume(ManyToOne), totalQuestions, currentQuestionIndex, status, questionsJson, overallScore, overallFeedback, strengthsJson, improvementsJson, referenceAnswersJson, createdAt, completedAt, evaluateStatus, evaluateError
- InterviewAnswerEntity：id, session(ManyToOne), questionIndex, question, category, userAnswer, score, feedback, referenceAnswer, keyPointsJson, answeredAt

### 知识库域
- KnowledgeBaseEntity：id, fileHash, name, category, originalFilename, fileSize, contentType, storageKey, storageUrl, uploadedAt, lastAccessedAt, accessCount, questionCount, vectorStatus, vectorError, chunkCount
- RagChatSessionEntity：id, title, status, knowledgeBases(ManyToMany), messages(OneToMany), createdAt, updatedAt, messageCount, isPinned
- RagChatMessageEntity：id, session(ManyToOne), type(USER/ASSISTANT), content, messageOrder, createdAt, updatedAt, completed

## 5. 关键业务流程（已确认）

### 简历分析异步流程
上传请求 → 保存文件 → 发送消息到Redis Stream → 立即返回 → Consumer消费 → 执行分析任务 → 更新数据库状态 → 前端轮询获取最新状态

### 面试评估分批流程
长文本回答 → 按batch-size(默认8)分批 → 每批调用LLM评估 → 收集所有分批结果 → 二次汇总生成总体评价

### 语音面试流程
用户语音输入 → ASR(sherpa-onnx)转文字 → 发送给LLM生成回复 → TTS(MeloTTS)合成语音 → 播放给用户

### RAG问答流程
用户提问 → 查询重写/扩展 → pgvector向量检索 → 召回相关文档片段 → 构造Prompt上下文 → LLM生成回答 → SSE流式返回

## 6. 前端页面清单（用于截图）
- 简历库：HistoryPage.tsx
- 简历上传分析：UploadPage.tsx
- 简历分析详情：ResumeDetailPage.tsx
- 面试记录：InterviewHistoryPage.tsx
- 模拟面试：InterviewPage.tsx
- 知识库管理：KnowledgeBaseManagePage.tsx
- 知识库上传：KnowledgeBaseUploadPage.tsx
- 问答助手：KnowledgeBaseQueryPage.tsx

## 7. 冲突与采用口径
- 模板要求毕业设计≥15000字，样文约32000字 → **采用贴近样文目标（约32500字）**
- 模板要求参考文献≥30条（英文≥8篇） → **严格按模板执行**
- 项目README提到"打通模拟面试和知识库"为TODO未实现 → **论文中不写此功能，只写已实现功能**
- 当前分支feature/voice-asr-tts包含语音功能 → **纳入第4章作为独立模块**
