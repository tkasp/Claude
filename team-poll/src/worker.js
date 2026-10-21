import { TITLE, FINALIZE_NOTE, DATES, EVENTS } from "./config.js";

const RANK_POINTS = [3, 2, 1];
const OTHER = "other";
const COOKIE = "poll_voter";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const roster = parseRoster(env.ROSTER);
    try {
      if (request.method === "GET" && pathname === "/") return html(votePage());
      if (request.method === "GET" && pathname === "/api/config") return json(publicConfig());
      if (request.method === "GET" && pathname === "/api/me") return getMe(env, request, url, roster);
      if (request.method === "POST" && pathname === "/api/vote") return submitVote(env, request, roster);
      if (request.method === "GET" && (pathname === "/results" || pathname === "/api/results")) {
        const voter = await currentVoter(env, request);
        const voted = voter && roster.has(voter) && (await getVote(env, voter));
        if (pathname === "/results") return html(voted ? resultsPage() : mustVotePage());
        return voted ? json(publicResults(await loadVotes(env, roster), roster)) : json({ error: "Vote first to see results." }, 403);
      }
      if (pathname === "/admin" || pathname === "/admin.csv" || pathname === "/admin.json") {
        if (!env.ADMIN_KEY || url.searchParams.get("key") !== env.ADMIN_KEY) {
          return new Response("Not found", { status: 404 });
        }
        const votes = await loadVotes(env, roster);
        if (pathname === "/admin.csv") return csv(votes);
        if (pathname === "/admin.json") return json(adminData(votes, roster));
        return html(adminPage(votes, roster));
      }
      return new Response("Not found", { status: 404 });
    } catch (err) {
      return json({ error: "Server error: " + err.message }, 500);
    }
  },
};

// ---------- data ----------

function normalizeEmail(raw) {
  return String(raw || "").trim().toLowerCase();
}

function parseRoster(raw) {
  return new Set(String(raw || "").split(/[\s,;]+/).map(normalizeEmail).filter(Boolean));
}

function publicConfig() {
  return { title: TITLE, finalizeNote: FINALIZE_NOTE, dates: DATES, events: EVENTS };
}

function rowToVote(r) {
  return {
    email: r.email,
    attending: r.attending === 1,
    plusOne: r.plus_one === 1,
    datesYes: JSON.parse(r.dates_yes),
    datesNo: JSON.parse(r.dates_no),
    noDates: r.no_dates === 1,
    events: JSON.parse(r.events),
    otherText: r.other_text,
    updatedAt: r.updated_at,
  };
}

async function getVote(env, email) {
  const row = await env.DB.prepare("SELECT * FROM votes WHERE email = ?").bind(email).first();
  return row ? rowToVote(row) : null;
}

async function loadVotes(env, roster) {
  const { results } = await env.DB.prepare("SELECT * FROM votes").all();
  // Ignore anyone removed from the roster after voting.
  return results.filter((r) => roster.has(r.email)).map(rowToVote);
}

// The voter cookie holds their email plus an HMAC, so it can't be forged to see results without voting.
async function sign(env, email) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.ADMIN_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function currentVoter(env, request) {
  const match = (request.headers.get("cookie") || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match || !env.ADMIN_KEY) return null;
  const [email, mac] = decodeURIComponent(match[1]).split("|");
  return email && mac === (await sign(env, email)) ? email : null;
}

async function getMe(env, request, url, roster) {
  const email = normalizeEmail(url.searchParams.get("email"));
  if (!roster.has(email)) return json({ onRoster: false });
  const vote = await getVote(env, email);
  // Only hand back someone's answers on the device they voted from.
  const mine = vote && (await currentVoter(env, request)) === email;
  return json({ onRoster: true, hasVoted: !!vote, vote: mine ? vote : null });
}

