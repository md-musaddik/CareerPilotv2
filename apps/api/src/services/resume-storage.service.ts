import type { ResumeStorageReference } from "@careerpilot/shared/types/resume";
import { getCloudinaryClient } from "../config/cloudinary.js";
import { config } from "../config/env.js";

type StoredResume = {
  storage: ResumeStorageReference;
};

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

function createPublicId(userId: string, fileName: string): string {
  return `${config.cloudinaryFolder}/${userId}/${Date.now()}-${sanitizeFileName(fileName)}`;
}

export async function uploadOriginalResume(params: {
  userId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<StoredResume> {
  const cloudinary = getCloudinaryClient();
  const publicId = createPublicId(params.userId, params.fileName);

  const uploadedAsset = await new Promise<{
    public_id: string;
    resource_type: string;
    secure_url: string;
  }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        access_mode: "authenticated",
        filename_override: params.fileName,
        public_id: publicId,
        resource_type: "raw",
        tags: ["careerpilot", "resume"],
        use_filename: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(params.buffer);
  });

  return {
    storage: {
      provider: "cloudinary",
      reference: uploadedAsset.public_id,
      publicId: uploadedAsset.public_id,
      resourceType: uploadedAsset.resource_type,
      secureUrl: uploadedAsset.secure_url,
    },
  };
}
