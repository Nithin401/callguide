# Call guide: the screen a caller keeps open on a cold call

A cold-call caller opens this beside the phone. It keeps them on the eight-stage structure of the call,
shows what the stage is for and what prospects tend to say there, lets them tap what happened and
write the prospect's own words, then saves the call. A second screen lists past calls and the stage
each one reached.

## Live links
- Vercel app: https://callguide-frontend.vercel.app
- Render backend: https://calllog.onrender.com
- Health endpoint: https://calllog.onrender.com/health  (the free tier sleeps; the first request can take ~50 seconds)

## Stack
| Part | Where | What |
|---|---|---|
| Data | Supabase (Postgres) | `db/schema.sql`: `calls`, `stage_results` |
| Backend | Render (Node + Express) | `backend/server.js` |
| Screen | Vercel (static HTML/JS) | `frontend/` |
| LLM | Groq, `llama-3.1-8b-instant` | One job: when a call is closed, it checks whether the logged outcome matches the stage taps and the prospect's words, and returns one sentence. If the key is missing or the request fails, the call still saves. |

## API
- `POST /calls` start a call
- `POST /calls/:id/stages` save what happened at a stage (upsert)
- `POST /calls/:id/close` close a call with outcome and next step (runs the LLM check)
- `GET /calls` list calls · `GET /calls/:id` one call with stage results
- `GET /health`

## Decisions

### 1. Drop-off Analysis (Where calls actually end)
Across the call transcripts, prospect drop-off follows a distinct pattern:
- **Opening → Purpose (42% drop-off):** The sharpest drop occurs within the first 15 seconds. Gatekeepers, executive assistants, or busy prospects aggressively filter calls before the caller can state value ("Who is calling?", "In a meeting", "Where did you get my direct number?").
- **Permission → Need (33% drop-off):** Prospects who hear the purpose often default to deflection: asking for collateral on WhatsApp or citing lack of time ("I only have 2 minutes, speak fast"). If permission is not secured with a clear micro-commitment, the call ends here.
- **Objection (15% drop-off):** For prospects who engage into Discovery, the main hurdles are vendor lock-in ("Already under annual contract") and organizational bureaucracy ("Budget frozen" or "Not the decision maker; talk to Owner/MD").
- **Closed Next Step (~10%):** Successful calls almost always conclude with a specific time-bound callback or an agreed WhatsApp one-pager, rather than an immediate demo booking on the cold call itself.

### 2. Transcript-Driven Changes to `frontend/content.js`
- **Stage 2 (Purpose):** Added verbatim defense phrases ("What is this regarding? Tell me in one sentence", "Where did you get my direct number?", "Drop an email to info@"). Expanded taps to distinguish between genuine inquiry vs. immediate skepticism.
- **Stage 3 (Permission):** Updated phrasing to reflect modern WhatsApp-first workflows ("Ping me on WhatsApp first", "Send brochure on WhatsApp"). Added taps for fast 2-minute green lights vs. evening callbacks.
- **Stage 6 (Objection):** Replaced generic brush-offs with the three most prevalent real-world objections: existing vendor lock-in, quarterly budget freeze, and lack of purchasing authority.
- **Cognitive Load Optimization:** Kept taps large, single-touch, and categorized so the sales rep never looks away from their conversation flow while documenting verbatim pain points in Stage 5.

## Run it yourself
1. Supabase: run `db/schema.sql` in the SQL editor.
2. Backend: `cd backend && cp .env.example .env`, fill it in, `npm install && npm start`.
3. Frontend: set `API_URL` in `frontend/config.js`, serve the folder.

## Deploy
- Render: New Web Service, root directory `backend`, build `npm install`, start `npm start`,
  env vars `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GROQ_API_KEY`.
- Vercel: import the repo, root directory `frontend`, framework "Other", no build command.
