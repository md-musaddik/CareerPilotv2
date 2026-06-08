import type { EditableResumeProfile, ResumeSectionName, StructuredResumeData } from "../types/resume.js";

type ParsedResumeResult = {
  structuredData: StructuredResumeData;
  editableProfile: EditableResumeProfile;
};

const sectionPatterns: Record<ResumeSectionName, RegExp[]> = {
  skills: [/^skills$/i, /^technical skills$/i, /^core skills$/i, /^core competencies$/i, /^technologies$/i],
  projects: [/^projects$/i, /^selected projects$/i, /^personal projects$/i],
  experience: [
    /^experience$/i,
    /^work experience$/i,
    /^professional experience$/i,
    /^employment history$/i,
    /^career history$/i,
  ],
  education: [/^education$/i, /^academic background$/i, /^certifications? and education$/i],
};

const allSectionHeadings = Object.values(sectionPatterns).flat();

export function parseResumeText(rawText: string): ParsedResumeResult {
  const lines = rawText
    .split("\n")
    .map((line) => cleanLine(line))
    .filter(Boolean);

  const structuredData: StructuredResumeData = {
    skills: parseSkillsSection(extractSection(lines, "skills")),
    projects: parseListSection(extractSection(lines, "projects")),
    experience: parseListSection(extractSection(lines, "experience")),
    education: parseListSection(extractSection(lines, "education")),
  };

  const editableProfile: EditableResumeProfile = {
    headline: inferHeadline(lines),
    summary: inferSummary(lines),
    skills: structuredData.skills,
    projects: structuredData.projects,
    experience: structuredData.experience,
    education: structuredData.education,
  };

  return {
    structuredData,
    editableProfile,
  };
}

function cleanLine(line: string): string {
  return line.replace(/^[\s•*\-–—]+/, "").replace(/\s+/g, " ").trim();
}

function inferHeadline(lines: string[]): string {
  return lines.find((line) => !isKnownSectionHeading(line)) ?? "";
}

function inferSummary(lines: string[]): string {
  const firstSectionIndex = lines.findIndex((line) => isKnownSectionHeading(line));
  const summaryLines = lines
    .slice(1, firstSectionIndex > 0 ? firstSectionIndex : Math.min(lines.length, 4))
    .filter((line) => line.length > 30)
    .slice(0, 3);

  return summaryLines.join(" ");
}

function extractSection(lines: string[], sectionName: ResumeSectionName): string[] {
  const startIndex = lines.findIndex((line) => sectionPatterns[sectionName].some((pattern) => pattern.test(line)));

  if (startIndex === -1) {
    return [];
  }

  const nextSectionOffset = lines
    .slice(startIndex + 1)
    .findIndex((line) => isKnownSectionHeading(line));

  const endIndex = nextSectionOffset === -1 ? lines.length : startIndex + 1 + nextSectionOffset;

  return lines.slice(startIndex + 1, endIndex).filter((line) => !isKnownSectionHeading(line));
}

function isKnownSectionHeading(line: string): boolean {
  return allSectionHeadings.some((pattern) => pattern.test(line));
}

function parseSkillsSection(lines: string[]): string[] {
  return uniqueStrings(
    lines
      .flatMap((line) => line.split(/[,|;/]/))
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 1 && skill.length < 60),
  );
}

function parseListSection(lines: string[]): string[] {
  return uniqueStrings(lines.filter((line) => line.length > 1));
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalizedValue = value.trim();
    const key = normalizedValue.toLowerCase();

    if (!normalizedValue || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalizedValue);
  }

  return result;
}

