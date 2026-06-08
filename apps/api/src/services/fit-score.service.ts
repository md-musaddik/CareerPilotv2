import type { ProfileDocument } from "../models/profile.model.js";
import type { FitScore, NormalizedJob, ScoreBreakdownItem } from "../types/jobs.js";

type CandidateProfile = {
  location: string;
  skills: string[];
  projects: string[];
  experience: string[];
  education: string[];
};

const knownSkills = [
  "javascript",
  "typescript",
  "react",
  "node",
  "node.js",
  "express",
  "mongodb",
  "postgresql",
  "sql",
  "firebase",
  "tailwind",
  "python",
  "java",
  "c#",
  "c++",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "graphql",
  "rest",
  "html",
  "css",
  "vite",
  "next.js",
  "redux",
  "react query",
  "machine learning",
  "data analysis",
  "excel",
  "figma",
  "git",
  "ci/cd",
];

const weights = {
  skills: 40,
  experience: 25,
  education: 15,
  projects: 15,
  location: 5,
};

export function calculateFitScore(job: NormalizedJob, profileDocument: ProfileDocument | null): FitScore {
  const profile = normalizeProfile(profileDocument);
  const jobText = normalizeText(`${job.title} ${job.description}`);
  const jobLocation = normalizeText(job.location);

  const requiredSkills = extractRequiredSkills(jobText);
  const candidateSkills = normalizeList(profile.skills);
  const matchedSkills = requiredSkills.filter((skill) => candidateSkills.has(skill));
  const missingSkills = requiredSkills.filter((skill) => !candidateSkills.has(skill));

  const skillScore = scoreSkills(requiredSkills, matchedSkills, candidateSkills, jobText);
  const experienceScore = scoreExperience(jobText, profile.experience);
  const educationScore = scoreEducation(jobText, profile.education);
  const projectScore = scoreProjectRelevance(jobText, profile.projects);
  const locationScore = scoreLocation(jobLocation, profile.location);

  const scoreBreakdown: ScoreBreakdownItem[] = [
    {
      label: "Skill Match",
      score: skillScore,
      weight: weights.skills,
      reason: `${matchedSkills.length} of ${requiredSkills.length} detected job skills matched.`,
    },
    {
      label: "Experience Match",
      score: experienceScore,
      weight: weights.experience,
      reason: "Compares required years in the job text with estimated resume experience.",
    },
    {
      label: "Education Match",
      score: educationScore,
      weight: weights.education,
      reason: "Compares degree requirements in the job text with resume education.",
    },
    {
      label: "Project Relevance",
      score: projectScore,
      weight: weights.projects,
      reason: "Measures deterministic keyword overlap between projects and the job description.",
    },
    {
      label: "Location Match",
      score: locationScore,
      weight: weights.location,
      reason: "Compares job location with profile location and remote indicators.",
    },
  ];

  const weightedScore = scoreBreakdown.reduce((sum, item) => sum + item.score * (item.weight / 100), 0);

  return {
    score: Math.round(weightedScore),
    matchedSkills,
    missingSkills,
    scoreBreakdown,
  };
}

function normalizeProfile(profileDocument: ProfileDocument | null): CandidateProfile {
  return {
    location: profileDocument?.location ?? "",
    skills: profileDocument?.skills ?? [],
    projects: profileDocument?.projects ?? [],
    experience: profileDocument?.experience ?? [],
    education: profileDocument?.education ?? [],
  };
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^\w+#.\s/-]/g, " ");
}

function normalizeList(values: string[]): Set<string> {
  return new Set(values.map((value) => normalizeText(value).trim()).filter(Boolean));
}

function extractRequiredSkills(jobText: string): string[] {
  return knownSkills.filter((skill) => containsToken(jobText, skill));
}

function containsToken(text: string, token: string): boolean {
  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\W)${escapedToken}(\\W|$)`, "i").test(text);
}

function scoreSkills(
  requiredSkills: string[],
  matchedSkills: string[],
  candidateSkills: Set<string>,
  jobText: string,
): number {
  if (requiredSkills.length > 0) {
    return Math.round((matchedSkills.length / requiredSkills.length) * 100);
  }

  const candidateMentions = [...candidateSkills].filter((skill) => containsToken(jobText, skill)).length;
  return Math.min(80, candidateMentions * 20);
}

function scoreExperience(jobText: string, experience: string[]): number {
  const requiredYears = extractRequiredYears(jobText);
  const candidateYears = estimateCandidateYears(experience);

  if (requiredYears === 0) {
    return experience.length > 0 ? 80 : 50;
  }

  return Math.min(100, Math.round((candidateYears / requiredYears) * 100));
}

function extractRequiredYears(jobText: string): number {
  const matches = [...jobText.matchAll(/(\d+)\+?\s*(?:years|yrs)/gi)].map((match) => Number(match[1]));
  return matches.length > 0 ? Math.max(...matches) : 0;
}

function estimateCandidateYears(experience: string[]): number {
  const explicitYears = experience
    .flatMap((item) => [...item.matchAll(/(\d+)\+?\s*(?:years|yrs)/gi)])
    .map((match) => Number(match[1]));

  if (explicitYears.length > 0) {
    return Math.max(...explicitYears);
  }

  return Math.min(10, experience.length * 1.5);
}

function scoreEducation(jobText: string, education: string[]): number {
  const educationText = normalizeText(education.join(" "));
  const jobRequiresBachelor = /bachelor|bs\b|ba\b|undergraduate/.test(jobText);
  const jobRequiresMaster = /master|ms\b|ma\b|mba|graduate degree/.test(jobText);
  const candidateHasBachelor = /bachelor|bs\b|ba\b|undergraduate/.test(educationText);
  const candidateHasMaster = /master|ms\b|ma\b|mba|graduate/.test(educationText);

  if (!jobRequiresBachelor && !jobRequiresMaster) {
    return education.length > 0 ? 80 : 60;
  }

  if (jobRequiresMaster) {
    return candidateHasMaster ? 100 : candidateHasBachelor ? 70 : 25;
  }

  return candidateHasBachelor || candidateHasMaster ? 100 : 35;
}

function scoreProjectRelevance(jobText: string, projects: string[]): number {
  if (projects.length === 0) {
    return 40;
  }

  const projectKeywords = new Set(
    projects
      .join(" ")
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3),
  );
  const overlap = [...projectKeywords].filter((word) => containsToken(jobText, word)).length;

  return Math.min(100, Math.round((overlap / Math.max(projectKeywords.size, 1)) * 300));
}

function scoreLocation(jobLocation: string, profileLocation: string): number {
  const normalizedProfileLocation = normalizeText(profileLocation);

  if (/remote|anywhere|work from home/.test(jobLocation)) {
    return 100;
  }

  if (!jobLocation || !normalizedProfileLocation) {
    return 60;
  }

  const profileParts = normalizedProfileLocation.split(/[\s,]+/).filter((part) => part.length > 2);
  return profileParts.some((part) => containsToken(jobLocation, part)) ? 100 : 35;
}