async function submitVote(env, request, roster) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid request." }, 400);

  const email = normalizeEmail(body.email);
  if (!roster.has(email)) return json({ error: "That email isn't on the team list." }, 403);
  if (typeof body.attending !== "boolean") return json({ error: "Please say whether you'd attend." }, 400);

  let plusOne = false, datesYes = [], datesNo = [], noDates = false, events = [], otherText = "";
  if (body.attending) {
    if (typeof body.plusOne !== "boolean") return json({ error: "Please say whether you'd bring a significant other." }, 400);
    plusOne = body.plusOne;

    const dateIds = new Set(DATES.map((d) => d.id));
    noDates = body.noDates === true;
    if (!noDates) {
      datesYes = [...new Set(Array.isArray(body.datesYes) ? body.datesYes : [])].filter((id) => dateIds.has(id));
      datesNo = [...new Set(Array.isArray(body.datesNo) ? body.datesNo : [])].filter((id) => dateIds.has(id) && !datesYes.includes(id));
      if (datesYes.length === 0) return json({ error: "Mark at least one date that works, or tick \"None of these dates work\"." }, 400);
    }

    const eventIds = new Set([...EVENTS.map((e) => e.id), OTHER]);
    events = (Array.isArray(body.events) ? body.events : []).filter(Boolean);
    if (events.length === 0) return json({ error: "Pick at least your 1st choice event." }, 400);
    if (events.length > 3 || events.some((id) => !eventIds.has(id)) || new Set(events).size !== events.length) {
      return json({ error: "Event choices must be up to 3 different options." }, 400);
    }
    if (events.includes(OTHER)) {
      otherText = String(body.otherText || "").trim().slice(0, 120);
      if (!otherText) return json({ error: "Describe your \"Other\" idea." }, 400);
    }
  }

  await env.DB.prepare(
    `INSERT INTO votes (email, attending, plus_one, dates_yes, dates_no, no_dates, events, other_text, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
     ON CONFLICT(email) DO UPDATE SET attending = ?2, plus_one = ?3, dates_yes = ?4, dates_no = ?5,
       no_dates = ?6, events = ?7, other_text = ?8, updated_at = ?9`
  )
    .bind(email, body.attending ? 1 : 0, plusOne ? 1 : 0, JSON.stringify(datesYes), JSON.stringify(datesNo),
      noDates ? 1 : 0, JSON.stringify(events), otherText, new Date().toISOString())
    .run();

  const cookie = `${COOKIE}=${encodeURIComponent(email + "|" + (await sign(env, email)))}; Path=/; Max-Age=7776000; HttpOnly; Secure; SameSite=Lax`;
  return json({ ok: true }, 200, { "set-cookie": cookie });
}

// ---------- tallies ----------

function tally(votes, roster) {
  const going = votes.filter((v) => v.attending);
  const plusOnes = going.filter((v) => v.plusOne).length;

  const dates = DATES.map((d) => {
    const yes = going.filter((v) => !v.noDates && v.datesYes.includes(d.id));
    const no = going.filter((v) => v.noDates || v.datesNo.includes(d.id));
    return {
      ...d,
      works: yes.length,
      cant: no.length,
      unsure: going.length - yes.length - no.length,
      headcount: yes.length + yes.filter((v) => v.plusOne).length,
      cantEmails: no.map((v) => v.email),
    };
  }).sort((a, b) => b.works - a.works || a.cant - b.cant || b.headcount - a.headcount);

  // Built-in events, plus each distinct write-in as its own row.
  const options = new Map(EVENTS.map((e) => [e.id, { id: e.id, label: e.label, ranks: [0, 0, 0] }]));
  for (const v of going) {
    v.events.forEach((id, i) => {
      let key = id;
      if (id === OTHER) {
        key = "other:" + v.otherText.toLowerCase();
        if (!options.has(key)) options.set(key, { id: key, label: "Other: " + v.otherText, ranks: [0, 0, 0], other: true });
      }
      const opt = options.get(key);
      if (opt) opt.ranks[i]++;
    });
  }
  const events = [...options.values()].map(({ ranks, ...e }) => ({
    ...e,
    points: ranks.reduce((sum, n, i) => sum + n * RANK_POINTS[i], 0),
    firsts: ranks[0],
    picks: ranks[0] + ranks[1] + ranks[2],
  })).sort((a, b) => b.points - a.points || b.firsts - a.firsts || b.picks - a.picks);

  return {
    rosterSize: roster.size,
    responded: votes.length,
    attending: going.length,
    notAttending: votes.length - going.length,
    noDatesWork: going.filter((v) => v.noDates).length,
    plusOnes,
    guests: going.length + plusOnes,
    dates,
    events,
  };
}

