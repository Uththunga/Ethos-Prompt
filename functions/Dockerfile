# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies including curl for health checks
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libmagic1 \
    libmagic-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download spaCy model for Presidio (PII detection)
# This avoids 400MB download on every container startup
RUN python -m spacy download en_core_web_lg

# Pre-download NLTK data (punkt tokenizer, wordnet, etc.)
# This fixes "Resource 'tokenizers/punkt' not found" error
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('punkt_tab'); nltk.download('wordnet'); nltk.download('averaged_perceptron_tagger'); nltk.download('stopwords')"

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONPATH=/app:/app/src
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# ============================================================================
# PERFORMANCE OPTIMIZATION: Gunicorn Multi-Worker (Phase 2, Fix #5)
# Use Gunicorn with multiple Uvicorn workers for better concurrency
# Expected impact: +50-100% throughput (concurrent requests)
# ============================================================================
CMD ["gunicorn", "src.api.cloud_run_main:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "2", \
     "--timeout", "0", \
     "--keep-alive", "5", \
     "--max-requests", "1000", \
     "--max-requests-jitter", "100", \
     "--bind", "0.0.0.0:8080"]
