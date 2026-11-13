import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, GROQ_API_KEY, PORT = 3000 } = process.env;
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

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
  console.error(e);
  res.status(500).json({ error: e.message || "Server error" });
});
const clean = (v, max = 1000) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// 1. Health
app.get("/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// 2. Start a call
app.post("/calls", wrap(async (req, res) => {
  const prospect_name = clean(req.body.prospect_name, 120);
  const company = clean(req.body.company, 120);
  if (!prospect_name || !company) return res.status(400).json({ error: "Prospect name and company are required." });
  const { data, error } = await db.from("calls").insert({ prospect_name, company }).select().single();
  if (error) throw error;
  res.status(201).json(data);
}));

// 3. Save what happened at one stage (upsert, so going back and editing is safe)
app.post("/calls/:id/stages", wrap(async (req, res) => {
  const stage = Number(req.body.stage);
  if (!Number.isInteger(stage) || stage < 1 || stage > 8) return res.status(400).json({ error: "Stage must be 1 to 8." });
  const row = {
    call_id: req.params.id,
    stage,
    tap: clean(req.body.tap, 200) || null,
    prospect_words: clean(req.body.prospect_words, 2000) || null,
    saved_at: new Date().toISOString(),
  };
  const { data, error } = await db.from("stage_results").upsert(row, { onConflict: "call_id,stage" }).select().single();
  if (error) throw error;
  await db.from("calls").update({ reached_stage: stage }).eq("id", req.params.id).lt("reached_stage", stage);
  res.json(data);
}));

// 4. Close a call, with an LLM check that the logged outcome matches what was said
app.post("/calls/:id/close", wrap(async (req, res) => {
  const outcome = clean(req.body.outcome, 40);
  if (!OUTCOMES.includes(outcome)) return res.status(400).json({ error: "Pick an outcome." });
  const reached_stage = Math.min(8, Math.max(1, Number(req.body.reached_stage) || 1));
  const next_step = clean(req.body.next_step, 300) || null;

  const { data: stages } = await db.from("stage_results").select("stage,tap,prospect_words").eq("call_id", req.params.id).order("stage");
  const ai_note = await checkOutcome(outcome, next_step, stages || []);

  const { data, error } = await db.from("calls")
    .update({ status: "closed", outcome, next_step, ai_note, reached_stage, ended_at: new Date().toISOString() })
    .eq("id", req.params.id).select().single();
  if (error) throw error;
  res.json(data);
}));

// 5. List calls
app.get("/calls", wrap(async (_req, res) => {
  const { data, error } = await db.from("calls").select("*").order("started_at", { ascending: false }).limit(200);
  if (error) throw error;
  res.json(data);
}));

// One call with its stage results
app.get("/calls/:id", wrap(async (req, res) => {
  const { data: call, error } = await db.from("calls").select("*").eq("id", req.params.id).single();
  if (error) return res.status(404).json({ error: "Call not found." });
  const { data: stages } = await db.from("stage_results").select("*").eq("call_id", req.params.id).order("stage");
  res.json({ ...call, stages: stages || [] });
}));

// LLM (Groq, free tier): one job only, check the logged outcome against the notes.
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
        model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
        temperature: 0.2,
        max_tokens: 120,
        messages: [
          { role: "system", content: "You review a salesperson's cold-call log. In ONE short sentence, say whether the logged outcome matches the notes. If it does not, say which outcome the notes suggest. Do not invent facts." },
          { role: "user", content: `Logged outcome: ${OUTCOME_LABEL[outcome]}\nNext step: ${next_step || "none"}\nNotes:\n${notes}` },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    const j = await r.json();
    return j.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error("LLM check failed:", e.message);
    return null; // the app works without it
  }
}

app.listen(PORT, () => console.log(`Backend on ${PORT}`));
