export type ResumeSectionName = "skills" | "projects" | "experience" | "education";

export type StructuredResumeData = {
  skills: string[];
  projects: string[];
  experience: string[];
  education: string[];
};

export type EditableResumeProfile = {
  headline: string;
  summary: string;
  skills: string[];
  projects: string[];
  experience: string[];
  education: string[];
};

export type ResumeStorageProvider = "cloudinary" | "firebase-storage";

export type ResumeStorageReference = {
  provider: ResumeStorageProvider;
  reference: string;
  publicId?: string;
  resourceType?: string;
  secureUrl?: string;
};

export type ResumeMetadata = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storage: ResumeStorageReference;
  status: "uploaded" | "parsing" | "parsed" | "failed";
};

export type ResumeWorkflow = {
  resumeDocument: {
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    storage: ResumeStorageReference;
    status: string;
    createdAt?: string;
    updatedAt?: string;
  };
  parsedResume: {
    id: string;
    rawText: string;
    structuredData: StructuredResumeData;
    editableProfile: EditableResumeProfile;
    createdAt?: string;
    updatedAt?: string;
  };
};

export type CurrentResumeResponse = {
  resume: ResumeWorkflow | null;
};
