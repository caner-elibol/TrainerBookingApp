export function extractErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "Bir şeyler ters gitti.";
  const d = data as Record<string, unknown>;

  if (typeof d.error === "string") return d.error;

  if (typeof d.title === "string") {
    if (d.errors && typeof d.errors === "object") {
      const firstKey = Object.keys(d.errors as object)[0];
      const messages = (d.errors as Record<string, string[]>)[firstKey];
      if (messages?.length) return messages[0];
    }
    return d.title;
  }

  return "Bir şeyler ters gitti.";
}