function publicResults(votes, roster) {
  const t = tally(votes, roster);
  return { ...t, dates: t.dates.map(({ cantEmails, ...d }) => d), finalizeNote: FINALIZE_NOTE };
}

function adminData(votes, roster) {
  const voted = new Set(votes.map((v) => v.email));
  return {
    ...tally(votes, roster),
    notVoted: [...roster].filter((e) => !voted.has(e)).sort(),
    responses: votes,
  };
}

// ---------- responses ----------

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

function html(body) {
  return new Response(body, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function dateLabel(id) {
  return DATES.find((d) => d.id === id)?.label ?? id;
}

function eventLabel(v, id) {
  return id === OTHER ? "Other: " + v.otherText : EVENTS.find((e) => e.id === id)?.label ?? id;
}

function csv(votes) {
  const cell = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [["email", "attending", "plus_one", "dates_work", "dates_dont_work", "event_1st", "event_2nd", "event_3rd", "updated_at"]];
  for (const v of votes) {
    rows.push([
      v.email,
      v.attending ? "yes" : "no",
      v.attending ? (v.plusOne ? "yes" : "no") : "",
      v.datesYes.map(dateLabel).join("; "),
      v.noDates ? "NONE WORK" : v.datesNo.map(dateLabel).join("; "),
      ...[0, 1, 2].map((i) => (v.events[i] ? eventLabel(v, v.events[i]) : "")),
      v.updatedAt,
    ]);
  }
  return new Response(rows.map((r) => r.map(cell).join(",")).join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="team-poll.csv"',
    },
  });
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// ---------- pages ----------

const STYLE = `
:root { --bg:#f6f7f9; --card:#fff; --text:#1c1f24; --muted:#606875; --line:#dde1e6; --accent:#2f6fde; --accent-soft:#e3ecfb; --bad:#c23b3b; --bad-soft:#fbe6e6; --good:#1f8a4c; --good-soft:#e2f4ea; }
@media (prefers-color-scheme: dark) { :root { --bg:#14161a; --card:#1d2026; --text:#e8eaed; --muted:#9aa2ad; --line:#2f343c; --accent:#6c9cf0; --accent-soft:#25324a; --bad:#ef7676; --bad-soft:#3d2326; --good:#5cc88a; --good-soft:#1f3529; } }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--text); font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif; }
main { max-width:640px; margin:0 auto; padding:24px 16px 64px; }
h1 { font-size:1.6rem; margin:0 0 4px; }
h2 { font-size:1.05rem; margin:0 0 12px; }
.sub { color:var(--muted); margin:0 0 20px; }
.card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:20px; margin-bottom:16px; }
.note { background:var(--accent-soft); border-radius:8px; padding:10px 12px; margin:12px 0 0; font-weight:600; }
.intro ol { margin:0; padding-left:20px; }
.intro li { margin-bottom:6px; }
label.opt { display:flex; gap:10px; align-items:center; padding:10px 12px; border:1px solid var(--line); border-radius:8px; margin-bottom:8px; cursor:pointer; }
label.opt:has(input:checked) { border-color:var(--accent); background:var(--accent-soft); }
.row { display:flex; gap:8px; flex-wrap:wrap; }
.row label.opt { flex:1; min-width:120px; }
input[type=email], input[type=text], select { width:100%; font:inherit; padding:10px 12px; border:1px solid var(--line); border-radius:8px; background:var(--card); color:var(--text); }
select { margin-bottom:8px; }
.rank { display:grid; grid-template-columns:44px 1fr; align-items:center; gap:8px; }
.rank span { color:var(--muted); font-weight:600; margin-bottom:8px; }
.date { display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--line); }
.date:last-of-type { border-bottom:0; }
.date .name { flex:1; }
.date button { width:auto; padding:6px 12px; background:var(--card); color:var(--muted); border:1px solid var(--line); font-weight:600; }
.date button.yes[aria-pressed=true] { background:var(--good-soft); color:var(--good); border-color:var(--good); }
.date button.no[aria-pressed=true] { background:var(--bad-soft); color:var(--bad); border-color:var(--bad); }
#dates.disabled .date { opacity:.4; pointer-events:none; }
button { font:inherit; font-weight:600; padding:12px 20px; border:0; border-radius:8px; background:var(--accent); color:#fff; cursor:pointer; width:100%; }
button:disabled { opacity:.6; cursor:default; }
.err { color:var(--bad); margin:12px 0 0; }
.hidden { display:none; }
a { color:var(--accent); }
.stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:12px; margin-bottom:16px; }
.stat { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:14px 16px; }
.stat b { display:block; font-size:1.6rem; }
.stat small { color:var(--muted); }
.bar { margin-bottom:12px; }
.bar .top { display:flex; justify-content:space-between; gap:12px; }
.bar .top small { color:var(--muted); text-align:right; }
.track { display:flex; height:10px; background:var(--line); border-radius:5px; overflow:hidden; margin-top:4px; }
.fill { height:100%; background:var(--accent); }
.fill.good { background:var(--good); }
.fill.bad { background:var(--bad); margin-left:auto; }
.legend { color:var(--muted); font-size:.85rem; margin:-4px 0 12px; }
table { width:100%; border-collapse:collapse; font-size:.9rem; }
th, td { text-align:left; padding:6px 8px; border-bottom:1px solid var(--line); vertical-align:top; }
.tablewrap { overflow-x:auto; }
ol.top3 { margin:0; padding-left:20px; }
ol.top3 li { margin-bottom:8px; }
.muted { color:var(--muted); }
`;

function shell(title, body) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>${STYLE}</style></head>
<body><main>${body}</main></body></html>`;
}

function votePage() {
  return shell(
    TITLE,
    `<h1>${esc(TITLE)}</h1>
<p class="sub">Help us pick a date and an activity for our team event.</p>

<div class="card intro" id="intro">
  <h2>How it works</h2>
  <ol>
    <li>Enter your work email. It's one vote per person, and you can come back and change your answers any time.</li>
    <li>Tell us if you'd come, and whether you'd bring a significant other.</li>
    <li>Go through the dates: tap <b>✓</b> for dates that work and <b>✗</b> for dates that definitely don't. Leave a date blank if you're not sure.</li>
    <li>Rank your top 3 activities. Pick "Other" to suggest your own.</li>
    <li>Hit Submit to see the live results. Results only show totals, never who voted for what.</li>
  </ol>
  <p class="note">${esc(FINALIZE_NOTE)}</p>
</div>

<div class="card" id="step-email">
  <h2>Your work email</h2>
  <form id="email-form">
    <input type="email" id="email" required placeholder="first.last@taqa.ca" autocomplete="email">
    <p class="err hidden" id="email-err"></p>
    <p></p><button type="submit">Start</button>
  </form>
</div>

<form id="vote-form" class="hidden">
  <p class="note hidden" id="returning"></p><p></p>
  <div class="card">
    <h2>If it's on a date that works for you, will you attend?</h2>
    <div class="row">
      <label class="opt"><input type="radio" name="attending" value="yes"> Yes</label>
      <label class="opt"><input type="radio" name="attending" value="no"> No</label>
    </div>
  </div>
  <div id="attendee-qs" class="hidden">
    <div class="card">
      <h2>Would you bring a significant other?</h2>
      <div class="row">
        <label class="opt"><input type="radio" name="plusOne" value="yes"> Yes</label>
        <label class="opt"><input type="radio" name="plusOne" value="no"> No</label>
      </div>
    </div>
    <div class="card">
      <h2>Dates</h2>
      <p class="muted" style="margin-top:-8px">✓ = works, ✗ = definitely doesn't work, blank = not sure.</p>
      <div id="dates"></div>
      <p></p>
      <label class="opt"><input type="checkbox" id="no-dates"> None of these dates work for me</label>
    </div>
    <div class="card">
      <h2>Rank your top 3 activities</h2>
      <div id="events"></div>
      <input type="text" id="other-text" class="hidden" maxlength="120" placeholder="Your idea">
    </div>
  </div>
  <button type="submit" id="submit">Submit</button>
  <p class="err hidden" id="vote-err"></p>
</form>

<script>
const $ = (id) => document.getElementById(id);
const OTHER = "other";
let cfg, email;
const dateState = {}; // id -> "yes" | "no"

const showErr = (el, msg) => { el.textContent = msg; el.classList.remove("hidden"); };
function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

async function init() {
  cfg = await (await fetch("/api/config")).json();
  $("dates").innerHTML = cfg.dates.map((d) =>
    '<div class="date" data-id="' + d.id + '"><span class="name">' + esc(d.label) + '</span>' +
    '<button type="button" class="yes" aria-pressed="false" aria-label="' + esc(d.label) + ' works">✓</button>' +
    '<button type="button" class="no" aria-pressed="false" aria-label="' + esc(d.label) + ' does not work">✗</button></div>').join("");
  const opts = '<option value="">-- choose --</option>' +
    cfg.events.map((e) => '<option value="' + e.id + '">' + esc(e.label) + '</option>').join("") +
    '<option value="' + OTHER + '">Other (write your own)</option>';
  $("events").innerHTML = ["1st", "2nd", "3rd"].map((r, i) =>
    '<div class="rank"><span>' + r + '</span><select name="event' + i + '">' + opts + '</select></div>').join("");
  document.querySelectorAll("#events select").forEach((s) => s.addEventListener("change", toggleOther));
}

function setDate(id, val) {
  if (val) dateState[id] = val; else delete dateState[id];
  const row = document.querySelector('.date[data-id="' + id + '"]');
  row.querySelector(".yes").setAttribute("aria-pressed", val === "yes");
  row.querySelector(".no").setAttribute("aria-pressed", val === "no");
}

$("dates").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = btn.closest(".date").dataset.id;
  const val = btn.classList.contains("yes") ? "yes" : "no";
  setDate(id, dateState[id] === val ? null : val);
});

