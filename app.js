/* ============================================================
   CONFIG. Paste your Apps Script Web App URL here.
   ============================================================ */
const ENDPOINT = "https://script.google.com/macros/s/AKfycbzO8WLjGvj2QqzpaDyh9wHmZMVDxMmNIYdgLeWBP07rGtRYTU3E4-hzv7yowVWYYBu2xQ/exec";

const QS = new URLSearchParams(location.search);
const TEST = QS.get("test") === "1";
const DONE_KEY = "aies_completed_v1";

const AGENCY_ITEMS = [
  "I felt in control of the decisions in this round.",
  "The decisions in this round felt like my own.",
];

const S = {
  pid: null, version: null, plan: null,
  round: 0, rows: [], pending: [], failed: 0,
  attnPassed: null,
};

const $app = document.getElementById("app");
const $banner = document.getElementById("banner");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const view = (html) => { $app.innerHTML = html; window.scrollTo(0, 0); };

/* ---------------- network ---------------- */
async function post(payload) {
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "server error");
  return j;
}
async function postRetry(payload) {
  try { return await post(payload); }
  catch (e1) { return await post(payload); } // retry once
}
function log(payload) {
  if (TEST) { console.log("[TEST payload]", payload); return; }
  const p = postRetry(payload).catch((e) => {
    console.error("Save failed", e, payload);
    S.failed++;
    $banner.hidden = false;
    $banner.textContent = "Your response may not have saved. Please tell the researcher.";
  });
  S.pending.push(p);
}
async function getVersion() {
  if (TEST) {
    const v = parseInt(QS.get("v"), 10);
    return v >= 1 && v <= 4 ? v : 1;
  }
  return (await postRetry({ type: "next_version" })).version;
}

/* ---------------- screens ---------------- */
function landing() {
  let done = false;
  try { done = !TEST && localStorage.getItem(DONE_KEY) === "1"; } catch (e) {}
  if (done) {
    view(`<h1>Thank you</h1><p>This device has already completed the study. Please see the researcher if you think this is a mistake.</p>`);
    return;
  }
  view(`
    <h1>AI Email Assistant Study</h1>
    ${TEST ? '<p class="note">TEST MODE: nothing is saved.</p>' : ""}
    <p>You will sort some emails into "safe" or "phishing", with help from an AI assistant. It takes about 10 minutes.</p>
    <ul>
      <li>Anonymous. We collect no names, emails or demographics.</li>
      <li>You are given a random code only. It is not linked to you.</li>
      <li>You can stop and withdraw at any time by closing this page.</li>
    </ul>
    <p>By tapping Begin you agree to take part.</p>
    <div id="err"></div>
    <button class="primary" id="begin">Begin</button>`);
  document.getElementById("begin").onclick = begin;
}

async function begin() {
  const b = document.getElementById("begin");
  b.disabled = true; b.textContent = "Starting...";
  if (!TEST && ENDPOINT.startsWith("PASTE")) {
    document.getElementById("err").innerHTML = `<p class="error">ENDPOINT not set in app.js.</p>`;
    b.disabled = false; b.textContent = "Begin"; return;
  }
  try {
    S.version = await getVersion();
    S.plan = VERSIONS[S.version];
    S.pid = crypto.randomUUID();
    instructions();
  } catch (e) {
    document.getElementById("err").innerHTML = `<p class="error">Could not reach the server. Check your connection and tap Begin again, or tell the researcher.</p>`;
    b.disabled = false; b.textContent = "Begin";
  }
}

function instructions() {
  view(`
    <h1>How it works</h1>
    <p>You will see emails one at a time. For each one, decide how likely it is to be phishing (a scam trying to steal information).</p>
    <p>An AI assistant gives its opinion on every email. It may be right or wrong.</p>
    <ol>
      <li>Read the email and the AI panel.</li>
      <li>Tap one of four ratings.</li>
      <li>Tap <b>Submit</b> to go to the next email.</li>
    </ol>
    <p>First, one practice email. Then two rounds of emails.</p>
    <button class="primary" id="go">Start practice</button>`);
  document.getElementById("go").onclick = () => showEmail({
    email: PRACTICE_EMAIL, mode: "suggest", status: "practice", label: "Practice",
    meta: { round: 0, condition: "suggest", set: "practice" },
    next: () => roundIntro(0),
  });
}

function roundIntro(r) {
  const cur = S.plan[r];
  view(`
    <h1>Round ${r + 1} of 2</h1>
    <p>10 emails. Take your time but go at a natural pace.</p>
    <button class="primary" id="go">Start round ${r + 1}</button>`);
  document.getElementById("go").onclick = () => runRound(r);
}

function runRound(r) {
  const { cond, set } = S.plan[r];
  const emails = EMAIL_SETS[set];
  S.round = r + 1;
  S.attnPassed = null;
  const items = emails.map((e, i) => ({ kind: "email", e, n: i + 1 }));
  items.splice(ATTENTION_AFTER, 0, { kind: "attn" });
  let idx = 0;
  const step = () => {
    if (idx >= items.length) return agency(r);
    const it = items[idx++];
    const meta = { round: S.round, condition: cond, set };
    if (it.kind === "attn") {
      showEmail({
        email: { id: "ATTN_R" + S.round, ...ATTENTION_EMAIL }, mode: "none",
        status: "attention_check", label: "Attention check", meta, next: step,
      });
    } else {
      showEmail({
        email: it.e, mode: cond, status: "normal", label: `Email ${it.n} of 10`, meta, next: step,
      });
    }
  };
  step();
}

