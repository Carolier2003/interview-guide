# 论文引用与参考文献来源对照文档

本文档列出毕业论文《基于大语言模型的简历分析和模拟面试系统》中全部 30 篇参考文献的引用出处与来源原文对照。

---

## [1] 车万翔, 窦志成, 冯岩松, 等. 大模型时代的自然语言处理: 挑战、机遇与发展

**论文中的引用位置**：
- 第1章 绪论：LLM在样本极少甚至没有样本的情况下就能理解开放域文本
- 第2章 需求分析：系统目标中说明基于大语言模型生成结构化评估报告
- 第4章 详细设计：简历AI评分模块说明大模型评估能力

**论文引用内容（第1章）**：
> LLM在样本极少甚至没有样本的情况下就能理解开放域文本[1]。

**来源查证**：
- 发表于《中国科学: 信息科学》2023 年第 53 卷第 9 期，页码 1645–1687。
- 该文系统讨论了大模型对 NLP 核心任务的冲击，明确提到大语言模型具备少样本（few-shot）与零样本（zero-shot）理解能力。

**状态**：FOUND — 期刊正式发表，CNKI 可检索。

---

## [2] 赵凯博, 李宇楠, 彭成, 等. 大模型发展综述: 从BERT到DeepSeek的技术演进

**论文中的引用位置**：
- 第1章 绪论：大模型技术演进
- 第4章 详细设计：分批评估策略背景（LLM上下文限制）
- 第5章 测试分析：长文本测试结论

**论文引用内容（第1章）**：
> 赵凯博等人系统梳理了从BERT到DeepSeek的大模型技术演进路线，指出预训练语言模型通过自监督学习在海量无标注文本上获得的语义理解能力，已成为垂直领域智能化改造的核心驱动力[2]。

**来源查证**：
- 发表于《微电子学与计算机》2026 年网络首发。
- 该文梳理了从 BERT 到 DeepSeek 的大模型技术演进路线，强调预训练语言模型的语义理解能力。

**状态**：FOUND — 网络首发，CNKI 可检索。

---

## [3] 刘梦瑶, 王武军, 彭继阳, 等. 大模型技术及其在垂直领域应用综述

**论文中的引用位置**：第1章 绪论

**论文引用内容**：
> 刘梦瑶等人进一步总结了以大语言模型、多模态大模型和AI智能体为代表的大模型技术体系在垂直领域的落地路径，认为其在招聘、医疗、金融等知识密集型场景中具有显著的应用潜力[3]。

**来源查证**：
- 发表于《计算机测量与控制》2026 年网络首发。
- 该文综述大模型技术体系及其在垂直领域（招聘、医疗、金融等）的应用潜力。

**状态**：FOUND — 网络首发，CNKI 可检索。

---

## [4] REIMERS N, GUREVYCH I. Sentence-BERT: Sentence embeddings using Siamese BERT-networks

**论文中的引用位置**：第1章 绪论（1.2.1节）

**论文引用内容**：
> Reimers与Gurevych提出的Sentence-BERT利用孪生与三元组网络结构生成语义有意义的句子嵌入，在保持BERT准确率的同时，将相似句对搜索时间从65小时缩短至约5秒[4]。

**来源原文（arXiv:1908.10084 Abstract）**：
> "In this publication, we present Sentence-BERT (SBERT), a modification of the pretrained BERT network that use siamese and triplet network structures to derive semantically meaningful sentence embeddings that can be compared using cosine-similarity. This reduces the effort for finding the most similar pair from 65 hours with BERT / RoBERTa to about 5 seconds with SBERT, while maintaining the accuracy from BERT."

**状态**：FOUND — 英文原文直接对应。发表于 EMNLP 2019。

---

## [5] ROSENBERGER J, WOLFRUM L, WEINZIERL S, et al. CareerBERT: Matching resumes to ESCO jobs in a shared embedding space for generic job recommendations

**论文中的引用位置**：
- 第1章 绪论（1.2.1节）：简历筛选领域的嵌入方法
- 第6章 总结展望（6.2节）：端到端闭环设计的对比背景

**论文引用内容（第1章）**：
> Rosenberger等人提出的CareerBERT则进一步将孪生网络与多负例排序损失相结合，在共享嵌入空间中表示简历与欧洲职业技能分类职位描述，实验表明其在人类专家评估中优于传统与最先进的嵌入方法[5]。

