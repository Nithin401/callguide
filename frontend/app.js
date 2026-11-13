const API = window.API_URL.replace(/\/$/, "");
const STAGES = window.STAGES, OUTCOMES = window.OUTCOMES;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const app = $("#app");

let S = { call: null, stage: 0, taps: {}, words: {}, startedAt: 0, timer: null };

function setStatus(t) { $("#status").textContent = t || ""; }

async function api(path, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 60000); // Render free tier can take ~50s to wake
  setStatus("Connecting to server…");
  try {
    const r = await fetch(API + path, { headers: { "Content-Type": "application/json" }, ...opts, signal: ctrl.signal });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(body.error || r.statusText);
    setStatus("");
    return body;
  } catch (e) {
    setStatus("Server problem: " + (e.name === "AbortError" ? "timed out" : e.message));
    throw e;
  } finally { clearTimeout(t); }
}
const post = (p, b) => api(p, { method: "POST", body: JSON.stringify(b) });

function nav(view) {
  document.querySelectorAll(".top nav button").forEach((b) => b.classList.toggle("on", b.dataset.view === view));
}
document.querySelectorAll(".top nav button").forEach((b) => (b.onclick = () => (b.dataset.view === "new" ? viewNew() : viewPast())));

/* ---------- Start a call ---------- */
function viewNew(error = "") {
  clearInterval(S.timer);
  nav("new");
  if (S.call && S.call.status === "open") return viewCall();
  app.innerHTML = `
    <form class="card stack" id="start" style="max-width:520px">
      <h1>Start a call</h1>
      <div><label for="pn">Who are you calling?</label><input id="pn" type="text" required autocomplete="off" placeholder="Name and role, e.g. Mr. Rao, MD"></div>
      <div><label for="co">Company</label><input id="co" type="text" required autocomplete="off"></div>
      <p class="err" id="err">${esc(error)}</p>
      <button class="btn primary" id="go">Start call</button>
    </form>`;
  $("#start").onsubmit = async (e) => {
    e.preventDefault();
    $("#go").disabled = true;
    try {
      S = { call: await post("/calls", { prospect_name: $("#pn").value, company: $("#co").value }), stage: 0, taps: {}, words: {}, startedAt: Date.now(), timer: null };
      viewCall();
    } catch (err) { viewNew(err.message); }
  };
}

/* ---------- The call screen ---------- */
function viewCall() {
  nav("new");
  const st = STAGES[S.stage];
  const last = S.stage === STAGES.length - 1;
  app.innerHTML = `
    <div class="call">
      <div class="meta">
        <div class="who">${esc(S.call.prospect_name)}<small>${esc(S.call.company)}</small></div>
        <div class="timer" id="timer" aria-label="Call time">00:00</div>
      </div>
      <ol class="rail" aria-label="Call stages">
        ${STAGES.map((s, i) => `<li class="${i === S.stage ? "now" : i < S.stage ? "done" : ""}" ${i === S.stage ? 'aria-current="step"' : ""}>${i + 1}. ${esc(s.name)}</li>`).join("")}
      </ol>
      <section class="card stack">
        <div>
          <div class="stage-count">Stage ${S.stage + 1} of ${STAGES.length}</div>
          <h2 class="stage-title">${esc(st.name)}</h2>
          <p class="purpose">${esc(st.purpose)}</p>
        </div>
        <div><h3>They may say</h3><ul class="say">${st.say.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div><h3>What happened</h3>
          <div class="taps">${st.taps.map((t) => `<button class="tap" aria-pressed="${S.taps[S.stage] === t}">${esc(t)}</button>`).join("")}</div>
        </div>
        <div><label for="words">Their words</label>
          <textarea id="words" placeholder="${S.stage === 4 ? "Write exactly what they said about their goal or problem" : "Only if something is worth keeping"}">${esc(S.words[S.stage] || "")}</textarea>
        </div>
        <p class="err" id="err"></p>
        <div class="actions">
          <button class="btn danger" id="end">End call</button>
          <button class="btn primary" id="next">${last ? "Finish call" : "Next: " + esc(STAGES[S.stage + 1].name)}</button>
        </div>
      </section>
    </div>`;
  tick(); clearInterval(S.timer); S.timer = setInterval(tick, 1000);

  document.querySelectorAll(".tap").forEach((b, i) => (b.onclick = () => {
    S.taps[S.stage] = S.taps[S.stage] === st.taps[i] ? null : st.taps[i]; // tap again to undo
    document.querySelectorAll(".tap").forEach((x, j) => x.setAttribute("aria-pressed", S.taps[S.stage] === st.taps[j]));
  }));
  $("#words").oninput = (e) => (S.words[S.stage] = e.target.value);
  $("#next").onclick = async () => {
    $("#next").disabled = true;
    try { await saveStage(); if (last) return openEnd(); S.stage++; viewCall(); }
    catch (e) { $("#err").textContent = "Could not save. " + e.message; $("#next").disabled = false; }
  };
  $("#end").onclick = openEnd;
}

