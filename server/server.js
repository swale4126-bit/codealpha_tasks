import app from './app.js';
import env, { validateEnv } from './config/env.js';
import pool, { checkDbConnection } from './config/db.js';

async function startServer() {
  try {
    validateEnv();
    const dbInfo = await checkDbConnection();
    console.log(`Connected to PostgreSQL database: ${dbInfo.database}`);

    const server = app.listen(env.port, () => {
      console.log(`KoraMarket API listening on http://localhost:${env.port} [${env.nodeEnv}]`);
    });

    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Closing HTTP server and PostgreSQL pool...`);
      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start KoraMarket API:', error.message);
    process.exit(1);
  }
}

startServer();
