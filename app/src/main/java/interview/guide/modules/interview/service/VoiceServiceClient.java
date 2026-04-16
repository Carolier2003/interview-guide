package interview.guide.modules.interview.service;

import interview.guide.common.config.VoiceServiceProperties;
import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

/**
 * 语音服务客户端
 * 通过 HTTP 调用 Python 语音微服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VoiceServiceClient {

    private final VoiceServiceProperties voiceProperties;

    private RestClient restClient(int readTimeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        return RestClient.builder()
                .baseUrl(voiceProperties.getServiceUrl())
                .requestFactory(factory)
                .build();
    }

    private RestClient restClient() {
        return restClient(voiceProperties.getTtsTimeout());
    }

    /**
     * 语音识别（ASR）
     *
     * @param audioFile 音频文件
     * @return 识别出的文本
     */
    public String transcribe(MultipartFile audioFile) {
        try {
            MultiValueMap<String, Object> parts = new LinkedMultiValueMap<>();
            parts.add("audio", new MultipartFileResource(audioFile));

            ResponseEntity<Map> response = restClient(voiceProperties.getAsrTimeout())
                    .post()
                    .uri("/asr")
                    .body(parts)
                    .retrieve()
                    .toEntity(Map.class);

            Map<String, Object> body = response.getBody();
            if (body == null) {
                throw new BusinessException(ErrorCode.VOICE_ASR_FAILED);
            }

            if (body.containsKey("error")) {
                log.warn("ASR service returned error: {}", body.get("error"));
                throw new BusinessException(ErrorCode.VOICE_ASR_FAILED);
            }

            String text = (String) body.get("text");
            if (text == null) {
                throw new BusinessException(ErrorCode.VOICE_ASR_FAILED);
            }

            return text;
        } catch (ResourceAccessException e) {
            log.error("Voice service unavailable for ASR", e);
            throw new BusinessException(ErrorCode.VOICE_SERVICE_UNAVAILABLE);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("ASR failed", e);
            throw new BusinessException(ErrorCode.VOICE_ASR_FAILED);
        }
    }

    /**
     * 语音合成（TTS）
     *
     * @param text      待合成文本
     * @param speakerId 说话人ID
     * @return WAV 音频字节数组
     */
    public byte[] synthesize(String text, Integer speakerId) {
        try {
            ResponseEntity<byte[]> response = restClient()
                    .post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/tts")
                            .queryParam("text", text)
                            .queryParam("speaker_id", speakerId != null ? speakerId : 0)
                            .build())
                    .retrieve()
                    .toEntity(byte[].class);

            byte[] body = response.getBody();
            if (body == null || body.length == 0) {
                throw new BusinessException(ErrorCode.VOICE_TTS_FAILED);
            }

            return body;
        } catch (ResourceAccessException e) {
            log.error("Voice service unavailable for TTS", e);
            throw new BusinessException(ErrorCode.VOICE_SERVICE_UNAVAILABLE);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("TTS failed", e);
            throw new BusinessException(ErrorCode.VOICE_TTS_FAILED);
        }
    }

    /**
     * MultipartFile 包装为 InputStreamResource，保留原始文件名
     */
    private static class MultipartFileResource extends InputStreamResource {
        private final String filename;
        private final long contentLength;

        MultipartFileResource(MultipartFile file) throws IOException {
            super(file.getInputStream());
            this.filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "audio.webm";
            this.contentLength = file.getSize();
        }

        @Override
        public String getFilename() {
            return filename;
        }

        @Override
        public long contentLength() {
            return contentLength;
        }
    }
}
