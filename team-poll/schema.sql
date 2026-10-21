CREATE TABLE IF NOT EXISTS votes (
  email      TEXT PRIMARY KEY,
  attending  INTEGER NOT NULL,
  plus_one   INTEGER NOT NULL DEFAULT 0,
  dates      TEXT NOT NULL DEFAULT '[]', -- JSON array of date ids
  events     TEXT NOT NULL DEFAULT '[]', -- JSON array of event ids, ranked 1st..3rd
  updated_at TEXT NOT NULL
);
