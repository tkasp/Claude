import { TITLE, CLOSES_AT, DATES, EVENTS, ROSTER } from "./config.js";

const RANK_POINTS = [3, 2, 1];
const roster = new Set(ROSTER.map((e) => e.trim().toLowerCase()));

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    try {
      if (request.method === "GET" && pathname === "/") return html(votePage());
      if (request.method === "GET" && pathname === "/results") return html(resultsPage());
      if (request.method === "GET" && pathname === "/api/config") return json(publicConfig());
      if (request.method === "GET" && pathname === "/api/me") return getMyVote(env, url);
      if (request.method === "POST" && pathname === "/api/vote") return submitVote(env, request);
      if (request.method === "GET" && pathname === "/api/results") return json(publicResults(await loadVotes(env)));
      if (pathname === "/admin" || pathname === "/admin.csv") {
        if (!env.ADMIN_KEY || url.searchParams.get("key") !== env.ADMIN_KEY) {
          return new Response("Not found", { status: 404 });
        }
        const votes = await loadVotes(env);
        return pathname === "/admin" ? html(adminPage(votes)) : csv(votes);
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

function isClosed() {
  return CLOSES_AT !== null && Date.now() > Date.parse(CLOSES_AT);
}

function publicConfig() {
  return { title: TITLE, closesAt: CLOSES_AT, closed: isClosed(), dates: DATES, events: EVENTS };
}

async function loadVotes(env) {
  const { results } = await env.DB.prepare("SELECT * FROM votes").all();
  // Ignore anyone removed from the roster after voting.
  return results
    .filter((r) => roster.has(r.email))
    .map((r) => ({
      email: r.email,
      attending: r.attending === 1,
      plusOne: r.plus_one === 1,
      dates: JSON.parse(r.dates),
      events: JSON.parse(r.events),
      updatedAt: r.updated_at,
    }));
}

async function getMyVote(env, url) {
  const email = normalizeEmail(url.searchParams.get("email"));
  if (!roster.has(email)) return json({ onRoster: false });
  const row = await env.DB.prepare("SELECT * FROM votes WHERE email = ?").bind(email).first();
  const vote = row && {
    attending: row.attending === 1,
    plusOne: row.plus_one === 1,
    dates: JSON.parse(row.dates),
    events: JSON.parse(row.events),
  };
  return json({ onRoster: true, vote: vote || null });
}

async function submitVote(env, request) {
  if (isClosed()) return json({ error: "Voting is closed." }, 403);
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid request." }, 400);

  const email = normalizeEmail(body.email);
  if (!roster.has(email)) return json({ error: "That email isn't on the team list." }, 403);
  if (typeof body.attending !== "boolean") return json({ error: "Please say whether you're attending." }, 400);

  let plusOne = false;
  let dates = [];
  let events = [];
  if (body.attending) {
    if (typeof body.plusOne !== "boolean") return json({ error: "Please say whether you're bringing a +1." }, 400);
    plusOne = body.plusOne;

    const dateIds = new Set(DATES.map((d) => d.id));
    dates = [...new Set(Array.isArray(body.dates) ? body.dates : [])].filter((id) => dateIds.has(id));
    if (dates.length === 0) return json({ error: "Pick at least one date that works." }, 400);

    const eventIds = new Set(EVENTS.map((e) => e.id));
    events = (Array.isArray(body.events) ? body.events : []).filter(Boolean);
    if (events.length === 0) return json({ error: "Pick at least your 1st choice event." }, 400);
    if (events.length > 3 || events.some((id) => !eventIds.has(id)) || new Set(events).size !== events.length) {
      return json({ error: "Event choices must be up to 3 different options." }, 400);
    }
  }

  await env.DB.prepare(
    `INSERT INTO votes (email, attending, plus_one, dates, events, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)
     ON CONFLICT(email) DO UPDATE SET
       attending = ?2, plus_one = ?3, dates = ?4, events = ?5, updated_at = ?6`
  )
    .bind(email, body.attending ? 1 : 0, plusOne ? 1 : 0, JSON.stringify(dates), JSON.stringify(events), new Date().toISOString())
    .run();

  return json({ ok: true });
}

// ---------- tallies ----------

function tally(votes) {
  const going = votes.filter((v) => v.attending);
  const plusOnes = going.filter((v) => v.plusOne).length;

  const dates = DATES.map((d) => {
    const yes = going.filter((v) => v.dates.includes(d.id));
    return {
      ...d,
      votes: yes.length,
      headcount: yes.length + yes.filter((v) => v.plusOne).length,
      worksForAll: going.length > 0 && yes.length === going.length,
    };
  }).sort((a, b) => b.votes - a.votes || b.headcount - a.headcount);

  const events = EVENTS.map((e) => {
    const ranks = [0, 0, 0];
    for (const v of going) {
      const i = v.events.indexOf(e.id);
      if (i >= 0) ranks[i]++;
    }
    const points = ranks.reduce((sum, n, i) => sum + n * RANK_POINTS[i], 0);
    return { ...e, points, firsts: ranks[0], picks: ranks[0] + ranks[1] + ranks[2] };
  }).sort((a, b) => b.points - a.points || b.firsts - a.firsts || b.picks - a.picks);

  return {
    rosterSize: roster.size,
    responded: votes.length,
    attending: going.length,
    notAttending: votes.length - going.length,
    plusOnes,
    guests: going.length + plusOnes,
    dates,
    events,
  };
}

function publicResults(votes) {
  return { ...tally(votes), closed: isClosed(), closesAt: CLOSES_AT };
}

// ---------- responses ----------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function html(body) {
  return new Response(body, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function csv(votes) {
  const label = (list, id) => list.find((x) => x.id === id)?.label ?? id;
  const cell = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [["email", "attending", "plus_one", "dates", "event_1st", "event_2nd", "event_3rd", "updated_at"]];
  for (const v of votes) {
    rows.push([
      v.email,
      v.attending ? "yes" : "no",
      v.plusOne ? "yes" : "no",
      v.dates.map((id) => label(DATES, id)).join("; "),
      ...[0, 1, 2].map((i) => (v.events[i] ? label(EVENTS, v.events[i]) : "")),
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
:root { --bg:#f6f7f9; --card:#fff; --text:#1c1f24; --muted:#606875; --line:#dde1e6; --accent:#2f6fde; --accent-soft:#e3ecfb; --bad:#c23b3b; --good:#1f8a4c; }
@media (prefers-color-scheme: dark) { :root { --bg:#14161a; --card:#1d2026; --text:#e8eaed; --muted:#9aa2ad; --line:#2f343c; --accent:#6c9cf0; --accent-soft:#25324a; --bad:#ef7676; --good:#5cc88a; } }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--text); font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif; }
main { max-width:640px; margin:0 auto; padding:24px 16px 64px; }
h1 { font-size:1.6rem; margin:0 0 4px; }
h2 { font-size:1.05rem; margin:0 0 12px; }
.sub { color:var(--muted); margin:0 0 20px; }
.card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:20px; margin-bottom:16px; }
label.opt { display:flex; gap:10px; align-items:center; padding:10px 12px; border:1px solid var(--line); border-radius:8px; margin-bottom:8px; cursor:pointer; }
label.opt:has(input:checked) { border-color:var(--accent); background:var(--accent-soft); }
.row { display:flex; gap:8px; flex-wrap:wrap; }
.row label.opt { flex:1; min-width:120px; }
input[type=email], select { width:100%; font:inherit; padding:10px 12px; border:1px solid var(--line); border-radius:8px; background:var(--card); color:var(--text); }
select { margin-bottom:8px; }
.rank { display:grid; grid-template-columns:44px 1fr; align-items:center; gap:8px; }
.rank span { color:var(--muted); font-weight:600; margin-bottom:8px; }
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
.bar .top small { color:var(--muted); white-space:nowrap; }
.track { height:10px; background:var(--accent-soft); border-radius:5px; overflow:hidden; margin-top:4px; }
.fill { height:100%; background:var(--accent); border-radius:5px; }
table { width:100%; border-collapse:collapse; font-size:.9rem; }
th, td { text-align:left; padding:6px 8px; border-bottom:1px solid var(--line); vertical-align:top; }
.tablewrap { overflow-x:auto; }
ol.top3 { margin:0; padding-left:20px; }
ol.top3 li { margin-bottom:6px; }
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
<p class="sub" id="deadline"></p>

<div class="card" id="step-email">
  <h2>Your email</h2>
  <form id="email-form">
    <input type="email" id="email" required placeholder="you@company.com" autocomplete="email">
    <p class="err hidden" id="email-err"></p>
    <p></p><button type="submit">Continue</button>
  </form>
</div>

<form id="vote-form" class="hidden">
  <p class="muted" id="returning"></p>
  <div class="card">
    <h2>Will you be attending?</h2>
    <div class="row">
      <label class="opt"><input type="radio" name="attending" value="yes" required> Yes</label>
      <label class="opt"><input type="radio" name="attending" value="no"> No</label>
    </div>
  </div>
  <div id="attendee-qs" class="hidden">
    <div class="card">
      <h2>Will you be bringing a significant other?</h2>
      <div class="row">
        <label class="opt"><input type="radio" name="plusOne" value="yes"> Yes</label>
        <label class="opt"><input type="radio" name="plusOne" value="no"> No</label>
      </div>
    </div>
    <div class="card">
      <h2>Which dates work for you? <span class="muted">Check all that work</span></h2>
      <div id="dates"></div>
    </div>
    <div class="card">
      <h2>Rank your top 3 events</h2>
      <div id="events"></div>
    </div>
  </div>
  <button type="submit" id="submit">Submit</button>
  <p class="err hidden" id="vote-err"></p>
</form>

<p class="sub" style="margin-top:20px"><a href="/results">See results</a></p>

<script>
const $ = (id) => document.getElementById(id);
let cfg, email;

const showErr = (el, msg) => { el.textContent = msg; el.classList.remove("hidden"); };

async function init() {
  cfg = await (await fetch("/api/config")).json();
  if (cfg.closesAt) {
    const when = new Date(cfg.closesAt).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    $("deadline").textContent = cfg.closed ? "Voting is closed." : "Voting closes " + when + ".";
  }
  if (cfg.closed) { $("step-email").classList.add("hidden"); return; }

  $("dates").innerHTML = cfg.dates.map((d) =>
    '<label class="opt"><input type="checkbox" name="dates" value="' + d.id + '"> ' + esc(d.label) + '</label>').join("");
  const opts = '<option value="">-- choose --</option>' + cfg.events.map((e) => '<option value="' + e.id + '">' + esc(e.label) + '</option>').join("");
  $("events").innerHTML = ["1st", "2nd", "3rd"].map((r, i) =>
    '<div class="rank"><span>' + r + '</span><select name="event' + i + '">' + opts + '</select></div>').join("");
}

function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

function toggleAttendee() {
  const yes = document.querySelector("input[name=attending]:checked")?.value === "yes";
  $("attendee-qs").classList.toggle("hidden", !yes);
}

$("email-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("email-err").classList.add("hidden");
  email = $("email").value.trim().toLowerCase();
  const me = await (await fetch("/api/me?email=" + encodeURIComponent(email))).json();
  if (!me.onRoster) return showErr($("email-err"), "That email isn't on the team list. Check for typos, or ask the organizer.");

  const f = $("vote-form");
  if (me.vote) {
    $("returning").textContent = "You've already voted. Your answers are filled in below. Submitting again replaces them.";
    f.querySelector('input[name=attending][value=' + (me.vote.attending ? "yes" : "no") + ']').checked = true;
    if (me.vote.attending) {
      f.querySelector('input[name=plusOne][value=' + (me.vote.plusOne ? "yes" : "no") + ']').checked = true;
      for (const id of me.vote.dates) { const cb = f.querySelector('input[name=dates][value="' + id + '"]'); if (cb) cb.checked = true; }
      me.vote.events.forEach((id, i) => { f.elements["event" + i].value = id; });
    }
  }
  $("step-email").classList.add("hidden");
  f.classList.remove("hidden");
  toggleAttendee();
});

document.querySelectorAll("input[name=attending]").forEach((r) => r.addEventListener("change", toggleAttendee));

$("vote-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target, err = $("vote-err");
  err.classList.add("hidden");
  const attending = f.elements.attending.value === "yes";
  const body = { email, attending };
  if (attending) {
    if (!f.elements.plusOne.value) return showErr(err, "Please say whether you're bringing a significant other.");
    body.plusOne = f.elements.plusOne.value === "yes";
    body.dates = [...f.querySelectorAll("input[name=dates]:checked")].map((c) => c.value);
    if (body.dates.length === 0) return showErr(err, "Pick at least one date that works.");
    const picks = [0, 1, 2].map((i) => f.elements["event" + i].value);
    if (!picks[0]) return showErr(err, "Pick at least your 1st choice event.");
    if (!picks[1] && picks[2]) return showErr(err, "Fill in your 2nd choice before your 3rd.");
    body.events = picks.filter(Boolean);
    if (new Set(body.events).size !== body.events.length) return showErr(err, "Pick a different event for each rank.");
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

function resultsPage() {
  return shell(
    TITLE + " results",
    `<h1>Results</h1>
<p class="sub" id="sub">Loading...</p>
<div class="stats" id="stats"></div>
<div class="card"><h2>Dates <span class="muted">(people who can make it)</span></h2><div id="dates"></div></div>
<div class="card"><h2>Events <span class="muted">(points: 1st = 3, 2nd = 2, 3rd = 1)</span></h2><div id="events"></div></div>
<p class="sub"><a href="/">Change my vote</a></p>
<script>
function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
function bars(items, value, max, note) {
  if (!items.some((x) => value(x) > 0)) return '<p class="muted">No votes yet.</p>';
  return items.map((x) =>
    '<div class="bar"><div class="top"><span>' + esc(x.label) + '</span><small>' + note(x) + '</small></div>' +
    '<div class="track"><div class="fill" style="width:' + (max ? (100 * value(x)) / max : 0) + '%"></div></div></div>').join("");
}
async function load() {
  const r = await (await fetch("/api/results")).json();
  const thanks = new URLSearchParams(location.search).has("thanks") ? "Thanks, your vote is in. " : "";
  document.getElementById("sub").textContent = thanks + r.responded + " of " + r.rosterSize + " have voted" + (r.closed ? ". Voting is closed." : ".");
  document.getElementById("stats").innerHTML = [
    [r.responded + " / " + r.rosterSize, "voted"],
    [r.attending, "attending"],
    [r.plusOnes, "bringing a +1"],
    [r.guests, "total guests"],
  ].map(([n, l]) => '<div class="stat"><b>' + n + '</b><small>' + l + '</small></div>').join("");
  document.getElementById("dates").innerHTML = bars(r.dates, (d) => d.votes, r.attending,
    (d) => d.votes + " of " + r.attending + " (" + d.headcount + " incl. +1s)");
  const maxPts = Math.max(1, ...r.events.map((e) => e.points));
  document.getElementById("events").innerHTML = bars(r.events, (e) => e.points, maxPts,
    (e) => e.points + " pts, " + e.firsts + " first-choice");
}
load();
setInterval(load, 30000);
</script>`
  );
}

function adminPage(votes) {
  const t = tally(votes);
  const voted = new Set(votes.map((v) => v.email));
  const missing = [...roster].filter((e) => !voted.has(e)).sort();
  const label = (list, id) => esc(list.find((x) => x.id === id)?.label ?? id);
  const allGood = t.dates.filter((d) => d.worksForAll);

  const topDates = t.dates.slice(0, 3).filter((d) => d.votes > 0);
  const topEvents = t.events.slice(0, 3).filter((e) => e.points > 0);

  const people = [...votes].sort((a, b) => a.email.localeCompare(b.email)).map((v) =>
    `<tr><td>${esc(v.email)}</td><td>${v.attending ? "Yes" : "No"}</td><td>${v.attending ? (v.plusOne ? "Yes" : "No") : ""}</td>
     <td>${v.dates.map((id) => label(DATES, id)).join(", ")}</td>
     <td>${v.events.map((id, i) => `${i + 1}. ${label(EVENTS, id)}`).join("<br>")}</td></tr>`
  ).join("");

  return shell(
    TITLE + " admin",
    `<h1>Admin analysis</h1>
<p class="sub">${t.responded} of ${t.rosterSize} responded (${Math.round((100 * t.responded) / Math.max(1, t.rosterSize))}%).
 ${isClosed() ? "Voting is closed." : "Voting is open."} <a id="csv" href="/admin.csv">Download CSV</a></p>

<div class="stats">
  <div class="stat"><b>${t.guests}</b><small>total guests</small></div>
  <div class="stat"><b>${t.attending}</b><small>team attending</small></div>
  <div class="stat"><b>${t.plusOnes}</b><small>+1s</small></div>
  <div class="stat"><b>${t.notAttending}</b><small>not attending</small></div>
</div>

<div class="card"><h2>Top 3 dates</h2>
${topDates.length ? `<ol class="top3">${topDates.map((d) =>
  `<li><b>${esc(d.label)}</b>: ${d.votes} of ${t.attending} attendees, headcount ${d.headcount} with +1s</li>`).join("")}</ol>` : `<p class="muted">No votes yet.</p>`}
<p class="muted">${allGood.length ? `Works for every attendee: ${allGood.map((d) => esc(d.label)).join(", ")}.` : "No date works for every attendee yet."}</p>
</div>

<div class="card"><h2>Top 3 events</h2>
${topEvents.length ? `<ol class="top3">${topEvents.map((e) =>
  `<li><b>${esc(e.label)}</b>: ${e.points} pts, ${e.firsts} first-choice, on ${e.picks} ballots</li>`).join("")}</ol>` : `<p class="muted">No votes yet.</p>`}
</div>

<div class="card"><h2>All dates</h2><div class="tablewrap"><table>
<tr><th>Date</th><th>Can make it</th><th>Headcount</th></tr>
${t.dates.map((d) => `<tr><td>${esc(d.label)}</td><td>${d.votes}</td><td>${d.headcount}</td></tr>`).join("")}
</table></div></div>

<div class="card"><h2>All events</h2><div class="tablewrap"><table>
<tr><th>Event</th><th>Points</th><th>1st</th><th>Ballots</th></tr>
${t.events.map((e) => `<tr><td>${esc(e.label)}</td><td>${e.points}</td><td>${e.firsts}</td><td>${e.picks}</td></tr>`).join("")}
</table></div></div>

<div class="card"><h2>Haven't voted (${missing.length})</h2>
${missing.length ? `<p>${missing.map(esc).join("<br>")}</p>` : `<p class="muted">Everyone has voted.</p>`}
</div>

<div class="card"><h2>Responses</h2><div class="tablewrap"><table>
<tr><th>Email</th><th>Going</th><th>+1</th><th>Dates</th><th>Events</th></tr>${people}
</table></div></div>
<script>document.getElementById("csv").href = "/admin.csv" + location.search;</script>`
  );
}
