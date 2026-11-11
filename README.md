# AI Email Assistant Study

Static front end (`index.html`, `styles.css`, `data.js`, `app.js`) + Google Apps Script backend (`Code.gs`).

## Files
- `data.js`: all editable content. `SCALE`, `VERSIONS` (counterbalancing), `emailsSetA/B`, practice and attention emails. AI-wrong emails carry `isAIWrong: true` (positions 2, 6, 9 in both sets).
- `app.js`: flow, condition logic, logging. `ENDPOINT` at the top.
- `Code.gs`: backend.

## 1. Sheet setup
1. Create a Google Sheet.
2. Tabs `Emails` and `Agency` are auto-created with headers on first write. To create them by hand, use these header rows:
   - **Emails**: `participant_id, version, round, condition, email_set, email_id, ai_verdict, ai_wrong, participant_rating, default_shown, changed_default, start_ts, submit_ts, duration_ms, status`
   - **Agency**: `participant_id, round, agency_item1, agency_item2, agency_sum, attention_check_passed`

## 2. Deploy Apps Script
1. In the Sheet: Extensions > Apps Script. Replace contents with `Code.gs`.
2. Save. Deploy > New deployment > type **Web app**.
3. Execute as: **Me**. Who has access: **Anyone**.
4. Deploy, authorise when asked, copy the **Web app URL** (ends in `/exec`).
5. Editing `Code.gs` later requires Deploy > Manage deployments > edit > New version.

## 3. Connect front end
Paste the URL into `ENDPOINT` at the top of `app.js`. Host the folder anywhere static (GitHub Pages, Netlify), then make a QR code of the page URL.

## 4. Test before piloting
- Open `index.html?test=1`. Full flow runs, nothing is written, payloads are in the browser console. Force a version with `&v=1..4`.
- Then do one live run (no `test=1`) and check both tabs. Before real data collection, delete test rows and run `resetCounter` in the Apps Script editor so version assignment starts at 1.
- Note: the same device cannot start a second real run once one completes (localStorage `aies_completed_v1`). Clear site data to reset while piloting.

## Design notes
- Suggest (L4): nothing pre-selected, Submit disabled until a rating is tapped (2 taps to accept).
- Pre-select (L5): AI verdict radio pre-checked, Submit enabled (1 tap to accept).
- `default_shown` = verdict label in Pre-select, empty in Suggest. `changed_default` is true only if Pre-select rating differs from the default.
- Version assignment is a server-side counter guarded by `LockService`.
- Failed POSTs retry once; then a red banner tells the participant to alert the researcher.
- Practice rows: `round=0, email_set=practice, status=practice`. Attention rows: `email_id=ATTN_R1/ATTN_R2, status=attention_check`, `ai_verdict` empty; pass = rated "Phishing".
