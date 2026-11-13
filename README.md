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

### 1. Where calls actually end
Across the calls, prospect drop-off clusters into three distinct bottlenecks:
- **Opening & Purpose:** The majority of cold calls terminate within the first 20 seconds. Executive assistants and gatekeepers aggressively deflect before the caller can state value (*"In a meeting"*, *"Who is calling?"*, *"Where did you get my direct number?"*).
- **Permission & Stalling:** Prospects who allow the caller to state their purpose often default to a WhatsApp request (*"Ping me on WhatsApp first"*) or claim lack of time (*"I have only 2 minutes"*). Calls that do not secure an immediate callback time or micro-commitment drop here.
- **Objection (Late stage):** In calls that reach discovery, the primary reasons for friction are existing vendor lock-in (*"Annual contract active till next year"*), budget freezes, or lack of authority (*"Talk to the Owner / MD"*).
- **Agreed Next Steps:** Successful calls almost never produce a direct demo on the spot; they conclude with an agreed WhatsApp summary document or an exact callback time.

### 2. Transcript-Driven Changes to `frontend/content.js`
- **Stage 2 (Purpose):** Added defensive skepticism phrases (*"What is this regarding? Tell me in one sentence"*, *"Where did you get my direct number?"*, *"Drop an email to info@"*). Added distinct taps for gatekeeper deflections vs. genuine interest.
- **Stage 3 (Permission):** Grounded in WhatsApp-first sales habits (*"Ping me on WhatsApp first"*, *"Send brochure on WhatsApp"*). Taps allow the rep to quickly log whether a callback time was granted or a document requested.
- **Stage 6 (Objection):** Replaced vague objections with concrete commercial realities: annual vendor lock-in, quarterly budget freeze, and referral to purchase/owner.
- **Caller Experience (Cognitive Load):** Designed for a 420px companion window beside the dialer. Large 56px+ tap targets, clear full-fill selected states, a prominent verbatim text area for Stage 5 (Their need), and an obvious separate End Call action to prevent accidental hang-ups.

## Run it yourself
1. Supabase: run `db/schema.sql` in the SQL editor.
2. Backend: `cd backend && cp .env.example .env`, fill it in, `npm install && npm start`.
3. Frontend: set `API_URL` in `frontend/config.js`, serve the folder.

## Deploy
- Render: New Web Service, root directory `backend`, build `npm install`, start `npm start`,
  env vars `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GROQ_API_KEY`.
- Vercel: import the repo, root directory `frontend`, framework "Other", no build command.
