#!/bin/sh
set -e

# Runtime environment variable injection for the frontend
# This creates a config.js file that can be loaded by the app

# Default values
API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:8000/api/v1}"
PORT="${PORT:-80}"

# Create runtime config file
cat > /usr/share/nginx/html/config.js << EOF
window.__RUNTIME_CONFIG__ = {
  API_BASE_URL: "${API_BASE_URL}"
};
EOF

echo "Runtime config created with API_BASE_URL: ${API_BASE_URL}"

# Substitute PORT variable in nginx config
export PORT
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.tmp
mv /etc/nginx/conf.d/default.conf.tmp /etc/nginx/conf.d/default.conf

echo "Nginx configured to listen on port: ${PORT}"

# Execute the main container command
exec "$@"
