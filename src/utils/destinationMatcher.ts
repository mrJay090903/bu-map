import type { Destination, PresetDestination } from "../types/navigation";

export type NlpIntent =
  | "navigate"
  | "ask-location"
  | "ask-distance"
  | "ask-direction"
  | "show-floor-plan"
  | "informational"
  | "unknown";

type MatchType = "alias" | "exact" | "token" | "fuzzy";

type MatchResult = {
  place: PresetDestination;
  score: number;
  matchType: MatchType;
  details: string;
};

type IntentDetectionResult = {
  intent: NlpIntent;
  confidence: number;
};

export type NlpAnalysisResult = {
  rawPrompt: string;
  normalizedPrompt: string;
  tokens: string[];
  intent: NlpIntent;
  confidence: number;
  destination: PresetDestination | null;
  destinationScore: number;
  destinationMatchType: MatchType | null;
  destinationMatchDetails: string | null;
  extractedRoomLabel?: string;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "be",
  "can",
  "for",
  "from",
  "go",
  "hello",
  "hey",
  "hi",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "please",
  "show",
  "take",
  "the",
  "to",
  "want",
  "where",
]);

const ROOM_ALIASES: Array<{ phrase: string; roomLabel: string }> = [
  { phrase: "cashier", roomLabel: "CASHIER" },
  { phrase: "registrar", roomLabel: "REGISTRAR OFFICE" },
  { phrase: "library", roomLabel: "LIBRARY" },
  { phrase: "librarian", roomLabel: "OFFICE OF THE LIBRARIAN" },
  { phrase: "csac", roomLabel: "CSAC" },
  { phrase: "ict lab", roomLabel: "ICT LABORATORY" },
  { phrase: "clinic", roomLabel: "CLINIC" },
  { phrase: "guidance", roomLabel: "GUIDANCE OFFICE" },
];

const INTENT_PHRASES: Record<NlpIntent, string[]> = {
  navigate: [
    "take me",
    "bring me",
    "go to",
    "navigate",
    "route me",
    "start navigation",
    "guide me",
    "directions to",
  ],
  "ask-location": [
    "where is",
    "where s",
    "located",
    "location",
    "find",
    "which building",
  ],
  "ask-distance": [
    "how far",
    "distance",
    "how long",
    "eta",
    "minutes left",
    "time left",
  ],
  "ask-direction": [
    "next direction",
    "next step",
    "which way",
    "where do i go",
    "turn",
    "direction",
  ],
  "show-floor-plan": [
    "floor plan",
    "show map",
    "room layout",
    "layout",
    "open plan",
  ],
  informational: ["what", "how", "when", "why", "who", "tell me", "explain"],
  unknown: [],
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAnyPhrase(input: string, phrases: string[]): boolean {
  return phrases.some((phrase) => input.includes(phrase));
}

function extractPromptTokens(normalizedPrompt: string): string[] {
  const words = normalizedPrompt.split(/\s+/).filter(Boolean);
  const meaningfulWords = words.filter(
    (word) => word.length > 1 && !STOP_WORDS.has(word),
  );
  return meaningfulWords.length > 0
    ? meaningfulWords
    : words.filter((word) => word.length > 1);
}

function detectIntent(
  normalizedPrompt: string,
  hasDestination: boolean,
): IntentDetectionResult {
  if (!normalizedPrompt) {
    return { intent: "unknown", confidence: 0 };
  }

  if (containsAnyPhrase(normalizedPrompt, INTENT_PHRASES["show-floor-plan"])) {
    return { intent: "show-floor-plan", confidence: 0.9 };
  }

  if (containsAnyPhrase(normalizedPrompt, INTENT_PHRASES["ask-distance"])) {
    return { intent: "ask-distance", confidence: 0.86 };
  }

  if (containsAnyPhrase(normalizedPrompt, INTENT_PHRASES["ask-direction"])) {
    return { intent: "ask-direction", confidence: 0.84 };
  }

  if (containsAnyPhrase(normalizedPrompt, INTENT_PHRASES.navigate)) {
    return { intent: "navigate", confidence: 0.82 };
  }

  if (containsAnyPhrase(normalizedPrompt, INTENT_PHRASES["ask-location"])) {
    return { intent: "ask-location", confidence: 0.79 };
  }

  if (containsAnyPhrase(normalizedPrompt, INTENT_PHRASES.informational)) {
    return { intent: "informational", confidence: 0.65 };
  }

  if (hasDestination) {
    return { intent: "navigate", confidence: 0.68 };
  }

  return { intent: "unknown", confidence: 0.35 };
}

function extractRoomLabel(normalizedPrompt: string): string | undefined {
  const codedRoomMatch = normalizedPrompt.match(/\b(?:sb|ab|ecb|cl)\s*-?\s*\d{1,3}\b/i);
  if (codedRoomMatch?.[0]) {
    return codedRoomMatch[0].replace(/\s+/g, " ").toUpperCase();
  }

  const roomAlias = ROOM_ALIASES.find((entry) =>
    normalizedPrompt.includes(entry.phrase),
  );
  return roomAlias?.roomLabel;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching of voice input
 */
function levenshteinDistance(a: string, b: string): number {
  const track = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) {
    track[0][i] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator,
      );
    }
  }

  return track[b.length][a.length];
}