$("no-dates").addEventListener("change", () => $("dates").classList.toggle("disabled", $("no-dates").checked));

function toggleOther() {
  const any = [...document.querySelectorAll("#events select")].some((s) => s.value === OTHER);
  $("other-text").classList.toggle("hidden", !any);
}

function toggleAttendee() {
  const yes = document.querySelector("input[name=attending]:checked")?.value === "yes";
  $("attendee-qs").classList.toggle("hidden", !yes);
}
document.querySelectorAll("input[name=attending]").forEach((r) => r.addEventListener("change", toggleAttendee));

$("email-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("email-err").classList.add("hidden");
  email = $("email").value.trim().toLowerCase();
  const me = await (await fetch("/api/me?email=" + encodeURIComponent(email))).json();
  if (!me.onRoster) return showErr($("email-err"), "That email isn't on the team list. Check for typos, or ask the organizer.");

  const f = $("vote-form");
  if (me.hasVoted) {
    $("returning").classList.remove("hidden");
    $("returning").innerHTML = me.vote
      ? 'You\\'ve already voted. Your answers are filled in below. Change anything and submit again, or <a href="/results">see results</a>.'
      : "You've already voted. Submitting again replaces your previous answers.";
  }
  const v = me.vote;
  if (v) {
    f.querySelector('input[name=attending][value=' + (v.attending ? "yes" : "no") + ']').checked = true;
    if (v.attending) {
      f.querySelector('input[name=plusOne][value=' + (v.plusOne ? "yes" : "no") + ']').checked = true;
      v.datesYes.forEach((id) => document.querySelector('.date[data-id="' + id + '"]') && setDate(id, "yes"));
      v.datesNo.forEach((id) => document.querySelector('.date[data-id="' + id + '"]') && setDate(id, "no"));
      $("no-dates").checked = v.noDates;
      $("dates").classList.toggle("disabled", v.noDates);
      v.events.forEach((id, i) => { f.elements["event" + i].value = id; });
      $("other-text").value = v.otherText;
      toggleOther();
    }
  }
  $("intro").classList.add("hidden");
  $("step-email").classList.add("hidden");
  f.classList.remove("hidden");
  toggleAttendee();
});

