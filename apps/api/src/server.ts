import { createApp } from "./app/create-app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { config } from "./config/env.js";
import { getFirebaseAdminApp } from "./config/firebase-admin.js";
import { logger } from "./utils/logger.js";

async function bootstrap(): Promise<void> {
  getFirebaseAdminApp();
  await connectDatabase();

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info("CareerPilot API listening.", {
      environment: config.nodeEnv,
      port: config.port,
    });
  });

  const shutdown = async (signal: string) => {
    logger.info("Shutdown signal received.", { signal });
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

bootstrap().catch((error: unknown) => {
  logger.error("Failed to start CareerPilot API.", {
    message: error instanceof Error ? error.message : "Unknown startup error.",
  });
  process.exit(1);
});

