#!/bin/bash
set -e

echo "🔧 Applying migrations..."
python -u manage.py migrate --noinput

echo "🚀 Starting development server (Django runserver)..."
exec python -u manage.py runserver 0.0.0.0:8000 --verbosity 2
