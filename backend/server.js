import express from "express";
import cors from "cors";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, GROQ_API_KEY, GROQ_MODEL, PORT = 3000 } = process.env;

// Initialize Supabase client if credentials exist
let db = null;
try {
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  }
} catch (e) {
  console.warn("Supabase init warning:", e.message);
}

// In-memory fallback store to ensure the caller's screen never breaks
const memoryCalls = new Map();
const memoryStages = new Map();

const OUTCOMES = [
  "next_step_agreed",
  "callback_time",
  "referred",
  "not_interested",
  "wrong_person",
  "dropped",
];

const OUTCOME_LABEL = {
  next_step_agreed: "Next step agreed",
  callback_time: "Callback time given",
  referred: "Referred to a colleague",
  not_interested: "Not interested",
  wrong_person: "Wrong person or number",
  dropped: "Call dropped",
};

const app = express();
app.use(cors());
app.use(express.json({ limit: "100kb" }));

const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error("Endpoint error:", e);
  res.status(500).json({ error: e.message || "Server error" });
});

const clean = (v, max = 1000) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// 1. Health
app.get("/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// 2. Start a call
app.post("/calls", wrap(async (req, res) => {
  const prospect_name = clean(req.body.prospect_name, 120);
  const company = clean(req.body.company, 120);
  if (!prospect_name || !company) {
    return res.status(400).json({ error: "Prospect name and company are required." });
  }

  // Attempt database insert first
  if (db) {
    try {
      const { data, error } = await db.from("calls").insert({ prospect_name, company }).select().single();
      if (!error && data) return res.status(201).json(data);
    } catch (dbErr) {
      console.warn("Supabase insert fallback:", dbErr.message);
    }
  }

  // Fallback to memory store
  const row = {
    id: crypto.randomUUID(),
    prospect_name,
    company,
    status: "open",
    reached_stage: 1,
    outcome: null,
    next_step: null,
    ai_note: null,
    started_at: new Date().toISOString(),
    ended_at: null,
  };
  memoryCalls.set(row.id, row);
  res.status(201).json(row);
}));

// 3. Save what happened at one stage
app.post("/calls/:id/stages", wrap(async (req, res) => {
  const stage = Number(req.body.stage);
  if (!Number.isInteger(stage) || stage < 1 || stage > 8) {
    return res.status(400).json({ error: "Stage must be 1 to 8." });
  }

  const row = {
    call_id: req.params.id,
    stage,
    tap: clean(req.body.tap, 200) || null,
    prospect_words: clean(req.body.prospect_words, 2000) || null,
    saved_at: new Date().toISOString(),
  };

  if (db) {
    try {
      const { data, error } = await db.from("stage_results").upsert(row, { onConflict: "call_id,stage" }).select().single();
      if (!error && data) {
        await db.from("calls").update({ reached_stage: stage }).eq("id", req.params.id).lt("reached_stage", stage);
        return res.json(data);
      }
    } catch (dbErr) {
      console.warn("Supabase stage fallback:", dbErr.message);
    }
  }

  // Fallback in-memory
  const stageRow = { id: crypto.randomUUID(), ...row };
  memoryStages.set(`${req.params.id}:${stage}`, stageRow);
  const call = memoryCalls.get(req.params.id);
  if (call && call.reached_stage < stage) {
    call.reached_stage = stage;
  }
  res.json(stageRow);
}));

// 4. Close a call, with Groq LLM check
app.post("/calls/:id/close", wrap(async (req, res) => {
  const outcome = clean(req.body.outcome, 40);
  if (!OUTCOMES.includes(outcome)) return res.status(400).json({ error: "Pick an outcome." });
  const reached_stage = Math.min(8, Math.max(1, Number(req.body.reached_stage) || 1));
  const next_step = clean(req.body.next_step, 300) || null;

  let stages = [];
  if (db) {
    try {
      const { data } = await db.from("stage_results").select("stage,tap,prospect_words").eq("call_id", req.params.id).order("stage");
      if (data && data.length) stages = data;
    } catch {}
  }

  if (!stages.length) {
    stages = Array.from(memoryStages.values())
      .filter((s) => s.call_id === req.params.id)
      .sort((a, b) => a.stage - b.stage);
  }

  const ai_note = await checkOutcome(outcome, next_step, stages);

  if (db) {
    try {
      const { data, error } = await db.from("calls")
        .update({ status: "closed", outcome, next_step, ai_note, reached_stage, ended_at: new Date().toISOString() })
        .eq("id", req.params.id).select().single();
      if (!error && data) return res.json(data);
    } catch (dbErr) {
      console.warn("Supabase close fallback:", dbErr.message);
    }
  }

  // Fallback in-memory
  const call = memoryCalls.get(req.params.id) || {
    id: req.params.id,
    prospect_name: "Prospect",
    company: "Company",
    started_at: new Date().toISOString(),
  };
  call.status = "closed";
  call.outcome = outcome;
  call.next_step = next_step;
  call.ai_note = ai_note;
  call.reached_stage = reached_stage;
  call.ended_at = new Date().toISOString();
  memoryCalls.set(req.params.id, call);
  res.json(call);
}));

// 5. List calls
app.get("/calls", wrap(async (_req, res) => {
  if (db) {
    try {
      const { data, error } = await db.from("calls").select("*").order("started_at", { ascending: false }).limit(200);
      if (!error && data) return res.json(data);
    } catch (dbErr) {
      console.warn("Supabase list fallback:", dbErr.message);
    }
  }

  const list = Array.from(memoryCalls.values()).sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
  res.json(list);
}));

// 6. One call with its stage results
app.get("/calls/:id", wrap(async (req, res) => {
  if (db) {
    try {
      const { data: call, error } = await db.from("calls").select("*").eq("id", req.params.id).single();
      if (!error && call) {
        const { data: stages } = await db.from("stage_results").select("*").eq("call_id", req.params.id).order("stage");
        return res.json({ ...call, stages: stages || [] });
      }
    } catch {}
  }

  const call = memoryCalls.get(req.params.id);
  if (!call) return res.status(404).json({ error: "Call not found." });
  const stages = Array.from(memoryStages.values())
    .filter((s) => s.call_id === req.params.id)
    .sort((a, b) => a.stage - b.stage);
  res.json({ ...call, stages });
}));

// LLM (Groq): Checks whether the logged outcome matches the notes.
async function checkOutcome(outcome, next_step, stages) {
  if (!GROQ_API_KEY) return null;
  const notes = stages
    .filter((s) => s.tap || s.prospect_words)
    .map((s) => `Stage ${s.stage}: ${s.tap || "-"} | "${s.prospect_words || ""}"`)
    .join("\n");
  if (!notes) return null;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL || "qwen/qwen3.8-27b",
        temperature: 0.2,
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content: "You review a salesperson's cold-call log. In ONE short sentence, say whether the logged outcome matches the notes. If it does not, say which outcome the notes suggest. Do not invent facts.",
          },
          {
            role: "user",
            content: `Logged outcome: ${OUTCOME_LABEL[outcome]}\nNext step: ${next_step || "none"}\nNotes:\n${notes}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    const j = await r.json();
    return j.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error("LLM check failed:", e.message);
    return null;
  }
}

app.listen(PORT, () => console.log(`Backend on ${PORT}`));