$("vote-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target, err = $("vote-err");
  err.classList.add("hidden");
  if (!f.elements.attending.value) return showErr(err, "Please say whether you'd attend.");
  const attending = f.elements.attending.value === "yes";
  const body = { email, attending };
  if (attending) {
    if (!f.elements.plusOne.value) return showErr(err, "Please say whether you'd bring a significant other.");
    body.plusOne = f.elements.plusOne.value === "yes";
    body.noDates = $("no-dates").checked;
    body.datesYes = Object.keys(dateState).filter((id) => dateState[id] === "yes");
    body.datesNo = Object.keys(dateState).filter((id) => dateState[id] === "no");
    if (!body.noDates && body.datesYes.length === 0) return showErr(err, 'Mark at least one date with ✓, or tick "None of these dates work".');
    const picks = [0, 1, 2].map((i) => f.elements["event" + i].value);
    if (!picks[0]) return showErr(err, "Pick at least your 1st choice activity.");
    if (!picks[1] && picks[2]) return showErr(err, "Fill in your 2nd choice before your 3rd.");
    body.events = picks.filter(Boolean);
    if (new Set(body.events).size !== body.events.length) return showErr(err, "Pick a different activity for each rank.");
    if (body.events.includes(OTHER)) {
      body.otherText = $("other-text").value.trim();
      if (!body.otherText) return showErr(err, 'Describe your "Other" idea.');
    }
  }
  $("submit").disabled = true;
  const res = await fetch("/api/vote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (res.ok) { location.href = "/results?thanks=1"; return; }
  $("submit").disabled = false;
  showErr(err, (await res.json().catch(() => ({}))).error || "Something went wrong. Please try again.");
});

