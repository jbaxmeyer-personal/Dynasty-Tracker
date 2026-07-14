// Client for the Cloudflare Worker that proxies screenshot parsing to
// Cloudflare Workers AI. See worker/README.md for the response contract.

export type ImportTable = "recruits" | "school_prestige" | "season_team_stats";

export interface ParsedRow {
  [key: string]: string | number | boolean | null;
}

export interface ParseResponse {
  rows: ParsedRow[];
  warning?: string;
}

export async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function parseScreenshot(
  workerUrl: string,
  table: ImportTable,
  file: File,
  context: Record<string, string | number>,
  workerSecret?: string
): Promise<ParseResponse> {
  const data = await fileToBase64(file);
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (workerSecret) headers["X-Dynasty-Auth"] = workerSecret;
  const res = await fetch(`${workerUrl.replace(/\/$/, "")}/parse`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      table,
      image: { data, mediaType: file.type || "image/jpeg" },
      context,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Worker error ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as ParseResponse;
}