/**
 * Calculate similarity score between two strings (0-100)
 * Higher score means better match
 */
function calculateStringSimilarity(source: string, target: string): number {
  const distance = levenshteinDistance(source, target);
  const maxLength = Math.max(source.length, target.length);
  if (maxLength === 0) {
    return 100;
  }

  const similarity = ((maxLength - distance) / maxLength) * 100;
  return Math.max(0, similarity);
}

function findDestinationByLabel(
  destinations: PresetDestination[],
  label: string,
): PresetDestination | null {
  const normalizedLabel = normalizeText(label);
  return (
    destinations.find(
      (destination) => normalizeText(destination.label) === normalizedLabel,
    ) ?? null
  );
}

function resolveAliasDestination(
  normalizedPrompt: string,
  destinations: PresetDestination[],
): PresetDestination | null {
  const isCogPrompt =
    normalizedPrompt === "cog" ||
    normalizedPrompt.includes("certificate of grade") ||
    normalizedPrompt.includes("certification of grades");

  if (isCogPrompt) {
    return findDestinationByLabel(destinations, "Registrar");
  }

  const isElectronicsTechnologyPrompt =
    normalizedPrompt === "etd" ||
    normalizedPrompt.includes("electronics technology") ||
    normalizedPrompt.includes("electronics technology building") ||
    normalizedPrompt.includes("electronics technology department") ||
    (normalizedPrompt.includes("electronics") &&
      normalizedPrompt.includes("technology"));

  if (isElectronicsTechnologyPrompt) {
    return findDestinationByLabel(destinations, "CESD Building");
  }

  const isLibraryPrompt =
    normalizedPrompt.includes("library") ||
    normalizedPrompt.includes("librarian") ||
    normalizedPrompt.includes("csac") ||
    normalizedPrompt.includes("identification card") ||
    normalizedPrompt.includes("university id") ||
    normalizedPrompt.includes("id reprint") ||
    normalizedPrompt.includes("lost id") ||
    normalizedPrompt.includes("defaced id") ||
    normalizedPrompt.includes("mutilated id") ||
    normalizedPrompt.includes("faded id");
  if (isLibraryPrompt) {
    return findDestinationByLabel(destinations, "Salceda Building");
  }

  const isCashierPrompt =
    normalizedPrompt.includes("cashier") ||
    normalizedPrompt.includes("payment") ||
    normalizedPrompt.includes("fees");
  if (isCashierPrompt) {
    return findDestinationByLabel(destinations, "Administration Building");
  }

  const isClinicPrompt =
    normalizedPrompt.includes("medical") ||
    normalizedPrompt.includes("dental") ||
    normalizedPrompt.includes("clinic") ||
    normalizedPrompt.includes("health services");
  if (isClinicPrompt) {
    return findDestinationByLabel(
      destinations,
      "Medical and Dental Clinic Bicol Univerity Health Services",
    );
  }

  const isGymPrompt =
    normalizedPrompt.includes("gym") ||
    normalizedPrompt.includes("sports") ||
    normalizedPrompt.includes("fitness");
  if (isGymPrompt) {
    return findDestinationByLabel(destinations, "BUP GYM");
  }

  return null;
}