init();
</script>`
  );
}

function mustVotePage() {
  return shell(
    TITLE + " results",
    `<h1>Results</h1>
<div class="card"><p style="margin-top:0">Results are visible once you've voted from this device.</p>
<p style="margin-bottom:0"><a href="/">Go vote</a>. If you already voted on another device, enter your email and submit again.</p></div>`
  );
}

function resultsPage() {
  return shell(
    TITLE + " results",
    `<h1>Results</h1>
<p class="sub" id="sub">Loading...</p>
<div class="stats" id="stats"></div>
<div class="card"><h2>Dates</h2>
<p class="legend"><span style="color:var(--good)">■</span> works &nbsp; <span style="color:var(--bad)">■</span> definitely doesn't</p>
<div id="dates"></div></div>
<div class="card"><h2>Activities <span class="muted">(1st = 3 pts, 2nd = 2, 3rd = 1)</span></h2><div id="events"></div></div>
<p class="sub"><a href="/">Change my vote</a></p>
<script>
function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
function bar(label, note, fills) {
  return '<div class="bar"><div class="top"><span>' + esc(label) + '</span><small>' + note + '</small></div><div class="track">' +
    fills.map(([cls, pct]) => '<div class="fill ' + cls + '" style="width:' + pct + '%"></div>').join("") + '</div></div>';
}
async function load() {
  const res = await fetch("/api/results");
  if (!res.ok) { location.href = "/results"; return; }
  const r = await res.json();
  const thanks = new URLSearchParams(location.search).has("thanks") ? "Thanks, your vote is in. " : "";
  document.getElementById("sub").textContent = thanks + r.responded + " of " + r.rosterSize + " have voted. " + r.finalizeNote;
  document.getElementById("stats").innerHTML = [
    [r.responded + " / " + r.rosterSize, "voted"],
    [r.attending, "attending"],
    [r.plusOnes, "bringing a +1"],
    [r.guests, "total guests"],
  ].map(([n, l]) => '<div class="stat"><b>' + n + '</b><small>' + l + '</small></div>').join("");
  const n = Math.max(1, r.attending);
  document.getElementById("dates").innerHTML = r.attending === 0 ? '<p class="muted">No attendees yet.</p>' :
    r.dates.map((d) => bar(d.label, d.works + " ✓ · " + d.cant + " ✗", [["good", (100 * d.works) / n], ["bad", (100 * d.cant) / n]])).join("") +
    (r.noDatesWork ? '<p class="muted">' + r.noDatesWork + ' attendee(s) said none of these dates work.</p>' : "");
  const maxPts = Math.max(1, ...r.events.map((e) => e.points));
  document.getElementById("events").innerHTML = r.events.some((e) => e.points) ?
    r.events.map((e) => bar(e.label, e.points + " pts · " + e.firsts + " first-choice", [["", (100 * e.points) / maxPts]])).join("") :
    '<p class="muted">No votes yet.</p>';
}
load();
setInterval(load, 30000);
</script>`
  );
}

function adminPage(votes, roster) {
  const t = adminData(votes, roster);
  const topDates = t.dates.slice(0, 3).filter((d) => d.works > 0);
  const topEvents = t.events.slice(0, 3).filter((e) => e.points > 0);
  const clear = t.dates.filter((d) => d.cant === 0 && d.works > 0);

  const people = [...votes].sort((a, b) => a.email.localeCompare(b.email)).map((v) =>
    `<tr><td>${esc(v.email)}</td><td>${v.attending ? "Yes" : "No"}</td><td>${v.attending ? (v.plusOne ? "Yes" : "No") : ""}</td>
     <td>${esc(v.datesYes.map(dateLabel).join(", "))}</td>
     <td>${v.noDates ? "<b>None work</b>" : esc(v.datesNo.map(dateLabel).join(", "))}</td>
     <td>${v.events.map((id, i) => `${i + 1}. ${esc(eventLabel(v, id))}`).join("<br>")}</td></tr>`
  ).join("");

  return shell(
    TITLE + " admin",
    `<h1>Admin analysis</h1>