**来源原文（arXiv preprint 2503.02056v1, Section 1 / Section 5.1）**：
> "For the resume-job matching module, we employ a Siamese network architecture with a Multiple Negatives Ranking (MNR) loss function (Reimers and Gurevych, 2019). This approach allows us to learn a shared embedding space where semantically similar resumes and jobs are placed close to each other."
>
> "Our experimental results demonstrate that CareerBERT outperforms both traditional and state-of-the-art embedding approaches while showing robust effectiveness in human expert evaluations."

**状态**：FOUND — 英文原文直接对应。发表于 Expert Systems with Applications, 2025, 275: 127043。

---

## [6] QIN C, ZHU H, XU T, et al. An enhanced neural network approach to person-job fit in talent recruitment

**论文中的引用位置**：
- 第1章 绪论（1.2.1节）
- 第6章 总结展望（6.2节）

**论文引用内容（第1章）**：
> Qin等人提出了一种基于主题感知的端到端人岗匹配神经网络框架TAPJFNN，利用历史招聘数据自动学习岗位需求与求职者经历之间的语义映射，在人才搜索和岗位推荐任务上均取得了优于基线的方法[6]。

**来源原文（ACM Transactions on Information Systems, 2020, 38(2): 1-33）**：
> "We propose a novel end-to-end Topic-based Ability-aware Person-Job Fit Neural Network (TAPJFNN) framework, which has a goal of reducing the dependence on manual labor and can provide better interpretability about the fitting results."

**状态**：FOUND — 英文原文直接对应。DOI: 10.1145/3376927。

---

## [7] 蒋欣奕. 人工智能技术在招聘流程优化中的应用效果评估

**论文中的引用位置**：第1章 绪论

**论文引用内容**：
> 蒋欣奕指出，当前企业招聘面临周期冗长、人岗匹配度不足、人力成本高企等痛点，传统招聘模式已难以适配数字化时代需求，人工智能技术凭借算法优势，正逐步渗透简历筛选、面试评估等核心环节，为破解行业困境提供了新的技术路径[7]。

**来源查证**：
- 发表于《财经界》2026 年第 9 期，页码 174–176。
- 该文讨论人工智能技术（包括大语言模型）在招聘流程优化中的渗透与应用。

**状态**：FOUND — 期刊正式发表，CNKI 可检索，PDF 已下载确认。

---

## [8] 李家鹏. 网上招聘智能推荐系统研究

**论文中的引用位置**：第1章 绪论（1.2.1节）

**论文引用内容**：
> 李家鹏研究了基于协同过滤和深度学习的网上招聘智能推荐系统，通过融合用户画像与岗位特征实现精准匹配，为在线招聘平台的信息过载问题提供了系统化的解决方案[8]。

**来源查证**：
- 阜阳师范大学硕士学位论文，2024 年。
- 论文主题为网上招聘智能推荐，涉及协同过滤、深度学习与用户画像融合。

**状态**：FOUND — 硕士学位论文，CNKI 可检索。

---

## [9] YANG X. Research on personalized distance education recommendation system based on deep learning

**论文中的引用位置**：第1章 绪论（1.2.1节）

**论文引用内容**：
> Yang等人提出的POA-Apriori-MR-CNN混合方法在远程教育推荐任务中取得了较高的推荐准确率（Recall@10=0.8896），验证了深度学习在个性化推荐中的有效性[9]。

**来源原文（Scientific Reports, 2025, 15(1): 42158）**：
> "The research proposes a hybrid Putterfish Optimization Algorithm with Apriori (POA–Apriori)–Map-Reduce based Convolutional Neural Network (MR-CNN) methodology... The proposed model performed well with strong predictive performance of Precision@10 = 0.8769, Recall@10 = 0.8896, Normalized Discounted Cumulative Gain (NDCG)@10 = 0.8765."

**状态**：FOUND — 英文原文直接对应。DOI: 10.1038/S41598-025-26020-1。发表于 Nature 旗下 Scientific Reports 2025 年卷。

---

## [10] 周崇钦. 人工智能在事业单位人岗匹配中的应用

**论文中的引用位置**：第1章 绪论（1.2.1节）

