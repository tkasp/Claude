# Team Poll

A small Cloudflare Worker for a team poll: one vote per email (re-voting replaces the old answers), a public
results dashboard, and a private admin analysis page. Data lives in Cloudflare D1.

## Pages

| URL | Who | What |
| --- | --- | --- |
| `/` | Team | Enter email, then vote |
| `/results` | Team | Anonymous totals: X of N voted, date and event rankings, guest count |
| `/admin?key=ADMIN_KEY` | You | Top 3 dates, top 3 events, total guests, who hasn't voted, every response |
| `/admin.csv?key=ADMIN_KEY` | You | All responses as CSV |

## Set up

1. Edit `src/config.js`: title, deadline, dates, events, and the roster of team emails.
2. Deploy:

```sh
cd team-poll
npm install
npx wrangler login
npx wrangler d1 create team-poll        # copy the database_id into wrangler.toml
npm run db:init                         # create the table
npx wrangler secret put ADMIN_KEY       # pick a long random string
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
- Dates: count of attendees who checked the date. Headcount adds their +1s.
- Events: ranked, 1st = 3 points, 2nd = 2, 3rd = 1. Ties break on first-choice votes.
- Total guests = attendees + attendees bringing a significant other.
