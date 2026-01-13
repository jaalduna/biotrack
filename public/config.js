// Development runtime config
// This file is overwritten by docker-entrypoint.sh in production
window.__RUNTIME_CONFIG__ = {
  API_BASE_URL: "http://localhost:8000/api/v1"
};
