CREATE TABLE IF NOT EXISTS votes (
  email      TEXT PRIMARY KEY,
  attending  INTEGER NOT NULL,
  plus_one   INTEGER NOT NULL DEFAULT 0,
  dates_yes  TEXT NOT NULL DEFAULT '[]', -- JSON array of date ids that work
  dates_no   TEXT NOT NULL DEFAULT '[]', -- JSON array of date ids that definitely don't
  no_dates   INTEGER NOT NULL DEFAULT 0, -- 1 = "none of these dates work"
  events     TEXT NOT NULL DEFAULT '[]', -- JSON array of event ids, ranked 1st..3rd ("other" allowed once)
  other_text TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
