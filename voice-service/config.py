from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    service_port: int = 8000
    voice_provider: str = "local"  # local | siliconflow

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

    class Config:
        env_file = ".env"


settings = Settings()
