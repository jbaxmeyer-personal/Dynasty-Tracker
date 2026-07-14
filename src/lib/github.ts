// Thin client over the GitHub Contents API. The repo itself is the database:
// every read/write is a GET/PUT against /repos/{owner}/{repo}/contents/{path}.
// Auth is a personal access token the user pastes into Settings (see AUTH.md) -
// there is no OAuth backend because this is a single-user static site.

const API_BASE = "https://api.github.com";

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export class GitHubApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "GitHubApiError";
  }
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// UTF-8 safe base64 encode/decode (atob/btoa are Latin1-only).
function b64EncodeUtf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function b64DecodeUtf8(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export interface FileResult<T> {
  data: T;
  sha: string;
}

/** Reads and JSON-parses a file. Returns null if the file does not exist (404). */
export async function readJsonFile<T>(
  cfg: GitHubConfig,
  path: string
): Promise<FileResult<T> | null> {
  const url = `${API_BASE}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIPath(
    path
  )}?ref=${encodeURIComponent(cfg.branch)}`;
  const res = await fetch(url, { headers: authHeaders(cfg.token) });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new GitHubApiError(res.status, await describeError(res));
  }
  const json = await res.json();
  if (Array.isArray(json)) {
    throw new GitHubApiError(400, `${path} is a directory, not a file`);
  }
  const content = b64DecodeUtf8(json.content);
  return { data: JSON.parse(content) as T, sha: json.sha };
}

/** Writes (creates or updates) a JSON file as a single commit. */
export async function writeJsonFile(
  cfg: GitHubConfig,
  path: string,
  data: unknown,
  message: string,
  sha?: string
): Promise<string> {
  const url = `${API_BASE}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIPath(
    path
  )}`;
  const body: Record<string, unknown> = {
    message,
    content: b64EncodeUtf8(JSON.stringify(data, null, 2) + "\n"),
    branch: cfg.branch,
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: "PUT",
    headers: { ...authHeaders(cfg.token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new GitHubApiError(res.status, await describeError(res));
  }
  const json = await res.json();
  return json.content.sha as string;
}

async function describeError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.message ? `${res.status} ${res.statusText}: ${body.message}` : `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

function encodeURIPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

/** Verifies the token can read the repo. Used by the Settings page "Test connection" button. */
export async function testConnection(cfg: GitHubConfig): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_BASE}/repos/${cfg.owner}/${cfg.repo}`, {
      headers: authHeaders(cfg.token),
    });
    if (!res.ok) return { ok: false, error: await describeError(res) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
