import mongoose from "mongoose";
import { config } from "./env.js";
import { logger } from "../utils/logger.js";

const connectionOptions = {
  dbName: config.mongodbDatabase,
  serverSelectionTimeoutMS: 10000,
};

export async function connectDatabase(): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);

  try {
    const connection = await mongoose.connect(config.mongodbUri, connectionOptions);

    logger.info("MongoDB connection established.");
    return connection;
  } catch (error) {
    const shouldUseDirectUri =
      config.mongodbDirectUri &&
      config.mongodbUri.startsWith("mongodb+srv://") &&
      error instanceof Error &&
      error.message.includes("querySrv");

    if (!shouldUseDirectUri) {
      throw error;
    }

    logger.info("Primary MongoDB SRV connection failed. Retrying with direct connection URI.");
    const fallbackConnection = await mongoose.connect(config.mongodbDirectUri, connectionOptions);

    logger.info("MongoDB connection established via direct URI fallback.");
    return fallbackConnection;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB connection closed.");
}

export function getDatabaseStatus(): string {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return states[mongoose.connection.readyState] ?? "unknown";
}
