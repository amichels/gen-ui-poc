// Pulls a json-render spec out of assistant prose, for models that ignore the renderUI tool.
const SPEC_START = /(```(?:json|jsonl)?\s*)?\{\s*"(?:root|elements|state|op)"\s*:/;

export type SpecText = {
  before: string;
  after: string;
  /** JSON object or JSONL source; null when the text has no spec. */
  source: string | null;
  /** True while the spec is still streaming in. */
  partial: boolean;
};

const findObjectEnd = (text: string, start: number) => {
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (char === "\\") i++;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) return i + 1;
  }
  return -1;
};

export const splitSpecText = (text: string): SpecText => {
  const match = SPEC_START.exec(text);
  if (!match) return { before: text.trim(), after: "", source: null, partial: false };

  const before = text.slice(0, match.index).trim();
  const fenced = Boolean(match[1]);
  const jsonStart = match.index + (match[1]?.length ?? 0);
  const rest = text.slice(jsonStart);

  if (/^\{\s*"op"/.test(rest)) {
    const fenceEnd = fenced ? rest.indexOf("```") : -1;
    const body = fenceEnd >= 0 ? rest.slice(0, fenceEnd) : rest;
    const lines = body.split("\n");
    const jsonLines = lines.filter((line) => line.trim().startsWith("{"));
    const lastJson = lines.map((line) => line.trim().startsWith("{")).lastIndexOf(true);
    const after = fenceEnd >= 0 ? rest.slice(fenceEnd + 3) : lines.slice(lastJson + 1).join("\n");
    return { before, after: after.trim(), source: jsonLines.join("\n"), partial: fenced && fenceEnd < 0 };
  }

  const end = findObjectEnd(text, jsonStart);
  if (end < 0) return { before, after: "", source: null, partial: true };
  const after = text.slice(end).replace(/^\s*```/, "").trim();
  return { before, after, source: text.slice(jsonStart, end), partial: false };
};
