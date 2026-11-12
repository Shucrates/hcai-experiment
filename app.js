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


/* ---------------- icons (Gmail chrome only) ---------------- */
const ic = (d, s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
const ICON = {
  back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  archive: "M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z",
  trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  mail: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
  more: "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  star: "M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z",
  reply: "M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z",
  fwd: "M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z",
  down: "M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z",
};

/* ---------------- small building blocks ---------------- */
const scaleChips = SCALE.map((o, i) => `<span class="chip"><i class="od d${i}"></i>${esc(o.label)}</span>`).join("");

/* Layout: content at the top, one action pinned to the bottom (thumb zone) */
const screen = (top, foot = "") => view(`
  <div class="screen">
    <div class="top">${TEST ? '<div class="testtag">Test mode, nothing is saved</div>' : ""}${top}</div>
    ${foot ? `<div class="foot">${foot}</div>` : ""}
  </div>`);

/* ---------------- screens ---------------- */
function landing() {
  let done = false;
  try { done = !TEST && localStorage.getItem(DONE_KEY) === "1"; } catch (e) {}
  if (done) {
    screen(`<h1>You've already taken part.</h1><p class="sub">Thanks! If that seems wrong, let the researcher know.</p>`);
    return;
  }
  screen(`
    <div class="landing">
      <div class="eyebrow fi" style="--i:0">AI Email Assistant Study</div>
      <h1 class="fi" style="--i:1">Spot the phishing emails.</h1>
      <p class="sub fi" style="--i:2">An AI will help. It isn't always right.</p>
      <div class="sky fi" style="--i:3" aria-hidden="true">
        <canvas id="plane"></canvas>
      </div>
      <div class="meta fi" style="--i:4">
        <span>About 10 min</span><span>20 emails</span><span>Anonymous</span>
      </div>
      <details class="info fi" style="--i:5">
        <summary>Study details and privacy</summary>
        <div class="info-body">
          <h3>What you'll do</h3>
          <p>Read a practice email, then two rounds of 10 emails. For each one, rate how likely it is to be phishing. An AI assistant gives its opinion on every email. After each round, answer two short questions. Some details about the study are explained at the end.</p>
          <h3>What we record</h3>
          <ul>
            <li>Your rating for each email</li>
            <li>How long you spent on each email</li>
            <li>Your answers to the short questions after each round</li>
            <li>A random ID made on this device, so your answers can be grouped</li>
          </ul>
          <h3>What we don't record</h3>
          <p>No name, email address, student ID, demographics, or typed text. The random ID can't be linked back to you.</p>
          <h3>Where it goes</h3>
          <p>Answers are saved to a spreadsheet only the research team can open, and are used for this group project only.</p>
          <h3>Leaving the study</h3>
          <p>Taking part is voluntary. You can stop at any time by closing the page. Answers saved before you leave stay in the data, but because they're anonymous they can't be traced to you.</p>
          <h3>Questions</h3>
          <p>Ask the researcher who shared this link.</p>
        </div>
      </details>
      <div id="err"></div>
    </div>`, `
    <div class="fi" style="--i:6">
      <button class="primary" id="begin">Begin</button>
      <p class="fine">Tapping Begin means you agree to take part.</p>
    </div>`);
  S.planeAnim = skyPlane(document.getElementById("plane"));
  document.getElementById("begin").onclick = begin;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function begin() {
  const b = document.getElementById("begin");
  const err = (msg) => {
    document.getElementById("err").innerHTML = `<p class="error">${msg}</p>`;
    b.disabled = false; b.textContent = "Begin";
    S.planeAnim.back();
  };
  b.disabled = true; b.textContent = "Starting...";
  if (!TEST && ENDPOINT.startsWith("PASTE")) return err("ENDPOINT not set in app.js.");
  S.planeAnim.away();
  try {
    const [v] = await Promise.all([getVersion(), wait(900)]); // let the plane leave first
    S.version = v;
    S.plan = VERSIONS[S.version];
    S.pid = crypto.randomUUID();
    instructions();
  } catch (e) {
    err("Couldn't connect. Check your signal and try again.");
  }
}

function instructions() {
  screen(`
    <div class="eyebrow">How it works</div>
    <h1>Three steps per email.</h1>
    <ol class="how">
      <li><span class="n">1</span><div><b>Read the email</b><small>It looks like Gmail.</small></div></li>
      <li><span class="n">2</span><div><b>Pick a rating</b><div class="chips">${scaleChips}</div></div></li>
      <li><span class="n">3</span><div><b>Tap Submit</b><small>Then the next one appears.</small></div></li>
    </ol>
    <div class="callout">Each email comes with the AI's opinion.</div>`, `
    <button class="primary" id="go">Try a practice email</button>`);
  document.getElementById("go").onclick = () => showEmail({
    email: PRACTICE_EMAIL, mode: "suggest", status: "practice", label: "Practice", frac: 0,
    meta: { round: 0, condition: "suggest", set: "practice" },
    next: () => roundIntro(0),
  });
}

function roundIntro(r) {
  screen(`
    <div class="segs"><i class="on"></i><i class="${r === 1 ? "on" : ""}"></i></div>
    <div class="eyebrow">Round ${r + 1} of 2</div>
    <h1>${r === 0 ? "Practice done. Now for real." : "Halfway there."}</h1>
    <p class="sub">10 emails, plus one quick attention check.</p>`, `
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
  let idx = 0, lastN = 0;
  const step = () => {
    if (idx >= items.length) return agency(r);
    const it = items[idx++];
    const meta = { round: S.round, condition: cond, set };
    if (it.kind === "attn") {
      showEmail({
        email: { id: "ATTN_R" + S.round, ...ATTENTION_EMAIL }, mode: "none",
        status: "attention_check", label: "Attention check", frac: lastN / 10, meta, next: step,
      });
    } else {
      lastN = it.n;
      showEmail({
        email: it.e, mode: cond, status: "normal", label: `${it.n} of 10`, frac: (it.n - 1) / 10, meta, next: step,
      });
    }
  };
  step();
}

/* Gmail-style mail view (kept faithful on purpose) */
const AV = ["#1a73e8", "#d93025", "#188038", "#e37400", "#9334e6", "#007b83", "#c5221f"];
const TIMES = ["10:42 AM", "9:15 AM", "8:03 AM", "7:48 AM", "Yesterday", "11:20 AM", "6:31 AM"];
function gmailView(email) {
  const m = /^(.*?)\s*<(.+)>$/.exec(email.from) || [0, email.from, ""];
  const name = m[1], addr = m[2];
  const h = [...email.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  // Body: blank line = new paragraph, single newline = line break.
  // "{link}" in the body places the link there; otherwise it goes after the body.
  const url = esc((email.link || "").replace(/^Link:\s*/, ""));
  const linkHtml = url ? `<span class="g-link">${url}</span>` : "";
  let paras = String(email.body).split(/\n{2,}/).map((p) => esc(p).replace(/\n/g, "<br>"));
  const placed = paras.some((p) => p.includes("{link}"));
  paras = paras.map((p) => p.replace("{link}", linkHtml));
  const body = paras.map((p) => `<p>${p}</p>`).join("");
  const link = url && !placed ? `<p>${linkHtml}</p>` : "";
  const footer = email.footer ? `<div class="g-foot">${esc(email.footer).replace(/\n/g, "<br>")}</div>` : "";
  return `
  <div class="gmail">
    <div class="g-bar">
      <span class="g-ico">${ic(ICON.back)}</span><span class="grow"></span>
      <span class="g-ico">${ic(ICON.archive)}</span><span class="g-ico">${ic(ICON.trash)}</span><span class="g-ico">${ic(ICON.mail)}</span><span class="g-ico">${ic(ICON.more)}</span>
    </div>
    <div class="g-scroll">
      <div class="g-subj"><h2>${esc(email.subject)}</h2><span class="g-chip">Inbox</span><span class="g-ico g-star">${ic(ICON.star)}</span></div>
      <div class="g-head">
        <div class="g-av" style="background:${AV[h % AV.length]}">${esc(name.trim()[0] || "?").toUpperCase()}</div>
        <div class="g-meta">
          <div class="g-line1"><b>${esc(name)}</b><span class="g-time">${TIMES[h % TIMES.length]}</span></div>
          <div class="g-line2"><span>to me</span>${ic(ICON.down, 18)}</div>
        </div>
        <span class="g-ico">${ic(ICON.reply, 22)}</span><span class="g-ico">${ic(ICON.more, 22)}</span>
      </div>
      ${addr ? `<div class="g-addr">&lt;${esc(addr)}&gt;</div>` : ""}
      <div class="g-body">${body}${link}${footer}</div>
      <div class="g-actions"><span>${ic(ICON.reply, 18)}Reply</span><span>${ic(ICON.fwd, 18)}Forward</span></div>
    </div>
  </div>`;
}

/* Core email screen. mode: suggest | preselect | none */
function showEmail({ email, mode, status, label, frac = 0, meta, next }) {
  const verdict = email.aiVerdict;
  let aiHtml = "";
  if (mode === "suggest" || mode === "preselect") {
    const txt = mode === "suggest"
      ? `AI suggests: <b>${esc(verdict)}</b>`
      : `AI has rated this: <b>${esc(verdict)}</b>. Submit, or change it.`;
    const band = SCALE.findIndex((o) => o.label === verdict);
    aiHtml = `
    <div class="ai">
      <div class="ai-row"><div class="ai-v">${txt}</div><span class="risk">${email.risk}% risk</span></div>
      <div class="gauge" role="img" aria-label="AI risk score ${email.risk} out of 100, from safe to phishing" style="--r:${email.risk}">
        <i class="g-mark d${band}"></i>
      </div>
    </div>`;
  }
  const defaultOn = mode === "preselect";
  const opts = SCALE.map((o, i) => `
    <label class="opt"><input type="radio" name="rating" value="${o.score}" ${defaultOn && o.label === verdict ? "checked" : ""}><span><i class="od d${i}"></i>${esc(o.label)}</span></label>`).join("");
  view(`
  <div class="screen mail">
    <div class="topbar"><span class="count">${esc(label)}</span><div class="prog"><i style="--p:${frac}"></i></div></div>
    ${gmailView(email)}
    <div class="panel">
      ${aiHtml}
      ${status === "practice" ? '<p class="hint">Tap a rating, then Submit.</p>' : ""}
      <div class="opts" role="radiogroup" aria-label="How likely is this email to be phishing?">${opts}</div>
      <button class="primary" id="submit" disabled>Submit</button>
    </div>
  </div>`);

  const submit = document.getElementById("submit");
  const radios = [...document.querySelectorAll('input[name="rating"]')];
  const sel = () => radios.find((r) => r.checked);
  submit.disabled = !sel();
  radios.forEach((r) => r.addEventListener("change", () => { submit.disabled = false; try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} }));

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
    <div class="likert" role="radiogroup" aria-label="${esc(AGENCY_ITEMS[k])}">
      ${[1, 2, 3, 4, 5, 6, 7].map((n) => `<label><input type="radio" name="a${k}" value="${n}"><span>${n}</span></label>`).join("")}
    </div>
    <div class="ends"><span>Strongly disagree</span><span>Strongly agree</span></div>`;
  screen(`
    <div class="eyebrow">Round ${r + 1} done</div>
    <h1>How did that feel?</h1>
    <div class="aq-block"><p class="aq">${esc(AGENCY_ITEMS[0])}</p>${scale(0)}</div>
    <div class="aq-block"><p class="aq">${esc(AGENCY_ITEMS[1])}</p>${scale(1)}</div>`, `
    <button class="primary" id="next" disabled>Continue</button>`);
  const val = (k) => { const c = document.querySelector(`input[name="a${k}"]:checked`); return c ? parseInt(c.value, 10) : null; };
  const btn = document.getElementById("next");
  document.querySelectorAll(".likert input").forEach((i) => i.addEventListener("change", () => {
    btn.disabled = val(0) === null || val(1) === null;
    // after the first answer, bring the second question into view
    if (i.name === "a0" && val(1) === null) document.querySelectorAll(".aq-block")[1].scrollIntoView({ behavior: "smooth", block: "center" });
  }));
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
  screen(`<div class="eyebrow">Saving...</div>`);
  await Promise.all(S.pending);
  const scored = S.rows.filter((x) => x.status === "normal");
  const match = (x) => x.participant_rating === SCALE.find((o) => o.label === x.ai_verdict).score;
  const total = scored.length, agreed = scored.filter(match).length;
  const pct = total ? Math.round((agreed / total) * 100) : 0;
  const bars = [1, 2].map((r) => {
    const rr = scored.filter((x) => x.round === r), a = rr.filter(match).length;
    return `<div class="rb"><span>Round ${r}</span><div class="rbt"><i style="--p:${rr.length ? a / rr.length : 0}"></i></div><b>${a}/${rr.length}</b></div>`;
  }).join("");
  if (!TEST && S.failed === 0) { try { localStorage.setItem(DONE_KEY, "1"); } catch (e) {} }
  screen(`
    <div class="eyebrow">All done</div>
    <div class="bignum">${pct}%</div>
    <p class="sub">You agreed with the AI on ${agreed} of ${total} emails.</p>
    <div class="rbars">${bars}</div>
    <h2 class="h2">Behind the scenes</h2>
    <ul class="reveal">
      <li>The AI was scripted, not real.</li>
      <li>It was wrong on purpose, sometimes.</li>
      <li>We're studying how the way it shows answers affects you.</li>
    </ul>
    ${S.failed ? '<p class="error">Some answers may not have saved. Please tell the researcher.</p>' : ""}
    <p class="fine">Thanks for taking part. You can close this page.</p>`);
}

landing();
