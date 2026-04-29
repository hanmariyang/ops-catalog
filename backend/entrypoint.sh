#!/usr/bin/env sh
set -e

echo "🔧 Applying migrations..."
python manage.py migrate --noinput

echo "📦 Collecting static files..."
python manage.py collectstatic --noinput || echo "⚠️ collectstatic skipped"

# Django superuser 자동 생성 (Railway 환경변수 사용 시)
echo "👤 Ensuring superuser (if env provided)..."
python manage.py shell <<'PY'
from django.contrib.auth import get_user_model
import os
username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")
email = os.environ.get("DJANGO_SUPERUSER_EMAIL") or "admin@example.com"
if username and password:
    User = get_user_model()
    u = User.objects.filter(username=username).first()
    if not u:
        User.objects.create_superuser(username=username, email=email, password=password)
        print(f"✓ Created superuser '{username}'")
    else:
        u.set_password(password)
        if email and u.email != email:
            u.email = email
        u.save()
        print(f"↪ Superuser '{username}' updated")
else:
    print("⚠ DJANGO_SUPERUSER_USERNAME/PASSWORD not set; skipping")
PY

echo "🚀 Starting Gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3 --timeout 120