function findBestDestinationMatch(
  normalizedPrompt: string,
  destinations: PresetDestination[],
): { bestMatch: MatchResult | null; allScores: MatchResult[]; promptTokens: string[] } {
  const promptTokens = extractPromptTokens(normalizedPrompt);

  if (promptTokens.length === 0) {
    return { bestMatch: null, allScores: [], promptTokens };
  }

  let bestMatch: MatchResult | null = null;
  const allScores: MatchResult[] = [];

  for (const place of destinations) {
    const normalizedLabel = normalizeText(place.label);
    const labelTokens = extractPromptTokens(normalizedLabel);
    const searchableText = normalizeText(`${place.label} ${place.keywords.join(" ")}`);

    if (normalizedPrompt === normalizedLabel) {
      const result: MatchResult = {
        place,
        score: 100,
        matchType: "exact",
        details: `Exact label match: "${normalizedPrompt}"`,
      };
      allScores.push(result);
      bestMatch = result;
      continue;
    }

    if (normalizedPrompt.includes(normalizedLabel)) {
      const result: MatchResult = {
        place,
        score: 98,
        matchType: "exact",
        details: `Prompt contains destination label: "${place.label}"`,
      };
      allScores.push(result);
      if (!bestMatch || result.score > bestMatch.score) {
        bestMatch = result;
      }
      continue;
    }

    if (normalizedPrompt.length > 2 && searchableText.includes(normalizedPrompt)) {
      const result: MatchResult = {
        place,
        score: 95,
        matchType: "exact",
        details: `Prompt phrase found in searchable text: "${normalizedPrompt}"`,
      };
      allScores.push(result);
      if (!bestMatch || result.score > bestMatch.score) {
        bestMatch = result;
      }
      continue;
    }

    const matchedTokens: string[] = [];
    let labelOverlap = 0;
    let keywordOverlap = 0;

    for (const token of promptTokens) {
      if (labelTokens.includes(token)) {
        matchedTokens.push(token);
        labelOverlap += 1;
        continue;
      }

      if (searchableText.includes(token)) {
        matchedTokens.push(token);
        keywordOverlap += 1;
      }
    }

    const weightedOverlap = labelOverlap * 2 + keywordOverlap;
    const maxWeightedOverlap = promptTokens.length * 2;

    if (weightedOverlap > 0 && maxWeightedOverlap > 0) {
      const normalizedScore = (weightedOverlap / maxWeightedOverlap) * 100;
      const result: MatchResult = {
        place,
        score: normalizedScore,
        matchType: "token",
        details:
          `Token match (${matchedTokens.length}/${promptTokens.length}): ` +
          `labelTokens=${labelOverlap}, keywordTokens=${keywordOverlap}, ` +
          `matched=[${matchedTokens.join(", ")}]`,
      };
      allScores.push(result);
      if (!bestMatch || normalizedScore > bestMatch.score) {
        bestMatch = result;
      }
      continue;
    }

    let bestFuzzyScore = 0;
    let bestFuzzyMatch = "";

    const labelSimilarity = calculateStringSimilarity(normalizedPrompt, normalizedLabel);
    if (labelSimilarity > bestFuzzyScore) {
      bestFuzzyScore = labelSimilarity;
      bestFuzzyMatch = place.label;
    }

    for (const keyword of place.keywords) {
      const keySimilarity = calculateStringSimilarity(
        normalizedPrompt,
        normalizeText(keyword),
      );
      if (keySimilarity > bestFuzzyScore) {
        bestFuzzyScore = keySimilarity;
        bestFuzzyMatch = keyword;
      }
    }

    if (bestFuzzyScore > 60) {
      const result: MatchResult = {
        place,
        score: bestFuzzyScore,
        matchType: "fuzzy",
        details: `Fuzzy match (${bestFuzzyScore.toFixed(1)}%): matched "${bestFuzzyMatch}"`,
      };
      allScores.push(result);
      if (!bestMatch || bestFuzzyScore > bestMatch.score) {
        bestMatch = result;
      }
    }
  }

  return { bestMatch, allScores, promptTokens };
}

