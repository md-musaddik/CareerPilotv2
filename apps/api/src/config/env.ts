import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });
dotenv.config();

type NodeEnv = "development" | "test" | "production";

type AppConfig = {
  nodeEnv: NodeEnv;
  port: number;
  clientUrl: string;
  corsOrigin: string[];
  logLevel: string;
  mongodbUri: string;
  mongodbDirectUri: string;
  mongodbDatabase: string;
  firebaseProjectId: string;
  firebaseClientEmail: string;
  firebasePrivateKey: string;
  cloudinaryUrl: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  cloudinaryFolder: string;
  openaiApiKey: string;
  openaiModel: string;
  openaiEmbeddingModel: string;
  mongoVectorSearchIndex: string;
  adzunaAppId: string;
  adzunaAppKey: string;
  adzunaCountry: string;
  joobleApiKey: string;
};

function readOptionalEnv(key: string): string {
  return process.env[key]?.trim() ?? "";
}

function readRequiredEnv(key: string): string {
  const value = readOptionalEnv(key);

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function readPort(): number {
  const rawPort = readOptionalEnv("PORT") || "4000";
  const port = Number.parseInt(rawPort, 10);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer.");
  }

  return port;
}

function readNodeEnv(): NodeEnv {
  const value = readOptionalEnv("NODE_ENV") || "development";

  if (value === "development" || value === "test" || value === "production") {
    return value;
  }

  throw new Error("NODE_ENV must be development, test, or production.");
}

function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, "\n");
}

function readOrigins(): string[] {
  const rawValue = readOptionalEnv("CORS_ORIGIN") || readOptionalEnv("CLIENT_URL") || "http://localhost:5173";

  return rawValue
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config: AppConfig = {
  nodeEnv: readNodeEnv(),
  port: readPort(),
  clientUrl: readOptionalEnv("CLIENT_URL") || "http://localhost:5173",
  corsOrigin: readOrigins(),
  logLevel: readOptionalEnv("LOG_LEVEL") || "info",
  mongodbUri: readRequiredEnv("MONGODB_URI"),
  mongodbDirectUri: readOptionalEnv("MONGODB_DIRECT_URI"),
  mongodbDatabase: readOptionalEnv("MONGODB_DATABASE") || "careerpilot",
  firebaseProjectId: readRequiredEnv("FIREBASE_PROJECT_ID"),
  firebaseClientEmail: readRequiredEnv("FIREBASE_CLIENT_EMAIL"),
  firebasePrivateKey: normalizePrivateKey(readRequiredEnv("FIREBASE_PRIVATE_KEY")),
  cloudinaryUrl: readOptionalEnv("CLOUDINARY_URL"),
  cloudinaryCloudName: readOptionalEnv("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: readOptionalEnv("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: readOptionalEnv("CLOUDINARY_API_SECRET"),
  cloudinaryFolder: readOptionalEnv("CLOUDINARY_FOLDER") || "careerpilot/resumes",
  openaiApiKey: readRequiredEnv("OPENAI_API_KEY"),
  openaiModel: readOptionalEnv("OPENAI_MODEL") || "gpt-4o-mini",
  openaiEmbeddingModel: readOptionalEnv("OPENAI_EMBEDDING_MODEL") || "text-embedding-3-small",
  mongoVectorSearchIndex: readOptionalEnv("MONGODB_VECTOR_SEARCH_INDEX") || "resume_chunks_vector_index",
  adzunaAppId: readRequiredEnv("ADZUNA_APP_ID"),
  adzunaAppKey: readRequiredEnv("ADZUNA_APP_KEY"),
  adzunaCountry: readOptionalEnv("ADZUNA_COUNTRY") || "us",
  joobleApiKey: readOptionalEnv("JOOBLE_API_KEY"),
};
