import asyncio
import os
import re
import tempfile
import wave
from contextlib import asynccontextmanager
from typing import Optional

import dashscope
import httpx
import numpy as np
from dashscope.audio.asr import Recognition, RecognitionCallback, RecognitionResult
from dashscope.audio.tts_v2 import SpeechSynthesizer
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse, Response
from pydub import AudioSegment

from config import settings

# Cloud API 重试次数
CLOUD_MAX_RETRIES = 2

asr_recognizer = None
tts_model = None


def _load_local_asr():
    global asr_recognizer
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


def _load_local_tts():
    global tts_model
    try:
        from melo.api import TTS

        tts_model = TTS(language=settings.tts_language, device=settings.tts_device)
        print(f"TTS loaded for language {settings.tts_language}")
    except Exception as e:
        print(f"Failed to load TTS: {e}")
        tts_model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global asr_recognizer, tts_model

    if settings.get_asr_provider() == "local":
        _load_local_asr()
    if settings.get_tts_provider() == "local":
        _load_local_tts()
    if settings.get_asr_provider() != "local" or settings.get_tts_provider() != "local":
        print(f"ASR provider='{settings.get_asr_provider()}', TTS provider='{settings.get_tts_provider()}'")

    yield

    asr_recognizer = None
    tts_model = None


app = FastAPI(lifespan=lifespan)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "asr_provider": settings.get_asr_provider(),
        "tts_provider": settings.get_tts_provider(),
        "asr_loaded": (
            asr_recognizer is not None if settings.get_asr_provider() == "local"
            else bool(settings.siliconflow_api_key) if settings.get_asr_provider() == "siliconflow"
            else bool(settings.aliyun_api_key) if settings.get_asr_provider() == "aliyun"
            else False
        ),
        "tts_loaded": (
            tts_model is not None if settings.get_tts_provider() == "local"
            else bool(settings.aliyun_api_key) if settings.get_tts_provider() == "aliyun"
            else bool(settings.siliconflow_api_key) if settings.get_tts_provider() == "siliconflow"
            else False
        ),
    }


async def _asr_siliconflow(audio: UploadFile):
    suffix = os.path.splitext(audio.filename or ".webm")[1] or ".webm"
    content = await audio.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    last_error = None
    try:
        for attempt in range(CLOUD_MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient() as client:
                    with open(tmp_path, "rb") as f:
                        files = {
                            "file": (
                                audio.filename or "audio.webm",
                                f,
                                audio.content_type or "application/octet-stream",
                            )
                        }
                        data = {"model": settings.siliconflow_asr_model}
                        resp = await client.post(
                            f"{settings.siliconflow_base_url}/audio/transcriptions",
                            headers={"Authorization": f"Bearer {settings.siliconflow_api_key}"},
                            files=files,
                            data=data,
                            timeout=90.0,
                        )
                        resp.raise_for_status()
                        result = resp.json()

                text = result.get("text", "")
                return {"text": text}
            except Exception as e:
                last_error = e
                if attempt < CLOUD_MAX_RETRIES:
                    wait = 2 ** attempt
                    print(f"SiliconFlow ASR attempt {attempt + 1} failed, retrying in {wait}s: {e}")
                    await asyncio.sleep(wait)
                else:
                    print(f"SiliconFlow ASR failed after {CLOUD_MAX_RETRIES + 1} attempts: {e}")

        return JSONResponse(
            status_code=500,
            content={"error": f"ASR inference failed: {str(last_error)}"},
        )
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)




# ---- Aliyun ASR ----

class _AliyunASRCallback(RecognitionCallback):
    def __init__(self):
        self.sentences: list[str] = []
        self.current_text = ""
        self.error_msg: Optional[str] = None

    def on_event(self, result: RecognitionResult) -> None:
        sentence = result.get_sentence()
        if 'text' in sentence:
            self.current_text = sentence['text']
            if RecognitionResult.is_sentence_end(sentence):
                self.sentences.append(sentence['text'])

    def on_complete(self) -> None:
        pass

    def on_error(self, message) -> None:
        self.error_msg = getattr(message, 'message', str(message))


def _run_asr_recognition(wav_path: str, api_key: str, model: str) -> str:
    """Blocking: stream PCM data through Recognition WebSocket."""
    dashscope.api_key = api_key

    with wave.open(wav_path, 'rb') as wf:
        pcm_data = wf.readframes(wf.getnframes())

    callback = _AliyunASRCallback()
    recognition = Recognition(
        model=model,
        format='pcm',
        sample_rate=16000,
        language_hints=['zh'],
        callback=callback,
    )

    recognition.start()
    try:
        chunk_size = 3200
        for i in range(0, len(pcm_data), chunk_size):
            recognition.send_audio_frame(pcm_data[i:i + chunk_size])
    finally:
        recognition.stop()

    if callback.error_msg:
        raise Exception(f"ASR recognition failed: {callback.error_msg}")

    text = ''.join(callback.sentences) if callback.sentences else callback.current_text
    text = text.strip()
    print(f"[ASR] result: {text!r}, sentences={callback.sentences}, current={callback.current_text!r}")
    return text


