import OpenAI from "openai";
import { config } from "../config/env.js";

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export async function createEmbedding(input: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: config.openaiEmbeddingModel,
    input,
  });

  return response.data[0]?.embedding ?? [];
}

export async function createEmbeddings(inputs: string[]): Promise<number[][]> {
  if (inputs.length === 0) {
    return [];
  }

  const response = await openai.embeddings.create({
    model: config.openaiEmbeddingModel,
    input: inputs,
  });

  return response.data
    .sort((left, right) => left.index - right.index)
    .map((item) => item.embedding);
}

