# Dockerfile برای Backend Python
FROM python:3.11-alpine

# تنظیم متغیرهای محیطی
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# تنظیم دایرکتوری کاری
WORKDIR /app

# نصب وابستگی‌های سیستمی
RUN apk update && apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev \
    && rm -rf /var/cache/apk/*

# کپی فایل requirements
COPY requirements.txt .

# نصب وابستگی‌های Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# کپی کد برنامه
COPY . .

# ایجاد کاربر غیر root برای امنیت
RUN adduser -D -s /bin/sh appuser && \
    chown -R appuser:appuser /app && \
    mkdir -p /app/data && \
    chown -R appuser:appuser /app/data

# تعویض به کاربر غیر root
USER appuser

# باز کردن پورت
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# دستور اجرا
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]