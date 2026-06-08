import type { EditableResumeProfile } from "@/features/resume/types";

export type ResumeStrengthPillar = {
  label: string;
  score: number;
  detail: string;
};

export type ResumeStrengthResult = {
  score: number;
  grade: "A" | "B" | "C" | "D";
  highlights: string[];
  opportunities: string[];
  pillars: ResumeStrengthPillar[];
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countQuantifiedAchievements(values: string[]) {
  return values.filter((value) => /\d/.test(value)).length;
}

function scoreCount(count: number, excellent: number, strong: number, baseline: number) {
  if (count >= excellent) {
    return 100;
  }

  if (count >= strong) {
    return 80;
  }

  if (count >= baseline) {
    return 60;
  }

  if (count > 0) {
    return 35;
  }

  return 0;
}

function createGrade(score: number): ResumeStrengthResult["grade"] {
  if (score >= 85) {
    return "A";
  }

  if (score >= 72) {
    return "B";
  }

  if (score >= 58) {
    return "C";
  }

  return "D";
}

export function calculateResumeStrength(profile: EditableResumeProfile): ResumeStrengthResult {
  const skillsCount = profile.skills.length;
  const projectsCount = profile.projects.length;
  const experienceCount = profile.experience.length;
  const educationCount = profile.education.length;
  const quantifiedProjects = countQuantifiedAchievements(profile.projects);
  const quantifiedExperience = countQuantifiedAchievements(profile.experience);

  const headlineScore = profile.headline.trim().length >= 12 ? 100 : profile.headline.trim() ? 55 : 0;
  const summaryLength = profile.summary.trim().length;
  const summaryScore = summaryLength >= 140 ? 100 : summaryLength >= 80 ? 80 : summaryLength >= 35 ? 55 : summaryLength > 0 ? 30 : 0;
  const skillsScore = scoreCount(skillsCount, 8, 5, 3);
  const experienceScore = clampScore(scoreCount(experienceCount, 4, 2, 1) * 0.6 + scoreCount(quantifiedExperience, 3, 2, 1) * 0.4);
  const projectsScore = clampScore(scoreCount(projectsCount, 3, 2, 1) * 0.6 + scoreCount(quantifiedProjects, 2, 1, 1) * 0.4);
  const educationScore = educationCount > 0 ? 100 : 25;

  const pillars: ResumeStrengthPillar[] = [
    {
      label: "Headline",
      score: headlineScore,
      detail: headlineScore >= 80 ? "Clear role signal is present." : "Add a sharper target role headline.",
    },
    {
      label: "Summary",
      score: summaryScore,
      detail: summaryScore >= 80 ? "Summary gives enough context to anchor the profile." : "Write a tighter summary with impact and focus.",
    },
    {
      label: "Skills",
      score: skillsScore,
      detail: skillsScore >= 80 ? "Skill coverage looks healthy for matching and retrieval." : "Expand high-signal skills relevant to target roles.",
    },
    {
      label: "Experience",
      score: experienceScore,
      detail: experienceScore >= 80 ? "Experience section has good depth and evidence." : "Add more scope, outcomes, and measurable results.",
    },
    {
      label: "Projects",
      score: projectsScore,
      detail: projectsScore >= 80 ? "Projects strengthen the proof behind the resume." : "Add more project context and quantified wins.",
    },
    {
      label: "Education",
      score: educationScore,
      detail: educationScore >= 80 ? "Education coverage is present." : "Include education or certification context if relevant.",
    },
  ];

  const score = clampScore(
    headlineScore * 0.1 +
      summaryScore * 0.15 +
      skillsScore * 0.2 +
      experienceScore * 0.25 +
      projectsScore * 0.2 +
      educationScore * 0.1,
  );

  const highlights = pillars
    .filter((pillar) => pillar.score >= 80)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((pillar) => pillar.detail);

  const opportunities = pillars
    .filter((pillar) => pillar.score < 80)
    .sort((left, right) => left.score - right.score)
    .slice(0, 3)
    .map((pillar) => pillar.detail);

  return {
    score,
    grade: createGrade(score),
    highlights,
    opportunities,
    pillars,
  };
}
