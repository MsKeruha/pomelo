#!/bin/sh

echo "Waiting for postgres..."

while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done

echo "PostgreSQL started"

# Run migrations
echo "Running alembic migrations..."
alembic upgrade head

# Run seeder
echo "Running database seeder..."
python seed.py

# Start the application
echo "Starting FastAPI backend..."
# Using uvicorn directly instead of main.py to ensure it runs correctly in Docker
# and listens on all interfaces.
uvicorn main:app --host 0.0.0.0 --port 8000
