import app from './app.js';
import { config } from './config.js';

const server = app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

function shutdown(signal: NodeJS.Signals): void {
  console.log(`${signal} received; shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
