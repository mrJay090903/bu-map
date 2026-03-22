import type { Destination, PresetDestination } from "../types/navigation";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
}

export function resolvePresetFromPrompt(
  prompt: string,
  destinations: PresetDestination[],
): PresetDestination | null {
  const normalizedPrompt = normalizeText(prompt);
  if (!normalizedPrompt) {
    return null;
  }

  const promptTokens = normalizedPrompt
    .split(/\s+/)
    .filter((token) => token.length > 1);

  if (promptTokens.length === 0) {
    return null;
  }

  let bestMatch: { place: PresetDestination; score: number } | null = null;

  for (const place of destinations) {
    const searchableText = normalizeText(
      `${place.label} ${place.keywords.join(" ")}`,
    );
    let score = 0;

    for (const token of promptTokens) {
      if (searchableText.includes(token)) {
        score += 1;
      }
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { place, score };
    }
  }

  if (!bestMatch || bestMatch.score === 0) {
    return null;
  }

  return bestMatch.place;
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