/* Core email screen. mode: suggest | preselect | none */
function showEmail({ email, mode, status, label, meta, next }) {
  const verdict = email.aiVerdict;
  let aiHtml = "";
  if (mode === "suggest") {
    aiHtml = `<div class="ai"><div class="ai-v">AI suggests: <b>${esc(verdict)}</b></div><div class="risk">Risk score: ${email.risk}% likely phishing.</div></div>`;
  } else if (mode === "preselect") {
    aiHtml = `<div class="ai"><div class="ai-v">AI has rated this: <b>${esc(verdict)}</b>. Submit, or change it.</div><div class="risk">Risk score: ${email.risk}% likely phishing.</div></div>`;
  }
  const defaultOn = mode === "preselect";
  const opts = SCALE.map((o, i) => `
    <label class="opt"><input type="radio" name="rating" value="${o.score}" ${defaultOn && o.label === verdict ? "checked" : ""}><span>${esc(o.label)}</span></label>`).join("");
  view(`
    <div class="progress">${esc(label)}</div>
    <div class="mail">
      <div class="from">${esc(email.from)}</div>
      <div class="subj">${esc(email.subject)}</div>
      <p>${esc(email.body)}</p>
      ${email.link ? `<p class="link">${esc(email.link)}</p>` : ""}
    </div>
    ${aiHtml}
    <div class="q">How likely is this email to be phishing?</div>
    <div class="opts" role="radiogroup">${opts}</div>
    <button class="primary" id="submit" disabled>Submit</button>`);

  const submit = document.getElementById("submit");
  const radios = [...document.querySelectorAll('input[name="rating"]')];
  const sel = () => radios.find((r) => r.checked);
  submit.disabled = !sel();
  radios.forEach((r) => r.addEventListener("change", () => { submit.disabled = false; }));

  const startTs = new Date();
  const t0 = performance.now();
  submit.onclick = () => {
    const chosen = sel();
    if (!chosen) return;
    submit.disabled = true;
    const rating = parseInt(chosen.value, 10);
    const dur = Math.round(performance.now() - t0);
    const defaultLabel = mode === "preselect" ? verdict : "";
    const defaultScore = mode === "preselect" ? SCALE.find((o) => o.label === verdict).score : null;
    const isAttn = status === "attention_check";
    const row = {
      type: "email",
      participant_id: S.pid, version: S.version, round: meta.round,
      condition: meta.condition, email_set: meta.set, email_id: email.id,
      ai_verdict: isAttn ? "" : verdict,
      ai_wrong: isAttn ? false : !!email.isAIWrong,
      participant_rating: rating,
      default_shown: defaultLabel,
      changed_default: mode === "preselect" ? rating !== defaultScore : false,
      start_ts: startTs.toISOString(), submit_ts: new Date().toISOString(),
      duration_ms: dur, status,
    };
    if (isAttn) S.attnPassed = rating === ATTENTION_EMAIL.requiredScore;
    S.rows.push(row);
    log(row);
    next();
  };
}

function agency(r) {
  const scale = (k) => `
    <div class="likert" role="radiogroup" data-k="${k}">
      ${[1, 2, 3, 4, 5, 6, 7].map((n) => `<label><input type="radio" name="a${k}" value="${n}"><span>${n}</span></label>`).join("")}
    </div>
    <div class="ends"><span>Strongly disagree</span><span>Strongly agree</span></div>`;
  view(`
    <h1>About round ${r + 1}</h1>
    <p>Rate how much you agree with each statement.</p>
    <div class="q">${esc(AGENCY_ITEMS[0])}</div>${scale(0)}
    <div class="q">${esc(AGENCY_ITEMS[1])}</div>${scale(1)}
    <button class="primary" id="next" disabled>Continue</button>`);
  const val = (k) => { const c = document.querySelector(`input[name="a${k}"]:checked`); return c ? parseInt(c.value, 10) : null; };
  const btn = document.getElementById("next");
  document.querySelectorAll(".likert input").forEach((i) => i.addEventListener("change", () => { btn.disabled = val(0) === null || val(1) === null; }));
  btn.onclick = () => {
    btn.disabled = true;
    const a1 = val(0), a2 = val(1);
    log({
      type: "agency", participant_id: S.pid, round: r + 1,
      agency_item1: a1, agency_item2: a2, agency_sum: a1 + a2,
      attention_check_passed: !!S.attnPassed,
    });
    if (r === 0) roundIntro(1); else debrief();
  };
}

async function debrief() {
  view(`<p>Saving...</p>`);
  await Promise.all(S.pending);
  const scored = S.rows.filter((x) => x.status === "normal");
  const match = (x) => x.participant_rating === SCALE.find((o) => o.label === x.ai_verdict).score;
  const total = scored.length, agreed = scored.filter(match).length;
  const pct = total ? Math.round((agreed / total) * 100) : 0;
  const perRound = [1, 2].map((r) => {
    const rr = scored.filter((x) => x.round === r);
    return `Round ${r}: ${rr.filter(match).length} of ${rr.length}`;
  });
  if (!TEST && S.failed === 0) { try { localStorage.setItem(DONE_KEY, "1"); } catch (e) {} }
  view(`
    <h1>All done, thank you!</h1>
    <p><b>The reveal:</b> the AI was not a real model. Its ratings were scripted in advance, and it was deliberately wrong on some emails. We wanted to see how the way an AI's answer is presented affects your decisions and your sense of control.</p>
    <div class="score"><div class="big">${pct}%</div><div>You gave the same rating as the AI on ${agreed} of ${total} emails.</div><div class="sub">${perRound.join(" · ")}</div></div>
    <p>This is just a friendly tally, not a test result. There are no right or wrong scores for you.</p>
    ${S.failed ? '<p class="error">Some responses may not have saved. Please tell the researcher.</p>' : ""}
    <p>You can close this page now.</p>`);
}

landing();
