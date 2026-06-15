const IFRAME_SRC_PATTERN = /<iframe\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/i;

export function normalizeMapEmbedUrl(value: string | null | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  const iframeMatch = trimmedValue.match(IFRAME_SRC_PATTERN);
  const candidate = (iframeMatch?.[2] ?? trimmedValue)
    .replaceAll("&amp;", "&")
    .trim();

  try {
    const url = new URL(candidate);

    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
