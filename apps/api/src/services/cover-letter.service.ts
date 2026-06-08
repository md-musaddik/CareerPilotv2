export function getCoverLetterInstruction(): string {
  return [
    "Draft a tailored cover letter using the user's resume context.",
    "Ask for missing company, role, or job description details when needed.",
    "Avoid inventing accomplishments not present in the provided memory context.",
    "Return a polished draft plus a short note about what should be customized.",
  ].join(" ");
}

