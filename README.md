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
WRITE THIS YOURSELF after reading the transcripts: where calls ended, what prospects said at stages 2, 3 and 6,
and what you changed in `frontend/content.js` because of it.

## Run it yourself
1. Supabase: run `db/schema.sql` in the SQL editor.
2. Backend: `cd backend && cp .env.example .env`, fill it in, `npm install && npm start`.
3. Frontend: set `API_URL` in `frontend/config.js`, serve the folder.

## Deploy
- Render: New Web Service, root directory `backend`, build `npm install`, start `npm start`,
  env vars `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GROQ_API_KEY`.
- Vercel: import the repo, root directory `frontend`, framework "Other", no build command.
