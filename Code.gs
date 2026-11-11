// Paste into script.google.com (bound to the target Google Sheet via Extensions > Apps Script,
// or standalone with SHEET_ID set below).
const SHEET_ID = ""; // leave "" if script is bound to the sheet

const COLS = {
  Emails: ["participant_id", "version", "round", "condition", "email_set", "email_id", "ai_verdict",
    "ai_wrong", "participant_rating", "default_shown", "changed_default", "start_ts", "submit_ts",
    "duration_ms", "status"],
  Agency: ["participant_id", "round", "agency_item1", "agency_item2", "agency_sum", "attention_check_passed"],
};
const TAB = { email: "Emails", agency: "Agency" };

function doGet() { return out({ ok: true, msg: "alive" }); } // health check only

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const p = JSON.parse(e.postData.contents);
    if (p.type === "next_version") return out({ ok: true, version: nextVersion() });
    const tab = TAB[p.type];
    if (!tab) return out({ ok: false, error: "unknown type" });
    const sh = getSheet(tab);
    sh.appendRow(COLS[tab].map((c) => (p[c] === undefined ? "" : p[c])));
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// Rotating counter 1,2,3,4,1,... guarded by the script lock held in doPost.
function nextVersion() {
  const props = PropertiesService.getScriptProperties();
  const n = parseInt(props.getProperty("counter") || "0", 10);
  props.setProperty("counter", String(n + 1));
  return (n % 4) + 1;
}

function getSheet(name) {
  const ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(COLS[name]); // header row
  return sh;
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Optional: run once manually to reset the counter before real data collection.
function resetCounter() { PropertiesService.getScriptProperties().setProperty("counter", "0"); }