**论文引用内容**：
> 周崇钦则从事业单位人力资源管理视角出发，提出通过构建精准人才画像与岗位画像、优化选人用人机制来实现人岗智能匹配，并强调人才画像需从硬实力与软实力两大维度进行动态优化[10]。

**来源查证**：
- 发表于《人才资源开发》2026 年第 4 期，页码 4–6。
- 该文从事业单位视角探讨人工智能在人岗匹配中的应用，涉及人才画像构建与硬实力/软实力维度。

**状态**：FOUND — 期刊正式发表，CNKI 可检索。

---

## [11] 陆苏于, 汪力宾, 沈心妮, 等. 基于多智能体协同的大学生就业面试训练系统"GEMINI+互感评估"工作流设计

**论文中的引用位置**：
- 第1章 绪论（1.2.2节）：模拟面试系统研究现状
- 第2章 需求分析：模拟面试模块智能追问需求
- 第4章 详细设计：题目生成个性化设计
- 第6章 总结展望（6.3节）：对话式反馈改进方向

**论文引用内容（第1章）**：
> 陆苏于等人提出了基于多智能体协同的大学生就业面试训练系统"GEMINI+互感评估"工作流，通过多智能体分工协作实现面试题目的自动生成、回答评估与反馈优化，为模拟面试系统的工程化设计提供了可复用的架构参考[11]。

**来源查证**：
- 发表于《电脑知识与技术》2025 年第 21 卷第 9 期，页码 68–70。
- 该文设计了多智能体协同的面试训练系统工作流，涵盖题目生成、回答评估与反馈优化。

**状态**：FOUND — 期刊正式发表，CNKI 可检索，PDF 已下载确认。

---

## [12] 袁乐, 刘绍华, 王禹, 等. 大语言模型检索增强生成优化技术研究综述

**论文中的引用位置**：
- 第1章 绪论（1.2.3节）：RAG技术综述
- 第2章 需求分析：知识库问答模块目标说明
- 第4章 详细设计：RAG链路架构与System Prompt设计

**论文引用内容（第1章）**：
> 袁乐等人在《计算机学报》发表的综述中总结了RAG的实际效果：通过动态引入外部数据库的信息，RAG在准确性和可信度上均有明显提升，特别是在需要最新领域知识的场景中[12]。

**来源查证**：
- 发表于《计算机学报》2026 年第 49 卷第 2 期，页码 383–422。
- 论文主题为 RAG 优化技术综述，涵盖检索增强技术分层及 LLM 内置知识与外部动态信息融合等论述。

**状态**：FOUND — 期刊正式发表，CNKI 可检索。

---

## [13] 李泽鸣, 王树良, 尚子贺, 等. 多模态检索增强生成驱动的文档问答综述(特邀)

**论文中的引用位置**：
- 第1章 绪论（1.2.3节）：MRAG文档问答研究进展
- 第5章 测试分析：向量检索性能分析
- 第6章 总结展望（6.3节）：GraphRAG演进方向

**论文引用内容（第1章）**：
> 李泽鸣等人进一步综述了多模态检索增强生成（MRAG）在文档问答中的研究进展，指出传统RAG方法在图文混合、长文档及跨文档推理任务中表现受限，而MRAG正由面向静态相似度匹配的检索机制演进为以生成与推理需求为中心的动态证据规划范式[13]。

**来源查证**：
- 发表于《计算机工程》2026 年第 52 卷第 4 期，页码 1–21。
- 该文综述 MRAG 在文档问答中的进展，讨论图文混合、长文档及跨文档推理中的检索机制演进。

**状态**：FOUND — 期刊正式发表，CNKI 可检索，PDF 已下载确认。

---

## [14] 包晓明. 基于检索增强生成的私有化AI问答系统研究

**论文中的引用位置**：
- 第1章 绪论（1.2.3节）：RAG工程实现
- 第4章 详细设计（4.4.1节、4.4.3节）：RAG System Prompt设计

**论文引用内容（第1章）**：
> 包晓明设计了基于检索增强生成的私有化AI问答系统，利用Neo4j与MySQL存储企业私有资源，结合语义依存树与检索器实现高精度意图理解和答案生成，实验表明其归一化折损累积增益值稳定在0.85以上[14]。

