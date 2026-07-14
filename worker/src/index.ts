// Cloudflare Worker: proxies screenshot parsing to Cloudflare Workers AI so the
// vision model call never happens from the browser. No third-party API key is
// needed - Workers AI is billed against the account's free neuron allowance.
//
// POST /parse
//   body: { table: "recruits" | "school_prestige" | "season_team_stats",
//           image: { data: base64string, mediaType: string },
//           context?: { school?: string, season?: number } }
//   -> { rows: Record<string, string|number|boolean|null>[], warning?: string }

export interface Env {
  AI: Ai;
  // Optional shared secret so randoms on the internet can't burn your Workers AI
  // quota. If unset, the worker accepts unauthenticated requests (fine for
  // quick local testing, not recommended once the URL is public).
  SHARED_SECRET?: string;
  // Comma-separated list of allowed origins for CORS, e.g. your GitHub Pages
  // origin. Defaults to "*" if unset.
  ALLOWED_ORIGIN?: string;
}

const VISION_MODEL = "@cf/meta/llama-3.2-11b-vision-instruct";

type Table = "recruits" | "school_prestige" | "season_team_stats";

const PROMPTS: Record<Table, string> = {
  recruits: `You are reading a screenshot of a college football video game's recruiting board or class list.
Extract every player row you can see into a JSON array. For each player return an object with exactly these keys:
name (string), position (string, e.g. QB/RB/WR/CB), home_state (string, 2-letter US state abbreviation if shown else ""),
stars (integer 1-5), overall (integer overall rating), type (one of "HS Signee", "Transfer In", "Transfer Out" - infer
from context, default "HS Signee" if it's a normal recruiting board).
Respond with ONLY the JSON array, no prose, no markdown fences.`,
  school_prestige: `You are reading a screenshot of a college football video game's team prestige / school list screen.
Extract every school row you can see into a JSON array. For each school return an object with exactly these keys:
school (string), conference (string, "" if not shown), year (integer, use the given context year if the screen doesn't show one),
prestige (number 0-5 in 0.5 increments).
Respond with ONLY the JSON array, no prose, no markdown fences.`,
  season_team_stats: `You are reading a screenshot of a college football video game's team offense/defense season stats screen.
Extract ONE JSON object (in a JSON array with one element) with exactly these keys:
school (string), year (integer), off_pts_pg, off_yds_pg, off_pass_yds_pg, off_rush_yds_pg, off_int, off_fum,
def_pts_pg, def_yds_pg, def_pass_yds_pg, def_rush_yds_pg, def_sacks, def_int, def_fum, turnover_diff (all numbers,
use 0 for any stat not visible on screen).
Respond with ONLY the JSON array, no prose, no markdown fences.`,
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Dynasty-Auth",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/parse" || request.method !== "POST") {
      return json({ error: "Not found" }, 404, corsHeaders);
    }

    if (env.SHARED_SECRET && request.headers.get("X-Dynasty-Auth") !== env.SHARED_SECRET) {
      return json({ error: "Unauthorized" }, 401, corsHeaders);
    }

    let body: {
      table?: Table;
      image?: { data: string; mediaType: string };
      context?: { school?: string; season?: number };
    };
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400, corsHeaders);
    }

    const { table, image, context } = body;
    if (!table || !PROMPTS[table]) {
      return json({ error: `table must be one of ${Object.keys(PROMPTS).join(", ")}` }, 400, corsHeaders);
    }
    if (!image?.data) {
      return json({ error: "image.data (base64) is required" }, 400, corsHeaders);
    }

    const contextLine = context
      ? `\nContext hints (use if the screen doesn't show them): school="${context.school ?? ""}", season=${context.season ?? ""}.`
      : "";

    const imageBytes = base64ToUint8Array(image.data);

    let aiResult: { response?: string };
    try {
      aiResult = (await env.AI.run(VISION_MODEL, {
        messages: [
          {
            role: "user",
            content: PROMPTS[table] + contextLine,
          },
        ],
        image: Array.from(imageBytes),
        max_tokens: 2048,
      })) as { response?: string };
    } catch (e) {
      return json({ error: `Workers AI call failed: ${e instanceof Error ? e.message : String(e)}` }, 502, corsHeaders);
    }

    const raw = aiResult.response ?? "";
    const rows = extractJsonArray(raw);
    if (rows === null) {
      return json(
        { rows: [], warning: "Model did not return parseable JSON. Raw response included for debugging.", raw },
        200,
        corsHeaders
      );
    }

    return json({ rows }, 200, corsHeaders);
  },
};

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Small open vision models often wrap JSON in prose or markdown fences despite instructions - salvage what we can. */
function extractJsonArray(text: string): unknown[] | null {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1] : text;
  const arrayMatch = candidate.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return null;
  try {
    const parsed = JSON.parse(arrayMatch[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function json(data: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
