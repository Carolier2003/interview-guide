import json
import textwrap
from pathlib import Path

from playwright.sync_api import sync_playwright

OUTPUT_DIR = Path("/Users/carol/workspace/interview-guide/paper")

DIAGRAMS = {
    "chapter3_fig2.png": """
flowchart TB
    A[基于大语言模型的简历分析和模拟面试系统]
    A --> B[简历管理模块]
    A --> C[模拟面试模块]
    A --> D[实时语音面试模块]
    A --> E[知识库管理模块]

    B --> B1[简历上传]
    B --> B2[异步AI分析]
    B --> B3[分析详情查看]
    B --> B4[PDF报告导出]

    C --> C1[面试创建]
    C --> C2[实时问答]
    C --> C3[智能追问]
    C --> C4[自动评估]
    C --> C5[面试报告导出]

    D --> D1[语音输入 ASR]
    D --> D2[语音播报 TTS]
    D --> D3[语音状态管理]

    E --> E1[文档上传]
    E --> E2[异步向量化]
    E --> E3[RAG智能问答]
    E --> E4[会话管理]
""",
    "chapter3_fig3.png": """
erDiagram
    RESUME ||--o| RESUME_ANALYSIS : "生成"
    RESUME ||--o{ INTERVIEW_SESSION : "关联"
    INTERVIEW_SESSION ||--o{ INTERVIEW_ANSWER : "包含"
    RAG_CHAT_SESSION ||--o{ RAG_CHAT_MESSAGE : "包含"
    RAG_CHAT_SESSION }o--o{ KNOWLEDGE_BASE : "关联"

    RESUME {
        Long id PK
        String fileHash UK
        String originalFilename
        Long fileSize
        String contentType
        String storageKey
        String storageUrl
        Text resumeText
        LocalDateTime uploadedAt
        LocalDateTime lastAccessedAt
        Integer accessCount
        String analyzeStatus
        String analyzeError
    }

    RESUME_ANALYSIS {
        Long id PK
        Long resume_id FK
        Integer overallScore
        Integer contentScore
        Integer structureScore
        Integer skillMatchScore
        Integer expressionScore
        Integer projectScore
        Text summary
        Text strengthsJson
        Text suggestionsJson
        LocalDateTime analyzedAt
    }

    INTERVIEW_SESSION {
        Long id PK
        String sessionId UK
        Long resume_id FK
        Integer totalQuestions
        Integer currentQuestionIndex
        String status
        Text questionsJson
        Text referenceAnswersJson
        Integer overallScore
        Text overallFeedback
        Text strengthsJson
        Text improvementsJson
        LocalDateTime createdAt
        LocalDateTime completedAt
        String evaluateStatus
        String evaluateError
    }

    INTERVIEW_ANSWER {
        Long id PK
        Long session_id FK
        Integer questionIndex
        Text question
        String category
        Text userAnswer
        Integer score
        Text feedback
        Text referenceAnswer
        Text keyPointsJson
        LocalDateTime answeredAt
    }

    KNOWLEDGE_BASE {
        Long id PK
        String fileHash UK
        String name
        String category
        String originalFilename
        Long fileSize
        String contentType
        String storageKey
        String storageUrl
        LocalDateTime uploadedAt
        LocalDateTime lastAccessedAt
        Integer accessCount
        Integer questionCount
        String vectorStatus
        String vectorError
        Integer chunkCount
    }

    RAG_CHAT_SESSION {
        Long id PK
        String title
        String status
        LocalDateTime createdAt
        LocalDateTime updatedAt
        Integer messageCount
        Boolean isPinned
    }

    RAG_CHAT_MESSAGE {
        Long id PK
        Long session_id FK
        String type
        Text content
        Integer messageOrder
        LocalDateTime createdAt
        LocalDateTime updatedAt
        Boolean completed
    }
""",
    "chapter3_fig4.png": """
flowchart LR
    A[求职者] -->|简历文件/面试回答/问答消息| B((智能面试辅助系统))
    B -->|分析报告/面试反馈/AI回答| A
""",
    "chapter3_fig5.png": """
flowchart TB
    A[用户] -->|简历文件| B[简历管理模块]
    A -->|面试配置与回答| C[模拟面试模块]
    A -->|语音数据| D[实时语音面试模块]
    A -->|知识库文档与问题| E[知识库管理模块]

    B -->|简历元数据| F[(PostgreSQL)]
    B -->|文件数据| G[S3对象存储]
    B -->|异步分析任务| H[(Redis Stream)]

    C -->|会话与答案数据| F
    C -->|异步评估任务| H

    D -->|识别文本/合成语音| A
    D <-->|语音服务调用| I[Python语音服务]
    I --> C

    E -->|文档元数据/向量数据| F
    E -->|文档文件| G
    E -->|异步向量化任务| H

    H --> J[LLM分析/评估/向量化]
    J --> F
    J --> K[阿里云DashScope API]
""",
    "chapter4_fig1.png": """
flowchart TB
    subgraph Controller层
        A[ResumeController]
    end
    subgraph Service层
        B[ResumeUploadService]
        C[ResumeParseService]
        D[ResumeStorageService]
        E[ResumeQueryService]
        F[ResumeExportService]
    end
    subgraph Persistence层
        G[ResumeRepository]
        H[ResumeAnalysisRepository]
    end
    subgraph 异步处理层
        I[AnalyzeStreamProducer]
        J[AnalyzeStreamConsumer]
        K[ResumeGradingService]
    end
    subgraph 外部服务
        L[(PostgreSQL)]
        M[(S3对象存储)]
        N[(Redis Stream)]
        O[DashScope LLM API]
    end
    A --> B & E & F
    B --> C & D & G & I
    E --> G & H
    F --> H
    G --> L
    H --> L
    D --> M
    I --> N
    J --> N
    J --> K --> O
    K --> H
""",
    "chapter4_fig2.png": """
flowchart TB
    subgraph Controller层
        A[InterviewController]
    end
    subgraph Service层
        B[InterviewSessionService]
        C[InterviewQueryService]
        D[AnswerEvaluationService]
        E[InterviewExportService]
    end
    subgraph 缓存层
        F[(Redis)]
    end
    subgraph Persistence层
        G[InterviewSessionRepository]
        H[InterviewAnswerRepository]
    end
    subgraph 异步处理层
        I[EvaluateStreamProducer]
        J[EvaluateStreamConsumer]
    end
    subgraph 外部服务
        K[DashScope LLM API]
    end
    A --> B & C & E
    B --> F & G & H & I
    C --> G & H
    D --> H & K
    E --> G & H
    I --> J
    J --> D
""",
    "chapter4_fig3.png": """
flowchart LR
    A[React前端] -->|HTTP| B[Spring Boot后端]
    B -->|HTTP| C[Python语音服务<br/>FastAPI]
    C --> D[sherpa-onnx<br/>ASR模型]
    C --> E[MeloTTS<br/>TTS模型]
""",
    "chapter4_fig4.png": """
flowchart TB
    subgraph 前端
        A[KnowledgeBaseManagePage]
        B[KnowledgeBaseUploadPage]
        C[KnowledgeBaseQueryPage]
    end
    subgraph Controller层
        D[KnowledgeBaseController]
    end
    subgraph Service层
        E[KnowledgeBaseUploadService]
        F[KnowledgeBaseQueryService]
        G[VectorStoreService]
    end
    subgraph 数据层
        H[(PostgreSQL)]
        I[(pgvector向量表)]
        J[(S3对象存储)]
    end
    subgraph 外部AI服务
        K[Embedding模型 API]
        L[DashScope LLM API]
    end
    A --> D
    B --> D
    C --> D
    D --> E & F
    E --> G & H & J
    F --> G & H & L
    G --> I & K
""",
}

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
html, body {{
    margin: 0;
    padding: 20px;
    background: #ffffff;
}}
.mermaid {{
    display: flex;
    justify-content: center;
}}
</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
mermaid.initialize({{
    startOnLoad: false,
    theme: 'base',
    themeVariables: {{
        primaryColor: '#ffffff',
        primaryTextColor: '#000000',
        primaryBorderColor: '#000000',
        lineColor: '#000000',
        secondaryColor: '#ffffff',
        tertiaryColor: '#ffffff',
        background: '#ffffff',
        mainBkg: '#ffffff',
        secondBkg: '#ffffff',
        nodeBorder: '#000000',
        clusterBkg: '#f0f0f0',
        clusterBorder: '#000000',
        titleColor: '#000000',
        edgeLabelBackground: '#ffffff',
        nodeTextColor: '#000000',
        // ER diagram
        entityBorder: '#000000',
        entityBkColor: '#ffffff',
        attributeBorder: '#000000',
        attributeBkColor: '#ffffff',
        entityLabelColor: '#000000',
        attributeLabelColor: '#000000',
        // Flowchart
        cScale0: '#ffffff',
        cScale1: '#ffffff',
        cScale2: '#ffffff',
    }},
    themeCSS: `
        .node rect, .node circle, .node ellipse, .node polygon, .node path {{
            fill: #ffffff !important;
            stroke: #000000 !important;
            stroke-width: 1.5px !important;
        }}
        .node .label, .nodeLabel, text {{
            fill: #000000 !important;
            color: #000000 !important;
        }}
        .cluster rect {{
            fill: #f0f0f0 !important;
            stroke: #000000 !important;
            stroke-width: 1.5px !important;
        }}
        .cluster .label, .clusterLabel {{
            fill: #000000 !important;
        }}
        .edge-thickness-normal, .edge-thickness-thick {{
            stroke: #000000 !important;
        }}
        .edge-pattern-solid {{
            stroke: #000000 !important;
        }}
        .arrowheadPath {{
            fill: #000000 !important;
            stroke: #000000 !important;
        }}
        .edgeLabel {{
            background-color: #ffffff !important;
            fill: #000000 !important;
        }}
        .edgeLabel rect {{
            fill: #ffffff !important;
            stroke: #000000 !important;
        }}
        /* ER diagram */
        .er.entityBox {{
            fill: #ffffff !important;
            stroke: #000000 !important;
        }}
        .er.attributeBoxOdd, .er.attributeBoxEven {{
            fill: #ffffff !important;
            stroke: #000000 !important;
        }}
        .er.entityLabel, .er.attributeLabel {{
            fill: #000000 !important;
        }}
        .er.relationshipLabel {{
            fill: #000000 !important;
        }}
        .er.relationshipLabelBox {{
            fill: #ffffff !important;
            stroke: #000000 !important;
        }}
    `
}});
</script>
</head>
<body>
<div class="mermaid">
{diagram}
</div>
<script>
async function render() {{
    await mermaid.run();
    // Post-process: force any remaining colored fills to white
    document.querySelectorAll('svg *').forEach(el => {{
        const style = el.getAttribute('style') || '';
        if (style.includes('fill:') && !style.includes('fill:#000') && !style.includes('fill: #000') && !style.includes('fill:rgb(0')) {{
            // Keep black fills (text/arrowheads), convert others to white or transparent
            const fillVal = el.getAttribute('fill');
            if (fillVal && fillVal !== 'none' && fillVal !== '#000000' && fillVal !== 'black') {{
                el.setAttribute('fill', '#ffffff');
            }}
        }}
    }});
    document.body.setAttribute('data-rendered', 'true');
}}
render();
</script>
</body>
</html>
"""


def render_diagram(name: str, source: str) -> Path:
    out_path = OUTPUT_DIR / name
    html = HTML_TEMPLATE.format(diagram=source.strip())

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 2000, "height": 2000})
        page.set_content(html)
        # Wait for mermaid to render
        page.wait_for_selector("[data-rendered='true']", timeout=30000)
        # Small extra delay for layout
        page.wait_for_timeout(500)

        svg = page.locator(".mermaid svg")
        bbox = svg.bounding_box()
        if bbox:
            # Add padding
            padding = 20
            page.set_viewport_size({
                "width": int(bbox["width"] + padding * 2),
                "height": int(bbox["height"] + padding * 2),
            })
            svg.screenshot(path=str(out_path))
        else:
            page.screenshot(path=str(out_path))
        browser.close()

    return out_path


def main():
    for name, source in DIAGRAMS.items():
        print(f"Rendering {name} ...")
        try:
            path = render_diagram(name, source)
            print(f"  Saved: {path}")
        except Exception as e:
            print(f"  ERROR: {e}")


if __name__ == "__main__":
    main()