**来源查证**：
- 发表于《电子设计工程》2026 年第 34 卷第 8 期，页码 120–124。
- 该文设计了基于 RAG 的私有化 AI 问答系统，实验指标涉及归一化折损累积增益值（NDCG）。

**状态**：FOUND — 期刊正式发表，CNKI 可检索，PDF 已下载确认。

---

## [15] 霍福华, 韩慧. 基于Spring Boot微服务架构下前后端分离的MVVM模型

**论文中的引用位置**：
- 第2章 需求分析（2.1节）
- 第3章 总体设计（3.1.1节）

**论文引用内容**：
> 系统采用B/S架构，后端基于Spring Boot微服务构建，前端与后端通过RESTful API进行前后端分离式交互[15]。

**来源查证**：
- 发表于《电子技术与软件工程》2022 年第 1 期，页码 73–76。
- 该文探讨基于 Spring Boot 微服务架构下前后端分离的 MVVM 模型。

**状态**：FOUND — 期刊正式发表，CNKI 可检索。

---

## [16] 胡荣, 羊雪玲. 基于Spring Boot前后端分离Web系统的设计与实现

**论文中的引用位置**：
- 第2章 需求分析（2.1节）
- 第3章 总体设计（3.1.1节）

**论文引用内容**：
> 胡荣等人的研究表明，基于Spring Boot的前后端分离架构能够有效提升Web系统的开发效率和可维护性[16]。

**来源查证**：
- 发表于《新能源与智能网联》2024 年第 1 期，页码 88–97。
- 该文探讨基于 Spring Boot 前后端分离 Web 系统的设计与实现。

**状态**：FOUND — 期刊正式发表，CNKI 可检索。

---

## [17] 许鸿奎, 卢江坤, 张子枫, 等. 结合Conformer与N-gram的中文语音识别

**论文中的引用位置**：
- 第2章 需求分析（2.2.3节）
- 第4章 详细设计（4.3.2节）
- 第5章 测试分析（5.2.3节、5.4.2节）

**论文引用内容**：
> 许鸿奎等人的研究表明，结合Conformer编码器与N-gram语言模型的语音识别方案在中文场景下能够有效平衡识别准确率与解码速度[17]。

**来源查证**：
- 发表于《计算机系统应用》2022 年第 31 卷第 7 期，页码 194–202。
- 该文研究了结合 Conformer 与 N-gram 的中文语音识别方法。

**状态**：FOUND — 期刊正式发表，CNKI 可检索。

---

## [18] 高洁, 肖大军, 徐遐龄, 等. 多尺度富有表现力的汉语语音合成

**论文中的引用位置**：
- 第2章 需求分析（2.2.3节）
- 第4章 详细设计（4.3.3节）
- 第5章 测试分析（5.4.2节）

**论文引用内容**：
> 多尺度表现力语音合成方法能够在保持自然度的同时对全局韵律和音素级基频进行精细建模[18]。

**来源查证**：
- 发表于《数据采集与处理》2023 年第 38 卷第 6 期，页码 1458–1468。
- 该文研究了多尺度富有表现力的汉语语音合成方法。

**状态**：FOUND — 期刊正式发表，CNKI 可检索。

---

## [19] 陈建海, 陈淼, 浦云明, 等. 基于微服务架构B/S系统的性能分析

**论文中的引用位置**：
- 第3章 总体设计（3.1.1节）
- 第5章 测试分析（5.3.2节）

**论文引用内容**：
> 陈建海等人对基于微服务架构的B/S系统进行了性能分析，研究表明合理的服务拆分和负载均衡策略能够有效提升系统的并发处理能力[19]。

**来源查证**：
- 发表于《计算机系统应用》2020 年第 29 卷第 2 期，页码 233–237。
- 该文对基于微服务架构的 B/S 系统进行性能测试与分析。

**状态**：FOUND — 期刊正式发表，CNKI 可检索。

---

## [20] 宋琦敏. 简历自动获取与信息提取系统设计与实现

**论文中的引用位置**：
- 第1章 绪论（1.2.1节）
- 第4章 详细设计（4.1.1节）

**论文引用内容**：
> 宋琦敏设计并实现了简历自动获取与信息提取系统，通过规则匹配与统计学习相结合的方法完成了半结构化简历的自动解析[20]。

