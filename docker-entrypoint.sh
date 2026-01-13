#!/bin/sh
set -e

# Runtime environment variable injection for the frontend
# This creates a config.js file that can be loaded by the app

# Default values
API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:8000/api/v1}"

# Create runtime config file
cat > /usr/share/nginx/html/config.js << EOF
window.__RUNTIME_CONFIG__ = {
  API_BASE_URL: "${API_BASE_URL}"
};
EOF

echo "Runtime config created with API_BASE_URL: ${API_BASE_URL}"

# Execute the main container command
exec "$@"