<p class="sub">${t.responded} of ${t.rosterSize} responded (${Math.round((100 * t.responded) / Math.max(1, t.rosterSize))}%).
 <a id="csv" href="/admin.csv">Download CSV</a></p>

<div class="stats">
  <div class="stat"><b>${t.guests}</b><small>total guests</small></div>
  <div class="stat"><b>${t.attending}</b><small>team attending</small></div>
  <div class="stat"><b>${t.plusOnes}</b><small>+1s</small></div>
  <div class="stat"><b>${t.notAttending}</b><small>not attending</small></div>
</div>

<div class="card"><h2>Top 3 dates</h2>
${topDates.length ? `<ol class="top3">${topDates.map((d) =>
  `<li><b>${esc(d.label)}</b>: ${d.works} ✓, ${d.cant} ✗, ${d.unsure} unsure. Headcount ${d.headcount} with +1s.
   ${d.cantEmails.length ? `<br><span class="muted">Can't make it: ${d.cantEmails.map(esc).join(", ")}</span>` : ""}</li>`).join("")}</ol>` : `<p class="muted">No votes yet.</p>`}
<p class="muted">${clear.length ? `Nobody ruled out: ${clear.map((d) => esc(d.label)).join(", ")}.` : "Every date has at least one ✗."}
 ${t.noDatesWork ? `${t.noDatesWork} attendee(s) said no dates work.` : ""}</p>
</div>

<div class="card"><h2>Top 3 activities</h2>
${topEvents.length ? `<ol class="top3">${topEvents.map((e) =>
  `<li><b>${esc(e.label)}</b>: ${e.points} pts, ${e.firsts} first-choice, on ${e.picks} ballots</li>`).join("")}</ol>` : `<p class="muted">No votes yet.</p>`}
</div>

<div class="card"><h2>All dates</h2><div class="tablewrap"><table>
<tr><th>Date</th><th>✓</th><th>✗</th><th>Unsure</th><th>Headcount</th><th>Can't make it</th></tr>
${t.dates.map((d) => `<tr><td>${esc(d.label)}</td><td>${d.works}</td><td>${d.cant}</td><td>${d.unsure}</td><td>${d.headcount}</td><td>${d.cantEmails.map(esc).join("<br>")}</td></tr>`).join("")}
</table></div></div>

<div class="card"><h2>All activities</h2><div class="tablewrap"><table>
<tr><th>Activity</th><th>Points</th><th>1st</th><th>Ballots</th></tr>
${t.events.map((e) => `<tr><td>${esc(e.label)}</td><td>${e.points}</td><td>${e.firsts}</td><td>${e.picks}</td></tr>`).join("")}
</table></div></div>

<div class="card"><h2>Haven't voted (${t.notVoted.length})</h2>
${t.notVoted.length ? `<p>${t.notVoted.map(esc).join("<br>")}</p>` : `<p class="muted">Everyone has voted.</p>`}
</div>

<div class="card"><h2>Responses</h2><div class="tablewrap"><table>
<tr><th>Email</th><th>Going</th><th>+1</th><th>✓ Dates</th><th>✗ Dates</th><th>Activities</th></tr>${people}
</table></div></div>
<script>document.getElementById("csv").href = "/admin.csv" + location.search;</script>`
  );
}
