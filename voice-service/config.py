from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    service_port: int = 8000
    asr_model_dir: str = "./models/sherpa-onnx"
    asr_model_type: str = "paraformer"  # transducer | paraformer
    tts_language: str = "ZH"
    tts_device: str = "auto"  # cpu | cuda | auto

    class Config:
        env_file = ".env"


settings = Settings()
