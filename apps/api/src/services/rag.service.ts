import { config } from "../config/env.js";
import { ResumeChunkModel } from "../models/resume-chunk.model.js";
import type { StructuredResumeData } from "../types/resume.js";
import type { ResumeChunkType, RetrievedResumeChunk } from "../types/rag.js";
import { HttpError } from "../utils/http-error.js";
import { createEmbedding, createEmbeddings } from "./embedding.service.js";
import { createResumeChunks } from "./resume-chunk.service.js";
import { replaceResumeChunkVectors, searchResumeChunks } from "./vector-search.service.js";

export async function indexParsedResumeForRetrieval(params: {
  userId: string;
  resumeDocumentId: string;
  parsedResumeId: string;
  structuredData: StructuredResumeData;
}): Promise<void> {
  const chunks = createResumeChunks(params);
  const embeddings = await createEmbeddings(chunks.map((chunk) => chunk.text));

  if (embeddings.length !== chunks.length) {
    throw new HttpError(500, "EMBEDDING_COUNT_MISMATCH", "Embedding service returned an unexpected number of vectors.");
  }

  await replaceResumeChunkVectors({
    userId: params.userId,
    resumeDocumentId: params.resumeDocumentId,
    parsedResumeId: params.parsedResumeId,
    chunks,
    embeddings,
    embeddingModel: config.openaiEmbeddingModel,
  });
}

export async function retrieveRelevantResumeChunks(params: {
  userId: string;
  query: string;
  limit: number;
  chunkTypes?: ResumeChunkType[];
}): Promise<RetrievedResumeChunk[]> {
  const queryEmbedding = await createEmbedding(params.query);

  if (queryEmbedding.length === 0) {
    throw new HttpError(500, "QUERY_EMBEDDING_FAILED", "Unable to create a query embedding.");
  }

  return searchResumeChunks({
    userId: params.userId,
    queryEmbedding,
    limit: params.limit,
    chunkTypes: params.chunkTypes,
  });
}

export async function deleteResumeRetrievalIndex(params: {
  userId: string;
  parsedResumeId: string;
}): Promise<void> {
  await ResumeChunkModel.deleteMany({
    userId: params.userId,
    parsedResumeId: params.parsedResumeId,
  });
}
