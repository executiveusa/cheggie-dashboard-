import { createApp } from './app';
import { getConfig } from './config';

const config = getConfig();
const app = createApp();

const server = app.listen(config.PORT, () => {
  console.log(`[control-api] Listening on port ${config.PORT} (${config.NODE_ENV})`);
  console.log(`[control-api] API docs: http://localhost:${config.PORT}/api/docs`);
});

process.on('SIGTERM', () => {
  console.log('[control-api] SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[control-api] SIGINT received, shutting down gracefully');
  server.close(() => process.exit(0));
});
