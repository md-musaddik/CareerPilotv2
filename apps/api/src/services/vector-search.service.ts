import { config } from "../config/env.js";
import { ResumeChunkModel } from "../models/resume-chunk.model.js";
import type { ResumeChunkInput, ResumeChunkType, RetrievedResumeChunk } from "../types/rag.js";
import { createContentHash } from "./resume-chunk.service.js";

type VectorSearchParams = {
  userId: string;
  queryEmbedding: number[];
  limit: number;
  chunkTypes?: ResumeChunkType[];
};

type VectorSearchResult = {
  _id: { toString: () => string };
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

export async function replaceResumeChunkVectors(params: {
  userId: string;
  resumeDocumentId: string;
  parsedResumeId: string;
  chunks: ResumeChunkInput[];
  embeddings: number[][];
  embeddingModel: string;
}): Promise<void> {
  await ResumeChunkModel.deleteMany({
    userId: params.userId,
    parsedResumeId: params.parsedResumeId,
  });

  if (params.chunks.length === 0) {
    return;
  }

  await ResumeChunkModel.insertMany(
    params.chunks.map((chunk, index) => ({
      ...chunk,
      contentHash: createContentHash(chunk.text),
      embedding: params.embeddings[index],
      embeddingModel: params.embeddingModel,
    })),
  );
}

export async function searchResumeChunks(params: VectorSearchParams): Promise<RetrievedResumeChunk[]> {
  const filter: Record<string, unknown> = {
    userId: params.userId,
  };

  if (params.chunkTypes && params.chunkTypes.length > 0) {
    filter.chunkType = { $in: params.chunkTypes };
  }

  const results = await ResumeChunkModel.aggregate<VectorSearchResult>([
    {
      $vectorSearch: {
        index: config.mongoVectorSearchIndex,
        path: "embedding",
        queryVector: params.queryEmbedding,
        numCandidates: Math.max(params.limit * 10, 50),
        limit: params.limit,
        filter,
      },
    },
    {
      $project: {
        userId: 1,
        resumeDocumentId: 1,
        parsedResumeId: 1,
        chunkType: 1,
        chunkIndex: 1,
        text: 1,
        metadata: 1,
        createdAt: 1,
        updatedAt: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return results.map((result) => ({
    id: result._id.toString(),
    userId: result.userId,
    resumeDocumentId: result.resumeDocumentId,
    parsedResumeId: result.parsedResumeId,
    chunkType: result.chunkType,
    chunkIndex: result.chunkIndex,
    text: result.text,
    score: result.score,
    metadata: result.metadata,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }));
}

