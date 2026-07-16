#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Resolve and set default ports API_PORT (3001) and PORT (7860)
export API_PORT=${API_PORT:-3001}
export PORT=${PORT:-7860}

echo "Starting Express API on port $API_PORT..."

# Start Express in the background
npm run start --workspace=api &
API_PID=$!

# Function to stop background API when Next exits or shell script stops
cleanup() {
  echo "Stopping services..."
  kill $API_PID 2>/dev/null || true
}
trap cleanup EXIT

echo "Waiting for API to be ready on port $API_PORT..."
cleanup_retries=0
for i in {1..30}; do
  # Try checking connection status using curl
  if curl -s http://127.0.0.1:$API_PORT/api-docs > /dev/null || curl -s http://127.0.0.1:$API_PORT/api > /dev/null || curl -s http://127.0.0.1:$API_PORT/ > /dev/null; then
    echo "API is ready on 127.0.0.1:$API_PORT!"
    break
  fi
  sleep 1
  cleanup_retries=$((cleanup_retries+1))
done

if [ $cleanup_retries -eq 30 ]; then
  echo "Warning: API was not detected on port $API_PORT, starting Next.js anyway..."
fi

echo "Starting Next.js Web on port $PORT..."
exec npm run start --workspace=web
