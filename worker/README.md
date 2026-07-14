# Dynasty Tracker screenshot-parsing Worker

Proxies screenshot images to [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
so the vision model call never happens from the browser and no third-party API
key is needed. Uses `@cf/meta/llama-3.2-11b-vision-instruct`, the strongest
vision-capable model currently on Workers AI's free tier (10,000 neurons/day,
no credit card required).

**Accuracy note:** this is a much smaller model than a frontier LLM. It will
sometimes misread a stat or drop a row, especially on cluttered recruiting
boards. Treat every parse as a draft - the app's review-before-commit step
exists specifically so you can fix the model's mistakes before anything is
written to your repo.

## Deploy

1. `cd worker && npm install`
2. `npx wrangler login` (one-time, opens a browser to authorize against your
   Cloudflare account)
3. (Recommended) Set a shared secret so random internet traffic can't burn
   your daily neuron budget:
   ```
   npx wrangler secret put SHARED_SECRET
   ```
   Pick any random string. Paste the same value into the app's Settings page
   ("Worker shared secret").
4. (Optional) Restrict CORS to your GitHub Pages origin instead of `*`:
   edit `ALLOWED_ORIGIN` in `wrangler.toml`, e.g.
   `ALLOWED_ORIGIN = "https://jbaxmeyer-personal.github.io"`.
5. `npm run deploy`
6. Copy the `https://dynasty-tracker-parser.<your-subdomain>.workers.dev` URL
   wrangler prints and paste it into the app's Settings page ("Worker URL").

## Local dev

`npm run dev` runs the worker locally via `wrangler dev` (still calls the real
Workers AI API, which requires being logged in).

## Request/response contract

```
POST /parse
{
  "table": "recruits" | "school_prestige" | "season_team_stats",
  "image": { "data": "<base64>", "mediaType": "image/jpeg" },
  "context": { "school": "Toledo", "season": 2027 }
}

-> 200 { "rows": [ { ...fields... }, ... ] }
-> 200 { "rows": [], "warning": "...", "raw": "..." }   // model output wasn't parseable JSON
-> 400/401/404/502 { "error": "..." }
```

`context` is optional and only used as a hint for fields the screenshot
itself might not show (e.g. year).

## Changing the model

If accuracy on your actual screenshots is poor, swap `VISION_MODEL` in
`src/index.ts` for another vision-capable Workers AI model (e.g. a newer
Llama Vision release) and redeploy - no other code changes needed. See the
[Workers AI model catalog](https://developers.cloudflare.com/workers-ai/models/).
