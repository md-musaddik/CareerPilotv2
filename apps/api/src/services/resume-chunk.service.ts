import { createHash } from "node:crypto";
import type { StructuredResumeData } from "../types/resume.js";
import type { ResumeChunkInput, ResumeChunkType } from "../types/rag.js";

const chunkOrder: ResumeChunkType[] = ["skills", "projects", "experience", "education"];
const maxChunkCharacters = 1800;

export function createResumeChunks(params: {
  userId: string;
  resumeDocumentId: string;
  parsedResumeId: string;
  structuredData: StructuredResumeData;
}): ResumeChunkInput[] {
  const chunks: ResumeChunkInput[] = [];
  let chunkIndex = 0;

  for (const chunkType of chunkOrder) {
    const sectionItems = params.structuredData[chunkType];
    const textGroups = groupSectionItems(sectionItems);

    for (const textGroup of textGroups) {
      const text = formatChunkText(chunkType, textGroup);

      chunks.push({
        userId: params.userId,
        resumeDocumentId: params.resumeDocumentId,
        parsedResumeId: params.parsedResumeId,
        chunkType,
        chunkIndex,
        text,
        sourceId: `${params.parsedResumeId}:${chunkType}:${chunkIndex}`,
        metadata: {
          itemCount: textGroup.length,
          source: "parsed_resume",
        },
      });

      chunkIndex += 1;
    }
  }

  return chunks;
}

export function createContentHash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function formatChunkText(chunkType: ResumeChunkType, items: string[]): string {
  const heading = chunkType.charAt(0).toUpperCase() + chunkType.slice(1);
  return `${heading}\n${items.map((item) => `- ${item}`).join("\n")}`;
}

function groupSectionItems(items: string[]): string[][] {
  const groups: string[][] = [];
  let currentGroup: string[] = [];
  let currentLength = 0;

  for (const item of items) {
    const normalizedItem = item.trim();

    if (!normalizedItem) {
      continue;
    }

    const nextLength = currentLength + normalizedItem.length + 3;

    if (currentGroup.length > 0 && nextLength > maxChunkCharacters) {
      groups.push(currentGroup);
      currentGroup = [];
      currentLength = 0;
    }

    currentGroup.push(normalizedItem);
    currentLength += normalizedItem.length + 3;
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

