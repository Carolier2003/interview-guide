FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (ffmpeg for pydub audio conversion)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (SiliconFlow 模式，不需要 torch/melotts/sherpa-onnx)
RUN pip install --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/ \
    fastapi>=0.110.0 \
    uvicorn[standard]>=0.27.0 \
    python-multipart>=0.0.9 \
    pydantic>=2.6.0 \
    pydantic-settings>=2.1.0 \
    httpx>=0.27.0 \
    pydub>=0.25.1 \
    numpy>=1.24.0 \
    dashscope>=1.24.0

# Copy application code
COPY . .

# Expose the service port
EXPOSE 8000

# Run the FastAPI application with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
