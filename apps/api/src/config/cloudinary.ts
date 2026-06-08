import { v2 as cloudinary } from "cloudinary";
import { config } from "./env.js";
import { HttpError } from "../utils/http-error.js";

let configured = false;

function hasExplicitCredentials(): boolean {
  return Boolean(config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret);
}

function parseCloudinaryUrl() {
  const parsedUrl = new URL(config.cloudinaryUrl);

  return {
    cloudName: parsedUrl.hostname,
    apiKey: decodeURIComponent(parsedUrl.username),
    apiSecret: decodeURIComponent(parsedUrl.password),
  };
}

export function getCloudinaryClient() {
  if (!config.cloudinaryUrl && !hasExplicitCredentials()) {
    throw new HttpError(
      503,
      "STORAGE_NOT_CONFIGURED",
      "Resume storage is not configured. Set Cloudinary credentials before uploading files.",
    );
  }

  if (!configured) {
    if (config.cloudinaryUrl) {
      const credentials = parseCloudinaryUrl();
      cloudinary.config({
        secure: true,
        cloud_name: credentials.cloudName,
        api_key: credentials.apiKey,
        api_secret: credentials.apiSecret,
      });
    } else {
      cloudinary.config({
        secure: true,
        cloud_name: config.cloudinaryCloudName,
        api_key: config.cloudinaryApiKey,
        api_secret: config.cloudinaryApiSecret,
      });
    }

    configured = true;
  }

  return cloudinary;
}
