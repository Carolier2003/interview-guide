package interview.guide.modules.knowledgebase.repository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Repository;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * 向量存储Repository
 * 负责向量数据的删除操作（通过 Qdrant REST API）
 */
@Slf4j
@Repository
public class VectorRepository {

    private final RestClient restClient;
    private final String collectionName;

    public VectorRepository(
            @Value("${spring.ai.vectorstore.qdrant.host:localhost}") String host,
            @Value("${spring.ai.vectorstore.qdrant.port:6334}") int grpcPort,
            @Value("${spring.ai.vectorstore.qdrant.collection-name:interview_guide_kb}") String collectionName,
            @Value("${spring.ai.vectorstore.qdrant.api-key:}") String apiKey) {

        // Qdrant REST API 使用 6333 端口（gRPC 是 6334，REST 是 6333）
        int restPort = (grpcPort == 6334) ? 6333 : grpcPort;
        String baseUrl = "http://" + host + ":" + restPort;

        RestClient.Builder builder = RestClient.builder().baseUrl(baseUrl);
        if (apiKey != null && !apiKey.isBlank()) {
            builder.defaultHeader("api-key", apiKey);
        }
        this.restClient = builder.build();
        this.collectionName = collectionName;
    }

    /**
     * 删除指定知识库的所有向量数据
     * <p>
     * 调用 Qdrant REST API：
     * POST /collections/{name}/points/delete
     * Body: { "filter": { "must": [{ "key": "kb_id", "match": { "value": "<id>" } }] } }
     *
     * @param knowledgeBaseId 知识库ID
     */
    public void deleteByKnowledgeBaseId(Long knowledgeBaseId) {
        log.info("开始删除知识库向量数据(Qdrant): kbId={}", knowledgeBaseId);

        // Qdrant payload filter：匹配 metadata 中 kb_id 字段等于该知识库ID字符串
        Map<String, Object> requestBody = Map.of(
            "filter", Map.of(
                "must", new Object[]{
                    Map.of(
                        "key", "kb_id",
                        "match", Map.of("value", knowledgeBaseId.toString())
                    )
                }
            )
        );

        try {
            restClient.post()
                .uri("/collections/{name}/points/delete", collectionName)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .toBodilessEntity();

            log.info("成功删除知识库向量数据: kbId={}", knowledgeBaseId);
        } catch (Exception e) {
            log.error("删除向量数据失败: kbId={}, error={}", knowledgeBaseId, e.getMessage(), e);
            throw new RuntimeException("删除向量数据失败: " + e.getMessage(), e);
        }
    }
}