async def _asr_aliyun(audio: UploadFile):
    suffix = os.path.splitext(audio.filename or ".webm")[1] or ".webm"
    content = await audio.read()
    print(f"[ASR] received: filename={audio.filename!r}, content_type={audio.content_type!r}, size={len(content)} bytes")

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    tmp_wav_path = tmp_path + ".wav"
    try:
        seg = AudioSegment.from_file(tmp_path)
        print(f"[ASR] audio: channels={seg.channels}, frame_rate={seg.frame_rate}, duration={len(seg)/1000:.1f}s")
        seg = seg.set_frame_rate(16000).set_channels(1)
        seg.export(tmp_wav_path, format="wav")
    except Exception as e:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        return JSONResponse(
            status_code=400,
            content={"error": f"Audio conversion failed: {str(e)}"},
        )
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    last_error = None
    try:
        for attempt in range(CLOUD_MAX_RETRIES + 1):
            try:
                text = await asyncio.to_thread(
                    _run_asr_recognition, tmp_wav_path,
                    settings.aliyun_api_key, settings.aliyun_asr_model,
                )
                return {"text": text}
            except Exception as e:
                last_error = e
                if attempt < CLOUD_MAX_RETRIES:
                    wait = 2 ** attempt
                    print(f"Aliyun ASR attempt {attempt + 1} failed, retrying in {wait}s: {e}")
                    await asyncio.sleep(wait)
                else:
                    print(f"Aliyun ASR failed after {CLOUD_MAX_RETRIES + 1} attempts: {e}")

        return JSONResponse(
            status_code=500,
            content={"error": f"ASR inference failed: {str(last_error)}"},
        )
    finally:
        if os.path.exists(tmp_wav_path):
            os.unlink(tmp_wav_path)