**来源查证**：
- 华中科技大学硕士学位论文，2020 年。
- CNKI 中国优秀硕士学位论文全文数据库收录。
- 论文主题为简历自动获取与信息提取系统设计与实现。

**状态**：FOUND — 硕士学位论文，CNKI 可检索。

---

## [21] 冯立. 基于深度学习的中文简历信息实体识别研究

**论文中的引用位置**：
- 第1章 绪论（1.2.1节）
- 第4章 详细设计（4.1.1节、4.1.3节）

**论文引用内容**：
> 冯立研究了基于深度学习的中文简历命名实体识别方法，针对简历文本的半结构化特点设计了领域适配的NER模型[21]。

**来源查证**：
- 武汉轻工大学硕士学位论文，2024 年。
- CNKI 中国硕士学位论文全文数据库收录，学校代码 10496。
- 论文主题为基于深度学习的中文简历信息实体识别。

**状态**：FOUND — 硕士学位论文，CNKI 可检索。

---

## [22] 杨济萍. 基于自然语言处理的简历信息抽取与识别研究

**论文中的引用位置**：第1章 绪论（1.2.1节）

**论文引用内容**：
> 杨济萍结合BERT预训练模型对简历信息进行抽取与识别，提升了中文简历关键字段的提取准确率[22]。

**来源查证**：
- 兰州交通大学硕士学位论文，2022 年。
- 万方数据库收录（thesis_D02910252），学科为统计学。
- 论文主题为基于自然语言处理的简历信息抽取与识别，涉及 BERT、BiLSTM 等模型。

**状态**：FOUND — 硕士学位论文，CNKI/万方可检索。

---

## [23] 张书祥. 基于CNN和多头Attention融合算法的简历信息提取和匹配应用研究

**论文中的引用位置**：第1章 绪论（1.2.1节）

**论文引用内容**：
> 张书祥将CNN与多头注意力机制融合应用于简历信息提取和匹配，通过局部特征提取与全局语义关联的协同建模实现了更高精度的人岗匹配[23]。

**来源查证**：
- 武汉轻工大学硕士学位论文，2024 年。
- CNKI 中国硕士学位论文全文数据库收录。
- 与冯立为同校同年硕士论文。

**状态**：FOUND — 硕士学位论文，CNKI 可检索。

---

## [24] 尹源. 基于机器学习的企业互联网招聘中简历筛选研究

**论文中的引用位置**：第1章 绪论（1.2.1节）

**论文引用内容**：
> 尹源研究了基于机器学习的企业互联网招聘简历筛选方法，构建了面向大规模简历数据的分类筛选模型[24]。

**来源查证**：
- 南京邮电大学硕士学位论文，2020 年。
- CNKI 中国硕士学位论文全文数据库收录。
- 正式题名《基于机器学习的企业互联网招聘中简历筛选研究》。

**状态**：FOUND — 硕士学位论文，CNKI 可检索。

---

## [25] KARMAKAR P, TENG W S, LU G. Thank you for attention: A survey on attention-based artificial neural networks for automatic speech recognition

**论文中的引用位置**：第4章 详细设计（4.3.2节）

**论文引用内容**：
> Karmakar等人对基于注意力机制的神经网络在自动语音识别系统中的应用进行了全面综述，梳理了注意力模型在离线与流式语音识别场景中的发展脉络[25]。

**来源原文（Intelligent Systems with Applications, 2024, 23: 200406）**：
> "Attention is a very popular and effective mechanism in artificial neural network-based sequence-to-sequence models. In this survey paper, a comprehensive review of the different attention models used in developing automatic speech recognition systems is provided. The paper focuses on the development and evolution of attention models for offline and streaming speech recognition within recurrent neural network- and Transformer-based architectures."

**状态**：FOUND — 英文原文直接对应。DOI: 10.1016/J.ISWA.2024.200406。发表于 Elsevier 旗下 Intelligent Systems with Applications 2024 年卷。

---

## [26] KARTHIKEYAN V, SARANYA P, NATCHIYAR M. A lightweight bidirectional GRU–DCNN hybrid framework for end-to-end automatic speech recognition

**论文中的引用位置**：第4章 详细设计（4.3.2节）

