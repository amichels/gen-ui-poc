import {
  autoFixSpec,
  compileSpecStream,
  formatSpecIssues,
  validateSpec,
  type Spec,
} from "@json-render/core";
import { catalog } from "./catalog";

const STORAGE_KEY = "gen-ui-poc:spec";

type ParseResult = { ok: true; spec: Spec } | { ok: false; error: string };

const toSpecObject = (input: unknown): unknown => {
  if (typeof input !== "string") return input;
  const text = input.trim();
  try {
    return JSON.parse(text);
  } catch {
    // Models sometimes fall back to JSONL patches despite instructions.
    return compileSpecStream(text);
  }
};

export const parseSpec = (input: unknown): ParseResult => {
  let candidate: unknown;
  try {
    candidate = toSpecObject(input);
  } catch (error) {
    return { ok: false, error: `Spec is not valid JSON: ${error instanceof Error ? error.message : String(error)}` };
  }
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return { ok: false, error: "Spec must be an object with root and elements." };
  }

  const { spec } = autoFixSpec(candidate as Spec);
  const structure = validateSpec(spec);
  if (!structure.valid) return { ok: false, error: formatSpecIssues(structure.issues) };

  const schema = catalog.validate(spec);
  if (!schema.success) {
    const issues = schema.error?.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) ?? [];
    return { ok: false, error: `Spec does not match the catalog:\n${issues.join("\n")}` };
  }

  return { ok: true, spec };
};

export const loadSpec = (): Spec | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const result = parseSpec(raw);
  if (result.ok) return result.spec;
  localStorage.removeItem(STORAGE_KEY);
  return null;
};

export const saveSpec = (spec: Spec) => localStorage.setItem(STORAGE_KEY, JSON.stringify(spec));

export const clearSpec = () => localStorage.removeItem(STORAGE_KEY);
