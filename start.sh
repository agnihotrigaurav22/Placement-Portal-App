#!/bin/bash

# Cleanup background processes when the script stops (e.g., via Ctrl+C)
trap 'echo -e "\nStopping all background processes..."; kill $(jobs -p) 2>/dev/null; exit' EXIT INT TERM

echo "Activating virtual environment..."
source venv/bin/activate
export FLASK_APP=run.py
export FLASK_ENV=development

echo "Starting Redis (if not already running)..."
redis-cli ping > /dev/null 2>&1 || redis-server --daemonize yes

echo "Starting Celery worker in background..."
celery -A tasks.celery_app worker --loglevel=info &

echo "Starting Celery beat in background..."
celery -A tasks.celery_app beat --loglevel=info &

echo "Starting Flask Web Server..."
python run.py