**论文引用内容**：
> Karthikeyan等人提出的轻量化双向GRU与DCNN混合架构，在CHiME-5、TED-LIUM和LibriSpeech数据集上分别取得了34.65%、10.65%和10.08%的词错误率，验证了该方案的有效性[26]。

**来源原文（Microsystem Technologies, 2026, 32(5): 57）**：
> "In this work a lightweight end-to-end deep convolutional neural network (DCNN) is suggested... The suggested bidirectional GRU layer is a computationally effective framework used in lightweight DCNNs to enhance overall system efficiency... The word error rate (WER) of 34.65% was obtained by applying this dataset to the proposed bidirectional GRU-based DCNN framework. Also the suggested model performance is validated using the TED-LIUM and LibriSpeech datasets. Our proposed model achieved 10.65% WER on the TED-LIUM dataset and 10.08% WER on LibriSpeech."

**状态**：FOUND — 英文原文直接对应。DOI: 10.1007/S00542-025-05973-3。发表于 Springer 旗下 Microsystem Technologies 2026 年卷。

---

## [27] WANG Q, WU B, XU M, et al. HyperSynergyX: Synergistic drug combination prediction via hypergraph modeling and knowledge graph-enhanced retrieval-augmented generation

**论文中的引用位置**：第4章 详细设计（4.4.1节）

**论文引用内容**：
> Wang等人提出的HyperSynergyX框架通过双偏置随机游走超图（DBRWH）建模药物高阶相互作用，并结合知识图谱增强RAG实现协同推理与可解释性增强[27]。

**来源原文（IEEE Journal of Biomedical and Health Informatics, 2026）**：
> "To address this, we introduce HyperSynergyX, an explainable framework that integrates synergy prediction with mechanistic explanation. Its core predictive component, a Dual-Biased Random Walk on Hypergraphs (DBRWH), models higher-order interactions among drugs on a three-drug hypergraph and identifies latent combination patterns via tensor decomposition."

**状态**：FOUND — 英文原文直接对应。DOI: 10.1109/JBHI.2026.3673550。发表于 IEEE JBHI 2026 年。

---

## [28] KYURKCHIEV P, ILIEV A, KYURKCHIEV N. Semantic search for system dynamics models using vector embeddings in a cloud microservices environment

**论文中的引用位置**：第4章 详细设计（4.4.1节）

**论文引用内容**：
> Kyurkchiev等人采用Qdrant向量数据库进行语义搜索实验，在与全文检索、关键词检索和BM25的对比中，语义搜索取得了超过90%的精确率，显著优于传统关键词检索的24.8%精确率基线[28]。

**来源原文（Future Internet, 2026, 18(2): 86, MDPI）**：
> "The main goal of this research is to investigate the applicability of modern semantic search techniques... The proposed approach achieves over 90% precision, significantly outperforming traditional keyword-based search with a baseline of 24.8% precision."

**状态**：FOUND — 英文期刊论文，DOI 10.3390/FI18020086，MDPI Future Internet 2026 年卷，CNKI 可检索，PDF 已下载确认。

---

## [29] 何苗. 面向智能招聘的人岗匹配方法研究

**论文中的引用位置**：
- 第1章 绪论（1.2.1节）
- 第6章 总结展望（6.2节）

**论文引用内容**：
> 何苗从智能招聘视角系统研究了人岗匹配的关键技术，提出了融合多源异构信息的人岗匹配方法，为简历筛选系统的算法设计提供了理论支撑[29]。

**来源查证**：
- 国防科技大学博士学位论文，2022 年。
- CNKI 中国博士学位论文全文数据库（CDFD）收录。
- 正式题名《面向智能招聘的人岗匹配方法研究》，系统研究了人岗匹配关键技术。

**状态**：FOUND — 博士学位论文，CNKI 可检索。

---

## [30] 王先淏. 基于对比学习的智能简历匹配系统的研究与实现

**论文中的引用位置**：
- 第1章 绪论（1.2.1节）
- 第6章 总结展望（6.2节）

**论文引用内容**：
> 王先淏将对比学习引入简历与岗位匹配任务，在共享表示空间中对齐简历特征与岗位需求特征，实验表明对比学习策略能够显著提升匹配精度[30]。

**来源查证**：
- 北京邮电大学硕士学位论文，2025 年。
- CNKI 中国硕士学位论文全文数据库收录。
- 正式题名《基于对比学习的智能简历匹配系统的研究与实现》。

