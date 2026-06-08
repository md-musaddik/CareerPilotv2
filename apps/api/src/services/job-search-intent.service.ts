import type { ParsedJobSearchIntent } from "../types/jobs.js";

const locationHints = [
  "dhaka",
  "bangladesh",
  "new york",
  "california",
  "san francisco",
  "london",
  "berlin",
  "toronto",
  "singapore",
  "dubai",
  "remote",
];

const roleSynonyms: Record<string, string> = {
  ml: "machine learning",
  ai: "artificial intelligence",
  swe: "software engineer",
  sde: "software development engineer",
  intern: "internship",
  internships: "internship",
};

function normalizeWhitespace(value: string): string {
  return value.toLowerCase().replace(/[^\w\s/-]/g, " ").replace(/\s+/g, " ").trim();
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function extractLocation(query: string): { locationText?: string; strippedQuery: string } {
  const remoteMatch = /\bremote\b/.exec(query);
  if (remoteMatch) {
    return {
      locationText: "remote",
      strippedQuery: query.replace(/\bremote\b/g, " ").replace(/\s+/g, " ").trim(),
    };
  }

  const hintedLocation = locationHints.find((hint) => query.includes(hint));
  if (hintedLocation) {
    return {
      locationText: hintedLocation,
      strippedQuery: query.replace(hintedLocation, " ").replace(/\s+/g, " ").trim(),
    };
  }

  const inMatch = /\b(?:in|at|for)\s+([a-z][a-z\s-]{1,40})$/.exec(query);
  if (inMatch) {
    const locationText = inMatch[1].trim();
    return {
      locationText,
      strippedQuery: query.slice(0, inMatch.index).trim(),
    };
  }

  return { strippedQuery: query };
}

function extractDateWindow(query: string): {
  dateWindow?: ParsedJobSearchIntent["dateWindow"];
  strippedQuery: string;
} {
  if (/\bthis month\b/.test(query)) {
    return {
      dateWindow: "this_month",
      strippedQuery: query.replace(/\bthis month\b/g, " ").replace(/\s+/g, " ").trim(),
    };
  }

  if (/\bthis week\b|\blast 7 days\b/.test(query)) {
    return {
      dateWindow: "this_week",
      strippedQuery: query.replace(/\bthis week\b|\blast 7 days\b/g, " ").replace(/\s+/g, " ").trim(),
    };
  }

  if (/\btoday\b|\blast 24 hours\b/.test(query)) {
    return {
      dateWindow: "today",
      strippedQuery: query.replace(/\btoday\b|\blast 24 hours\b/g, " ").replace(/\s+/g, " ").trim(),
    };
  }

  return { strippedQuery: query };
}

function detectJobType(query: string): ParsedJobSearchIntent["jobType"] | undefined {
  if (/\bintern(ship|ships)?\b|\bplacement\b/.test(query)) {
    return "internship";
  }
  if (/\bpart[- ]?time\b/.test(query)) {
    return "part-time";
  }
  if (/\bcontract\b|\bfreelance\b/.test(query)) {
    return "contract";
  }
  if (/\bfull[- ]?time\b/.test(query)) {
    return "full-time";
  }
  if (/\bremote\b/.test(query)) {
    return "remote";
  }
  return undefined;
}

function expandRoleTokens(tokens: string[]): string[] {
  return dedupe(
    tokens.flatMap((token) => {
      const normalized = roleSynonyms[token] ?? token;
      return normalized.includes(" ") ? [token, normalized] : [normalized];
    }),
  );
}

export function parseJobSearchIntent(rawQuery: string, explicitWhere?: string): ParsedJobSearchIntent {
  const normalizedQuery = normalizeWhitespace(rawQuery);
  const locationResult = extractLocation(normalizedQuery);
  const dateResult = extractDateWindow(locationResult.strippedQuery);
  const explicitLocation = normalizeWhitespace(explicitWhere ?? "");
  const locationText = explicitLocation || locationResult.locationText;
  const remoteOnly = locationText === "remote" || /\bremote\b/.test(normalizedQuery);
  const jobType = detectJobType(normalizedQuery);

  const cleanedQuery = dateResult.strippedQuery
    .replace(/\bfind me\b/g, " ")
    .replace(/\bopen\b/g, " ")
    .replace(/\bjobs?\b/g, " ")
    .replace(/\broles?\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const rawTokens = cleanedQuery.split(/\s+/).filter((token) => token.length > 1);
  const keywords = dedupe(
    expandRoleTokens(rawTokens)
      .map((token) => roleSynonyms[token] ?? token)
      .filter((token) => !["find", "me", "open", "this", "month", "week", "today", "in", "at", "for"].includes(token)),
  );
  const roleTerms = dedupe(
    keywords.filter((token) =>
      !locationHints.includes(token) &&
      token !== "remote" &&
      token !== "bangladesh",
    ),
  );

  return {
    rawQuery,
    normalizedQuery,
    keywords,
    roleTerms,
    locationText,
    locationParts: dedupe((locationText ?? "").split(/[\s,/-]+/).filter((part) => part.length > 1)),
    jobType,
    dateWindow: dateResult.dateWindow,
    remoteOnly,
  };
}
