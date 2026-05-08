from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    service_port: int = 8000

    # ASR/TTS 可分别选择供应商: local | siliconflow | aliyun
    # voice_provider 作为默认值（asr_provider/tts_provider 未设置时生效）
    voice_provider: str = "local"
    asr_provider: str = ""
    tts_provider: str = ""

    # Local ASR/TTS
    asr_model_dir: str = "./models/sherpa-onnx"
    asr_model_type: str = "paraformer"  # transducer | paraformer
    tts_language: str = "ZH"
    tts_device: str = "auto"  # cpu | cuda | auto

    # SiliconFlow (cloud) ASR/TTS
    siliconflow_api_key: str = ""
    siliconflow_base_url: str = "https://api.siliconflow.cn/v1"
    siliconflow_asr_model: str = "FunAudioLLM/SenseVoiceSmall"
    siliconflow_tts_model: str = "fnlp/MOSS-TTSD-v0.5"
    siliconflow_tts_voice: str = "FunAudioLLM/CosyVoice2-0.5B:alex"

    # Aliyun Bailian (cloud) TTS
    aliyun_api_key: str = ""
    aliyun_asr_model: str = "fun-asr-realtime-2026-02-28"
    aliyun_tts_model: str = "cosyvoice-v3-flash"
    aliyun_tts_voice: str = "longanling_v3"

    def get_asr_provider(self) -> str:
        return self.asr_provider or self.voice_provider

    def get_tts_provider(self) -> str:
        return self.tts_provider or self.voice_provider

    class Config:
        env_file = ".env"


settings = Settings()