export function analyzePromptNlp(
  prompt: string,
  destinations: PresetDestination[],
): NlpAnalysisResult {
  const normalizedPrompt = normalizeText(prompt);
  const extractedRoomLabel = extractRoomLabel(normalizedPrompt);

  if (!normalizedPrompt) {
    return {
      rawPrompt: prompt,
      normalizedPrompt,
      tokens: [],
      intent: "unknown",
      confidence: 0,
      destination: null,
      destinationScore: 0,
      destinationMatchType: null,
      destinationMatchDetails: null,
      extractedRoomLabel,
    };
  }

  const aliasDestination = resolveAliasDestination(normalizedPrompt, destinations);

  const { bestMatch: matchedDestination, allScores, promptTokens } =
    findBestDestinationMatch(normalizedPrompt, destinations);

  const bestMatch = aliasDestination
    ? {
        place: aliasDestination,
        score: 99,
        matchType: "alias" as const,
        details: `Alias match for "${normalizedPrompt}"`,
      }
    : matchedDestination;

  const intentResult = detectIntent(normalizedPrompt, Boolean(bestMatch));

  let confidence = intentResult.confidence;
  if (bestMatch) {
    const destinationConfidence = Math.min(1, bestMatch.score / 100);
    if (
      intentResult.intent === "navigate" ||
      intentResult.intent === "ask-location" ||
      intentResult.intent === "show-floor-plan"
    ) {
      confidence = Math.max(confidence, 0.35 + destinationConfidence * 0.65);
    } else {
      confidence = Math.max(confidence, 0.25 + destinationConfidence * 0.5);
    }
  }

  const clampedConfidence = Math.max(0, Math.min(1, confidence));

  console.log(
    "[NLP] Destination candidates:",
    allScores.map((candidate) => ({
      destination: candidate.place.label,
      score: candidate.score.toFixed(1),
      type: candidate.matchType,
      details: candidate.details,
    })),
  );

  return {
    rawPrompt: prompt,
    normalizedPrompt,
    tokens: promptTokens,
    intent: intentResult.intent,
    confidence: clampedConfidence,
    destination: bestMatch?.place ?? null,
    destinationScore: bestMatch?.score ?? 0,
    destinationMatchType: bestMatch?.matchType ?? null,
    destinationMatchDetails: bestMatch?.details ?? null,
    extractedRoomLabel,
  };
}

export function resolvePresetFromPrompt(
  prompt: string,
  destinations: PresetDestination[],
): PresetDestination | null {
  const analysis = analyzePromptNlp(prompt, destinations);

  console.log("[Voice Parsing] Received prompt:", prompt);
  console.log("[Voice Parsing] Normalized prompt:", analysis.normalizedPrompt);
  console.log("[Voice Parsing] Extracted tokens:", analysis.tokens);
  console.log(
    `[Voice Parsing] NLP intent=${analysis.intent}, confidence=${analysis.confidence.toFixed(2)}`,
  );

  if (!analysis.destination) {
    console.log(
      "[Voice Parsing] No matching destination found. Available destinations:",
      destinations.map((d) => d.label),
    );
    return null;
  }

  console.log(
    `[Voice Parsing] Best match found: "${analysis.destination.label}" (score: ${analysis.destinationScore.toFixed(1)}%, type: ${analysis.destinationMatchType})`,
  );
  if (analysis.destinationMatchDetails) {
    console.log(`[Voice Parsing] Match details: ${analysis.destinationMatchDetails}`);
  }

  return analysis.destination;
}

export function resolvePresetFromDestination(
  destination: Destination | null,
  destinations: PresetDestination[],
): PresetDestination | null {
  if (!destination) {
    return null;
  }

  return (
    destinations.find(
      (preset) =>
        Math.abs(preset.lat - destination.lat) < 0.000001 &&
        Math.abs(preset.lon - destination.lon) < 0.000001,
    ) ?? null
  );
}
