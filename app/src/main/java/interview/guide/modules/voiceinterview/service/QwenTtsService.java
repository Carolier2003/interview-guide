package interview.guide.modules.voiceinterview.service;

import interview.guide.modules.voiceinterview.config.VoiceInterviewProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.ByteArrayInputStream;
import java.net.http.HttpClient;
import java.time.Duration;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;

/**
 * TTS Service — delegates to Python voice-service (CosyVoice) via REST.
 *
 * The DashScope Java SDK QwenTtsRealtime WebSocket API has a control-frame
 * size limit bug, so we route TTS through our Python FastAPI microservice
 * which calls CosyVoice V3 (longanling_v3) via the stable dashscope Python SDK.
 */
@Slf4j
@Service
public class QwenTtsService {

    private final String voiceServiceUrl;

    public QwenTtsService(VoiceInterviewProperties voiceInterviewProperties) {
        // Docker 内部需用服务名而非 localhost
        String envUrl = System.getenv("VOICE_SERVICE_URL");
        this.voiceServiceUrl = (envUrl != null && !envUrl.isBlank())
            ? envUrl
            : "http://localhost:8000";
    }

    @PostConstruct
    public void init() {
        log.info("QwenTtsService initialized (CosyVoice via Python voice-service)");
    }

    public void reload(VoiceInterviewProperties voiceInterviewProperties) {
        log.info("QwenTtsService reloaded (no-op, CosyVoice via Python voice-service)");
    }

    /**
     * Synthesize text to PCM audio via Python voice-service.
     *
     * @param text Text to synthesize
     * @return PCM audio data (16-bit, mono, sample rate from CosyVoice output),
     *         or empty array on failure
     */
    public byte[] synthesize(String text) {
        if (text == null || text.trim().isEmpty()) {
            return new byte[0];
        }

        try {
            log.info("[TTS] Requesting synthesis for text (length: {})", text.length());
            byte[] wavBytes = restClient().post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/tts")
                            .queryParam("text", text)
                            .build())
                    .retrieve()
                    .toEntity(byte[].class)
                    .getBody();

            if (wavBytes == null || wavBytes.length <= 44) {
                log.warn("[TTS] Empty or invalid WAV response ({} bytes)", wavBytes == null ? 0 : wavBytes.length);
                return new byte[0];
            }

            // Extract PCM from WAV using Java Sound API (handles any WAV header format)
            byte[] pcm;
            try (AudioInputStream ais = AudioSystem.getAudioInputStream(new ByteArrayInputStream(wavBytes))) {
                pcm = ais.readAllBytes();
            }

            log.info("[TTS] Synthesis completed — WAV: {} bytes, PCM: {} bytes", wavBytes.length, pcm.length);
            return pcm;

        } catch (Exception e) {
            log.error("[TTS] Synthesis failed: {}", e.getMessage());
            return new byte[0];
        }
    }

    private RestClient restClient() {
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(60));
        return RestClient.builder()
                .baseUrl(voiceServiceUrl)
                .requestFactory(factory)
                .build();
    }

    @PreDestroy
    public void destroy() {
        log.info("QwenTtsService destroyed");
    }
}
