// Edit this file to set up the poll, then redeploy.

export const TITLE = "Team Event Poll";

// Voting closes at this time (ISO 8601 with your time zone offset). Set to null to never close.
export const CLOSES_AT = "2026-10-23T17:00:00-05:00";

// Each date needs a short unique id and the label people see.
export const DATES = [
  { id: "d1", label: "Fri, Nov 13" },
  { id: "d2", label: "Sat, Nov 14" },
  { id: "d3", label: "Fri, Nov 20" },
  { id: "d4", label: "Sat, Nov 21" },
  { id: "d5", label: "Fri, Dec 4" },
];

// 6-10 events. People rank their top 3: 1st = 3 pts, 2nd = 2, 3rd = 1.
export const EVENTS = [
  { id: "e1", label: "Bowling" },
  { id: "e2", label: "Escape room" },
  { id: "e3", label: "Group dinner" },
  { id: "e4", label: "Axe throwing" },
  { id: "e5", label: "Top golf" },
  { id: "e6", label: "Cooking class" },
  { id: "e7", label: "Comedy show" },
  { id: "e8", label: "Brewery tour" },
];

// Only these emails can vote. The count drives "X of N have voted". Lowercase is fine; matching ignores case.
export const ROSTER = [
  "alice@example.com",
  "bob@example.com",
  "carol@example.com",
];