@app.post("/asr")
async def asr(audio: UploadFile = File(...)):
    if settings.get_asr_provider() == "siliconflow":
        return await _asr_siliconflow(audio)

    if settings.get_asr_provider() == "aliyun":
        return await _asr_aliyun(audio)

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
    - 英文转小写（MeloTTS 官方示例中小写英文支持更稳定）
    """
    # 去掉 Markdown 引用符号 >
    text = re.sub(r'^>\s*', ' ', text, flags=re.MULTILINE)
    # 去掉连续等号或横线组成的分隔线
    text = re.sub(r'\n[=-]{3,}\n', ' ', text)
    # 统一换行为空格
    text = text.replace('\n', ' ')
    # 顿号替换为逗号
    text = text.replace('、', '，')
    # 半角逗号转全角逗号（MeloTTS 中文前端对全角标点更稳定）
    text = text.replace(',', '，')
    # 英文转小写，但不添加额外空格，保持紧贴中文（参考官方示例）
    text = re.sub(r'[a-zA-Z0-9]+', lambda m: m.group().lower(), text)
    # 去掉多余空格
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def split_sentences_zh(text: str):
    """按中文标点将文本切分为短句，过滤空句和纯标点句。"""
    parts = re.split(r'([，。！？])', text)
    sentences = []
    current = ''
    for part in parts:
        current += part
        if part in '，。！？':
            stripped = current.strip()
            # 保留有实质内容的句子（包含汉字、字母或数字）
            if stripped and re.search(r'[\u4e00-\u9fffa-zA-Z0-9]', stripped):
                sentences.append(stripped)
            current = ''
    last = current.strip()
    if last and re.search(r'[\u4e00-\u9fffa-zA-Z0-9]', last):
        sentences.append(last)
    return sentences if sentences else [text]


async def _tts_siliconflow(text: str, speaker_id: int = 0):
    headers = {
        "Authorization": f"Bearer {settings.siliconflow_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.siliconflow_tts_model,
        "input": text,
        "voice": settings.siliconflow_tts_voice,
        "response_format": "mp3",
        "stream": False,
    }

    last_error = None
    mp3_bytes = None
    for attempt in range(CLOUD_MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{settings.siliconflow_base_url}/audio/speech",
                    headers=headers,
                    json=payload,
                    timeout=60.0,
                )
                resp.raise_for_status()
                mp3_bytes = resp.content
            break
        except Exception as e:
            last_error = e
            if attempt < CLOUD_MAX_RETRIES:
                wait = 2 ** attempt
                print(f"SiliconFlow TTS attempt {attempt + 1} failed, retrying in {wait}s: {e}")
                await asyncio.sleep(wait)
            else:
                print(f"SiliconFlow TTS failed after {CLOUD_MAX_RETRIES + 1} attempts: {e}")

    if mp3_bytes is None:
        return JSONResponse(
            status_code=500,
            content={"error": f"TTS inference failed: {str(last_error)}"},
        )

    # mp3 -> wav
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp.write(mp3_bytes)
        mp3_path = tmp.name

    wav_path = mp3_path + ".wav"
    try:
        seg = AudioSegment.from_mp3(mp3_path)
        seg.export(wav_path, format="wav")
        with open(wav_path, "rb") as f:
            audio_bytes = f.read()
    except Exception as e:
        print(f"SiliconFlow TTS audio conversion failed: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"TTS audio conversion failed: {str(e)}"},
        )
    finally:
        if os.path.exists(mp3_path):
            os.unlink(mp3_path)
        if os.path.exists(wav_path):
            os.unlink(wav_path)

    return Response(content=audio_bytes, media_type="audio/wav")




# ---- Aliyun TTS ----

async def _tts_aliyun(text: str):
    dashscope.api_key = settings.aliyun_api_key

    last_error = None
    mp3_bytes: Optional[bytes] = None
    for attempt in range(CLOUD_MAX_RETRIES + 1):
        try:
            synthesizer = SpeechSynthesizer(
                model=settings.aliyun_tts_model,
                voice=settings.aliyun_tts_voice,
            )
            result = synthesizer.call(text)
            if synthesizer.get_last_request_id():
                mp3_bytes = result
                break
            else:
                raise Exception(f"TTS call returned error: {result}")
        except Exception as e:
            last_error = e
            if attempt < CLOUD_MAX_RETRIES:
                wait = 2 ** attempt
                print(f"Aliyun TTS attempt {attempt + 1} failed, retrying in {wait}s: {e}")
                await asyncio.sleep(wait)
            else:
                print(f"Aliyun TTS failed after {CLOUD_MAX_RETRIES + 1} attempts: {e}")

    if mp3_bytes is None:
        return JSONResponse(
            status_code=500,
            content={"error": f"TTS inference failed: {str(last_error)}"},
        )

    # mp3 -> wav
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp.write(mp3_bytes)
        mp3_path = tmp.name

    wav_path = mp3_path + ".wav"
    try:
        seg = AudioSegment.from_mp3(mp3_path)
        seg.export(wav_path, format="wav")
        with open(wav_path, "rb") as f:
            audio_bytes = f.read()
    except Exception as e:
        print(f"Aliyun TTS audio conversion failed: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"TTS audio conversion failed: {str(e)}"},
        )
    finally:
        if os.path.exists(mp3_path):
            os.unlink(mp3_path)
        if os.path.exists(wav_path):
            os.unlink(wav_path)

    return Response(content=audio_bytes, media_type="audio/wav")


@app.post("/tts")
async def tts(text: str, speaker_id: int = 0):
    if settings.get_tts_provider() == "siliconflow":
        return await _tts_siliconflow(text, speaker_id)

    if settings.get_tts_provider() == "aliyun":
        return await _tts_aliyun(text)

    if tts_model is None:
        return JSONResponse(
            status_code=503,
            content={"error": "TTS model not loaded"},
        )

    cleaned_text = clean_for_tts(text)
    sentences = split_sentences_zh(cleaned_text)
    print(f"[TTS] raw ({len(text)} chars) -> cleaned ({len(cleaned_text)} chars), split={len(sentences)}")

    combined = AudioSegment.empty()
    success_count = 0

    for idx, sent in enumerate(sentences):
        print(f"[TTS] sentence {idx}: {sent}")
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp_path = tmp.name

            # melotts signature: tts_to_file(text, speaker_id, output_path, ...)
            tts_model.tts_to_file(
                sent,
                speaker_id,
                tmp_path,
                sdp_ratio=0.2,
                noise_scale=0.6,
                noise_scale_w=0.8,
            )

            seg = AudioSegment.from_wav(tmp_path)
            combined += seg
            success_count += 1
            os.unlink(tmp_path)
        except Exception as e:
            print(f"[TTS] sentence {idx} failed: {e}")
            # 失败时插入 0.2s 静音，避免音频跳变
            combined += AudioSegment.silent(duration=200)

    if success_count == 0:
        return JSONResponse(
            status_code=500,
            content={"error": "TTS inference failed for all sentences"},
        )

    # 导出合并后的音频
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        out_path = tmp.name
    combined.export(out_path, format="wav")

    with open(out_path, "rb") as f:
        audio_bytes = f.read()
    os.unlink(out_path)

    return Response(content=audio_bytes, media_type="audio/wav")
