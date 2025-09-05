# TODO - ربات ترید حرفه‌ای

## مرحله 1: Backend Python FastAPI
- [ ] ایجاد ساختار پوشه‌های backend
- [ ] تنظیم FastAPI اصلی (main.py)
- [ ] پیکربندی امنیتی و رمزنگاری (security.py)
- [ ] مدل‌های Pydantic (models/)
- [ ] لایه انتزاعی صرافی‌ها (exchanges/)
- [ ] الگوریتم EMA+RSI (strategies/)
- [ ] API Endpoints (api/)
- [ ] مدیریت دیتابیس SQLite
- [ ] فایل requirements.txt
- [ ] Dockerfile برای backend

## مرحله 2: Frontend React تخصصی
- [ ] تبدیل Next.js به React Dashboard
- [ ] کامپوننت‌های داشبورد (Dashboard/)
- [ ] نمودار معاملاتی با Recharts (TradingChart.tsx)
- [ ] پنل سیگنال‌ها (SignalPanel.tsx)
- [ ] تنظیمات API و پارامترها (Settings/)
- [ ] بک‌تست و نتایج (Backtest/)
- [ ] API Client و WebSocket
- [ ] طراحی واکنش‌گرا با Tailwind

## مرحله 3: Docker و DevOps
- [ ] docker-compose.yml
- [ ] پیکربندی environment variables
- [ ] مسیر امن /data
- [ ] تنظیمات production

## مرحله 4: Image Processing (AUTOMATIC)
- [ ] **AUTOMATIC**: Process placeholder images (placehold.co URLs) → AI-generated images
  - This step executes automatically when placeholders are detected
  - No manual action required - system triggers automatically
  - Ensures all images are ready before testing

## مرحله 5: Testing & Validation
- [ ] تست API endpoints با curl
- [ ] تست الگوریتم معاملاتی
- [ ] تست اتصال صرافی‌ها
- [ ] تست امنیت رمزنگاری
- [ ] بررسی عملکرد Docker

## مرحله 6: Final Setup
- [ ] مستندات کامل
- [ ] راهنمای استقرار VPS
- [ ] تست نهایی با docker-compose up -d