import { getDatabaseStatus } from "../config/database.js";
import { config } from "../config/env.js";

export function getHealthStatus() {
  return {
    status: "ok",
    service: "careerpilot-api",
    version: "v1",
    environment: config.nodeEnv,
    database: {
      status: getDatabaseStatus(),
    },
    timestamp: new Date().toISOString(),
  };
}

