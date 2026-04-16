import os
import re
import tempfile
import wave
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse, Response
from pydub import AudioSegment

from config import settings

asr_recognizer = None
tts_model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global asr_recognizer, tts_model

    # Load ASR
    try:
        import sherpa_onnx

        model_path = os.path.join(settings.asr_model_dir, "model.onnx")
        tokens_path = os.path.join(settings.asr_model_dir, "tokens.txt")

        if os.path.exists(model_path) and os.path.exists(tokens_path):
            kwargs = {
                "tokens": tokens_path,
                "sample_rate": 16000,
                "feature_dim": 80,
                "decoding_method": "greedy_search",
                "provider": "cpu",
                "num_threads": 4,
            }
            if settings.asr_model_type == "paraformer":
                asr_recognizer = sherpa_onnx.OfflineRecognizer.from_paraformer(
                    paraformer=model_path, **kwargs
                )
            else:
                asr_recognizer = sherpa_onnx.OfflineRecognizer.from_transducer(
                    model=model_path, **kwargs
                )
            print(f"ASR loaded: {settings.asr_model_type} from {settings.asr_model_dir}")
        else:
            print(f"ASR model files not found in {settings.asr_model_dir}, /asr will return error")
    except Exception as e:
        print(f"Failed to load ASR: {e}")
        asr_recognizer = None

    # Load TTS
    try:
        from melo.api import TTS

        tts_model = TTS(language=settings.tts_language, device=settings.tts_device)
        print(f"TTS loaded for language {settings.tts_language}")
    except Exception as e:
        print(f"Failed to load TTS: {e}")
        tts_model = None

    yield

    asr_recognizer = None
    tts_model = None


app = FastAPI(lifespan=lifespan)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "asr_loaded": asr_recognizer is not None,
        "tts_loaded": tts_model is not None,
    }


@app.post("/asr")
async def asr(audio: UploadFile = File(...)):
    if asr_recognizer is None:
        return JSONResponse(
            status_code=503,
            content={"error": "ASR model not loaded"},
        )

    suffix = os.path.splitext(audio.filename or ".webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_in:
        content = await audio.read()
        tmp_in.write(content)
        tmp_in_path = tmp_in.name

    tmp_wav_path = tmp_in_path + ".wav"
    try:
        seg = AudioSegment.from_file(tmp_in_path)
        seg = seg.set_frame_rate(16000).set_channels(1)
        seg.export(tmp_wav_path, format="wav")
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": f"Audio conversion failed: {str(e)}"},
        )
    finally:
        if os.path.exists(tmp_in_path):
            os.unlink(tmp_in_path)

    try:
        with wave.open(tmp_wav_path, "rb") as wf:
            sample_rate = wf.getframerate()
            n_channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            num_frames = wf.getnframes()
            raw = wf.readframes(num_frames)

        if sampwidth == 2:
            samples = np.frombuffer(raw, dtype=np.int16)
        elif sampwidth == 4:
            samples = np.frombuffer(raw, dtype=np.int32)
        else:
            samples = np.frombuffer(raw, dtype=np.uint8)

        samples = samples.astype(np.float32)
        if sampwidth == 2:
            samples = samples / 32768.0
        elif sampwidth == 4:
            samples = samples / 2147483648.0
        else:
            samples = (samples - 128) / 128.0

        if n_channels > 1:
            samples = samples.reshape(-1, n_channels).mean(axis=1)

        stream = asr_recognizer.create_stream()
        stream.accept_waveform(sample_rate, samples)
        asr_recognizer.decode_stream(stream)
        result = stream.result.text
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"ASR inference failed: {str(e)}"},
        )
    finally:
        if os.path.exists(tmp_wav_path):
            os.unlink(tmp_wav_path)

    return {"text": result}


def clean_for_tts(text: str) -> str:
    """
    清洗文本，提升 MeloTTS 中文模型对混合内容的兼容性。
    - 去掉 Markdown 引用、连续分隔线
    - 统一换行为空格
    - 把顿号替换为逗号
    - 英文和数字前后加空格并转小写（MeloTTS 官方示例中小写英文支持更稳定）
    """
    # 去掉 Markdown 引用符号 >
    text = re.sub(r'^>\s*', ' ', text, flags=re.MULTILINE)
    # 去掉连续等号或横线组成的分隔线
    text = re.sub(r'\n[=-]{3,}\n', ' ', text)
    # 统一换行为空格
    text = text.replace('\n', ' ')
    # 顿号在英文术语前后容易丢音，替换为逗号
    text = text.replace('、', '，')
    # MeloTTS 中文模型对大写英文专有名词支持不佳，
    # 给英文/数字前后加空格并统一转小写，防止整句被丢弃
    text = re.sub(r'[a-zA-Z0-9]+', lambda m: f' {m.group().lower()} ', text)
    # 去掉多余空格
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


@app.post("/tts")
async def tts(text: str, speaker_id: int = 0):
    if tts_model is None:
        return JSONResponse(
            status_code=503,
            content={"error": "TTS model not loaded"},
        )

    cleaned_text = clean_for_tts(text)
    print(f"[TTS] raw ({len(text)} chars) -> cleaned ({len(cleaned_text)} chars)")

    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = tmp.name

        # melotts signature: tts_to_file(text, speaker_id, output_path, ...)
        tts_model.tts_to_file(
            cleaned_text,
            speaker_id,
            tmp_path,
            sdp_ratio=0.2,
            noise_scale=0.6,
            noise_scale_w=0.8,
        )

        with open(tmp_path, "rb") as f:
            audio_bytes = f.read()

        os.unlink(tmp_path)
        return Response(content=audio_bytes, media_type="audio/wav")
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"TTS inference failed: {str(e)}"},
        )
