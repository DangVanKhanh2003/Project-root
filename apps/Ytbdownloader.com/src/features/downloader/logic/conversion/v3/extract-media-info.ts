export interface ExtractedMediaInfo {
  domain?: string;
  duration?: number;
  statusUrl?: string;
  thumbnail?: string;
  title?: string;
  type?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getNestedString(
  record: Record<string, unknown>,
  key: string
): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getNestedNumber(
  record: Record<string, unknown>,
  key: string
): number | undefined {
  const value = record[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function unwrapCreateJobResponse(raw: unknown): Record<string, unknown> {
  if (!isRecord(raw)) return {};
  const maybeData = raw.data;
  if (isRecord(maybeData)) return maybeData;
  return raw;
}

function tryGetMetaRecord(payload: Record<string, unknown>): Record<string, unknown> | null {
  const maybeMeta = payload.meta;
  return isRecord(maybeMeta) ? maybeMeta : null;
}

export function extractMediaInfoFromCreateJob(raw: unknown): ExtractedMediaInfo {
  const payload = unwrapCreateJobResponse(raw);
  const meta = tryGetMetaRecord(payload);

  const statusUrl =
    getNestedString(payload, 'statusUrl') ||
    getNestedString(payload, 'status_url');

  const title =
    getNestedString(payload, 'title') ||
    (meta ? getNestedString(meta, 'title') : undefined);

  const thumbnail =
    getNestedString(payload, 'thumbnail') ||
    getNestedString(payload, 'thumbnailUrl') ||
    getNestedString(payload, 'thumbnail_url') ||
    (meta ? getNestedString(meta, 'thumbnail') : undefined);

  const duration =
    getNestedNumber(payload, 'duration') ||
    (meta ? getNestedNumber(meta, 'duration') : undefined);

  const type =
    getNestedString(payload, 'type') ||
    getNestedString(payload, 'outputType');

  let domain =
    getNestedString(payload, 'domain') ||
    getNestedString(payload, 'host');

  if (!domain && statusUrl) {
    try {
      domain = new URL(statusUrl).hostname;
    } catch {
      // Ignore URL parse failures for malformed status URLs.
    }
  }

  return {
    domain,
    duration,
    statusUrl,
    thumbnail,
    title,
    type,
  };
}

export function hasExtractedMediaInfo(info: ExtractedMediaInfo): boolean {
  return Boolean(
    info.title ||
    info.thumbnail ||
    typeof info.duration === 'number' ||
    info.statusUrl
  );
}
