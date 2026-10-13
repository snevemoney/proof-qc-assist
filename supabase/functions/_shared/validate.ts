export class BodyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BodyValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new BodyValidationError("Invalid JSON body");
  }
}

export function expectObject(value: unknown, label = "body"): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new BodyValidationError(`${label} must be an object`);
  }
  return value;
}

export function optionalString(
  obj: Record<string, unknown>,
  key: string,
  maxLen = 200_000
): string | undefined {
  const value = obj[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new BodyValidationError(`${key} must be a string`);
  }
  if (value.length > maxLen) {
    throw new BodyValidationError(`${key} exceeds maximum length`);
  }
  return value;
}

export function requiredString(
  obj: Record<string, unknown>,
  key: string,
  maxLen = 200_000
): string {
  const value = optionalString(obj, key, maxLen);
  if (value === undefined || value.trim().length === 0) {
    throw new BodyValidationError(`${key} is required`);
  }
  return value;
}

export function optionalBoolean(obj: Record<string, unknown>, key: string): boolean | undefined {
  const value = obj[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") {
    throw new BodyValidationError(`${key} must be a boolean`);
  }
  return value;
}

export function optionalLanguage(obj: Record<string, unknown>): "fr" | "en" {
  const value = obj.language;
  if (value === undefined || value === null || value === "") return "fr";
  if (value !== "fr" && value !== "en") {
    throw new BodyValidationError("language must be 'fr' or 'en'");
  }
  return value;
}

export function optionalArray(
  obj: Record<string, unknown>,
  key: string,
  maxItems = 200
): unknown[] | undefined {
  const value = obj[key];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new BodyValidationError(`${key} must be an array`);
  }
  if (value.length > maxItems) {
    throw new BodyValidationError(`${key} exceeds maximum length`);
  }
  return value;
}

export function optionalObject(
  obj: Record<string, unknown>,
  key: string
): Record<string, unknown> | undefined {
  const value = obj[key];
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) {
    throw new BodyValidationError(`${key} must be an object`);
  }
  return value;
}

const SEARCH_MODES = new Set([
  "natural",
  "keywords",
  "pico",
  "auto-pico",
  "auto-keywords",
]);

export function parseSearchBody(raw: unknown) {
  const body = expectObject(raw);
  const searchMode = optionalString(body, "searchMode", 32);
  if (searchMode && !SEARCH_MODES.has(searchMode)) {
    throw new BodyValidationError("searchMode is invalid");
  }
  const query = optionalString(body, "query", 8_000) ?? "";
  const draftText = optionalString(body, "draftText", 200_000);
  const needsQuery = searchMode !== "auto-pico" && searchMode !== "auto-keywords";
  if (needsQuery && query.trim().length === 0) {
    throw new BodyValidationError("query is required");
  }
  if (!needsQuery && (!draftText || draftText.trim().length === 0)) {
    throw new BodyValidationError("draftText is required for auto search modes");
  }
  return {
    query,
    language: optionalLanguage(body),
    context: optionalObject(body, "context"),
    filters: optionalObject(body, "filters"),
    searchMode,
    keywordData: optionalObject(body, "keywordData"),
    draftText,
  };
}

export function parseVerifyBody(raw: unknown) {
  const body = expectObject(raw);
  const sources = optionalArray(body, "sources", 50) ?? [];
  if (sources.length === 0) {
    throw new BodyValidationError("sources is required");
  }
  return {
    sources,
    draftText: requiredString(body, "draftText", 200_000),
    strictMode: optionalBoolean(body, "strictMode") ?? false,
    language: optionalLanguage(body),
    instructions: optionalString(body, "instructions", 20_000),
    evaluationGrid: optionalArray(body, "evaluationGrid", 50),
  };
}

export function parseChatBody(raw: unknown) {
  const body = expectObject(raw);
  const messages = optionalArray(body, "messages", 80);
  if (!messages || messages.length === 0) {
    throw new BodyValidationError("messages is required");
  }
  return {
    messages,
    context: optionalObject(body, "context") ?? {},
    language: optionalLanguage(body),
    action: optionalString(body, "action", 32),
    claimId: optionalString(body, "claimId", 128),
  };
}

export function parseDocumentBody(raw: unknown) {
  const body = expectObject(raw);
  const fileContent = requiredString(body, "fileContent", 12_000_000);
  if (fileContent.length > 8_000_000) {
    throw new BodyValidationError("fileContent exceeds maximum size");
  }
  return {
    fileName: requiredString(body, "fileName", 512),
    fileContent,
    mimeType: optionalString(body, "mimeType", 256) ?? "",
  };
}

export function parseAnalyzeBody(raw: unknown) {
  const body = expectObject(raw);
  return { language: optionalLanguage(body) };
}

export function parseGenerateBody(raw: unknown) {
  const body = expectObject(raw);
  return {
    draftText: requiredString(body, "draftText", 200_000),
    claims: optionalArray(body, "claims", 200) ?? [],
    interventions: optionalArray(body, "interventions", 200) ?? [],
    sources: optionalArray(body, "sources", 50) ?? [],
    language: optionalLanguage(body),
    feedback: optionalString(body, "feedback", 20_000),
    previousVersion: optionalString(body, "previousVersion", 200_000),
  };
}
