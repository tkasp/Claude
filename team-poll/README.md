# Team Poll

A small Cloudflare Worker for a team poll: one vote per email (re-voting replaces the old answers), a public
results dashboard, and a private admin analysis page. Data lives in Cloudflare D1.

## Pages

| URL | Who | What |
| --- | --- | --- |
| `/` | Team | Enter email, then vote |
| `/results` | Team, after voting | Anonymous totals: X of N voted, date ✓/✗ counts, activity rankings, guest count |
| `/admin?key=ADMIN_KEY` | You | Top 3 dates, top 3 events, total guests, who hasn't voted, every response |
| `/admin.csv?key=ADMIN_KEY` | You | All responses as CSV |
| `/admin.json?key=ADMIN_KEY` | You | Same analysis as JSON |

## Set up

1. Edit `src/config.js`: title, finalize note, dates, and events.
2. The team email list is the `ROSTER` secret, never committed (this repo is public): emails separated by commas or newlines.
3. Deploy:

```sh
cd team-poll
npm install
npx wrangler login
npx wrangler d1 create team-poll        # copy the database_id into wrangler.toml
npm run db:init                         # create the table
npx wrangler secret put ADMIN_KEY       # pick a long random string; also signs the "has voted" cookie
npx wrangler secret put ROSTER          # paste the team emails
npm run deploy                          # prints https://team-poll.<you>.workers.dev
```

To change the config after launch, edit `src/config.js` and run `npm run deploy` again. Votes are kept.
Don't change a date or event `id` once people have voted, or their picks for it will drop out.

## Run locally

```sh
cp .dev.vars.example .dev.vars
npm run db:init:local
npm run dev                             # http://localhost:8787
```

## Scoring

- Only people who answer "attending: yes" answer the other questions.
- Dates: each is ✓ works, ✗ definitely doesn't, or blank (unsure). Ranked by most ✓, then fewest ✗.
  Headcount adds the +1s of people who marked ✓. "None of these dates work" counts as ✗ on every date.
- Activities: ranked, 1st = 3 points, 2nd = 2, 3rd = 1. Ties break on first-choice votes.
  Write-in "Other" ideas are grouped by matching text (ignoring case).
- Results are visible only after voting (a signed cookie set on submit). A voter's previous answers are
  pre-filled only on the device they voted from.
- Total guests = attendees + attendees bringing a significant other.
