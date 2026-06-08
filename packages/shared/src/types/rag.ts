export type ResumeChunkType = "skills" | "projects" | "experience" | "education";

export type ResumeChunkInput = {
  userId: string;
  resumeDocumentId: string;
  parsedResumeId: string;
  chunkType: ResumeChunkType;
  chunkIndex: number;
  text: string;
  sourceId: string;
  metadata: {
    itemCount: number;
    source: "parsed_resume";
  };
};

export type RetrievedResumeChunk = {
  id: string;
  userId: string;
  resumeDocumentId: string;
  parsedResumeId: string;
  chunkType: ResumeChunkType;
  chunkIndex: number;
  text: string;
  score: number;
  metadata?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};
