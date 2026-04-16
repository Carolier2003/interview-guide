package interview.guide.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 语音服务配置属性
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.voice")
public class VoiceServiceProperties {

    private String serviceUrl = "http://localhost:8000";
    private int asrTimeout = 30000;
    private int ttsTimeout = 30000;
}