function tick() {
  const s = Math.floor((Date.now() - S.startedAt) / 1000);
  const el = $("#timer"); if (el) el.textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

async function saveStage() {
  const tap = S.taps[S.stage], words = (S.words[S.stage] || "").trim();
  if (!tap && !words) return;
  await post(`/calls/${S.call.id}/stages`, { stage: S.stage + 1, tap, prospect_words: words });
}

/* ---------- End the call ---------- */
function openEnd() {
  const d = $("#end-dialog");
  d.innerHTML = `
    <form method="dialog" class="stack" id="endform">
      <h2>How did the call end?</h2>
      <div><label for="oc">Outcome</label>
        <select id="oc" required><option value="">Choose one</option>${OUTCOMES.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("")}</select></div>
      <div><label for="ns">The one next step (channel or time)</label><input id="ns" type="text" placeholder="e.g. Send one-pager on WhatsApp, call Thu 4pm"></div>
      <p class="err" id="derr"></p>
      <div class="actions"><button type="button" class="btn" id="cancel">Back to call</button><button class="btn primary" id="save">Save call</button></div>
    </form>`;
  d.showModal();
  $("#cancel").onclick = () => { d.close(); const n = $("#next"); if (n) n.disabled = false; };
  $("#endform").onsubmit = async (e) => {
    e.preventDefault();
    if (!$("#oc").value) { $("#derr").textContent = "Choose an outcome."; return; }
    $("#save").disabled = true;
    try {
      await saveStage().catch(() => {});
      const done = await post(`/calls/${S.call.id}/close`, { outcome: $("#oc").value, next_step: $("#ns").value, reached_stage: S.stage + 1 });
      d.close(); clearInterval(S.timer); S.call = null; viewSaved(done);
    } catch (err) { $("#derr").textContent = err.message; $("#save").disabled = false; }
  };
}

function viewSaved(c) {
  app.innerHTML = `
    <div class="card stack" style="max-width:560px">
      <h1>Call saved</h1>
      <p>${esc(c.prospect_name)}, ${esc(c.company)}. Reached stage ${c.reached_stage}: ${esc(STAGES[c.reached_stage - 1].name)}.</p>
      ${c.ai_note ? `<div class="note"><strong>Outcome check:</strong> ${esc(c.ai_note)}</div>` : ""}
      <div class="actions"><button class="btn" id="past">Past calls</button><button class="btn primary" id="again">Start another call</button></div>
    </div>`;
  $("#past").onclick = viewPast; $("#again").onclick = viewNew;
}

/* ---------- Past calls ---------- */
async function viewPast() {
  nav("past"); clearInterval(S.timer);
  app.innerHTML = `<div class="card"><h1>Past calls</h1><p>Loading…</p></div>`;
  try {
    const calls = await api("/calls");
    const label = Object.fromEntries(OUTCOMES);
    app.innerHTML = `<div class="card"><h1>Past calls</h1>${calls.length ? `<ul class="list">${calls.map((c) => `
      <li><div><strong>${esc(c.prospect_name)}, ${esc(c.company)}</strong>
        <div class="sub">${esc(label[c.outcome] || "In progress")}${c.next_step ? " · " + esc(c.next_step) : ""} · ${new Date(c.started_at).toLocaleString()}</div>
        ${c.ai_note ? `<div class="sub">Check: ${esc(c.ai_note)}</div>` : ""}</div>
      <span class="pill ${c.status}">${c.reached_stage}. ${esc(STAGES[c.reached_stage - 1].name)}</span></li>`).join("")}</ul>` : `<p>No calls yet. Start one from New call.</p>`}</div>`;
  } catch (e) { app.innerHTML = `<div class="card"><h1>Past calls</h1><p class="err">Could not load calls. ${esc(e.message)}</p></div>`; }
}

fetch(API + "/health").catch(() => {}); // wake the Render free tier early
viewNew();