**状态**：FOUND — 硕士学位论文，CNKI 可检索。

---

## [31] 孔繁恒, 高永祺, 张子帅, 等. 基于检查与生成混合模型的个性化聊天机器人系统的设计与实现

**论文中的引用位置**：
- 第1章 绪论（1.2.2节）
- 第6章 总结展望（6.3节）

**论文引用内容**：
> 孔繁恒等人设计并实现了基于检查与生成混合模型的个性化聊天机器人系统，通过混合推理机制提升了多轮对话的连贯性和个性化程度[31]。

**来源查证**：
- 发表于《软件工程》2022 年第 25 卷第 11 期，页码 23–27。
- 该文设计了个性化聊天机器人系统。

**状态**：FOUND — 期刊正式发表，CNKI 可检索。

---

## 引用分布汇总

| 章节 | 引用编号 | 说明 |
|:---|:---|:---|
| 第1章 绪论 | [1]–[10] | 文献综述，简历筛选与LLM背景，涵盖10篇 |
| 第2章 需求分析 | [1], [11], [12], [15], [16], [17], [18] | 系统目标与模块需求支撑，7篇 |
| 第3章 总体设计 | [15], [16], [19] | 架构设计章节，3篇 |
| 第4章 详细设计与实现 | [1], [11], [12], [13], [14], [17], [18], [20]–[24], [25], [26], [27], [28] | 各模块关键技术选型与实现依据，17篇 |
| 第5章 系统测试与分析 | [2], [13], [17], [18], [19] | 测试结果分析依据，5篇 |
| 第6章 总结与展望 | [5], [6], [11], [13], [29], [30], [31] | 创新点对比与后续研究方向，7篇 |

---

## 文献类别汇总

| 类别 | 文献编号 | 可在线获取原文 | 备注 |
|:---|:---|:---|:---|
| 中文学术论文（期刊） | [1], [7], [10], [11]–[14], [15]–[19] | 是（CNKI） | 正式发表 |
| 中文学术论文（网络首发） | [2], [3] | 是（CNKI） | 网络首发 |
| 中文学位论文 | [8], [20]–[24], [29], [30] | 是（CNKI/万方） | 硕士/博士学位论文 |
| 英文学术期刊论文 | [4], [5], [6], [9], [25], [26], [27], [28] | 是（arXiv/ACM/ESWA/Nature/Springer/Elsevier/IEEE/MDPI） | [4] EMNLP 2019，[5] ESWA 2025，[6] ACM TOIS 2020，[9] Scientific Reports 2025，[25] ISA 2024，[26] Microsystem Technologies 2026，[27] IEEE JBHI 2026，[28] Future Internet 2026 |

---

## 英文文献清单（可验证来源）

| 编号 | 作者 | 标题 | 来源 | DOI/URL | 引用位置 |
|:---|:---|:---|:---|:---|:---|
| [4] | Reimers N, Gurevych I | Sentence-BERT | arXiv/EMNLP 2019 | 10.48550/arXiv.1908.10084 | 第1章 |
| [5] | Rosenberger J et al. | CareerBERT | Expert Systems with Applications 2025 | 10.1016/j.eswa.2025.127043 | 第1章、第6章 |
| [6] | Qin C et al. | TAPJFNN人岗匹配 | ACM TOIS 2020 | 10.1145/3376927 | 第1章、第6章 |
| [9] | Yang X | 个性化远程教育推荐 | Scientific Reports 2025 | 10.1038/S41598-025-26020-1 | 第1章 |
| [25] | Karmakar P et al. | ASR注意力机制综述 | Intelligent Systems with Applications 2024 | 10.1016/J.ISWA.2024.200406 | 第4章 |
| [26] | Karthikeyan V et al. | GRU-DCNN语音识别 | Microsystem Technologies 2026 | 10.1007/S00542-025-05973-3 | 第4章 |
| [27] | Wang Q et al. | HyperSynergyX知识图谱增强RAG | IEEE JBHI 2026 | 10.1109/JBHI.2026.3673550 | 第4章 |
| [28] | Kyurkchiev P et al. | 向量嵌入语义搜索 | Future Internet 2026 | 10.3390/FI18020086 | 第4章 |

英文文献共 **8篇**，全部可验证来源。
