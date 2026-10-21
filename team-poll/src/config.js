// Edit this file to set up the poll, then redeploy.
// The team email list is NOT here (this repo is public). It's the ROSTER secret: see README.

export const TITLE = "Team Event Poll";

// Shown on the intro and results pages. Voting stays open; this is just when we'll decide.
export const FINALIZE_NOTE = "We'll finalize on Friday, Oct 23 at 2:00 pm MT.";

// Each date needs a short unique id and the label people see.
// Don't change an id after people have voted, or their answers for it drop out.
export const DATES = [
  { id: "nov19", label: "Thu, Nov 19" },
  { id: "nov20", label: "Fri, Nov 20" },
  { id: "nov21", label: "Sat, Nov 21" },
  { id: "nov25", label: "Wed, Nov 25" },
  { id: "nov26", label: "Thu, Nov 26" },
  { id: "nov28", label: "Sat, Nov 28" },
  { id: "dec02", label: "Wed, Dec 2" },
  { id: "dec03", label: "Thu, Dec 3" },
  { id: "dec04", label: "Fri, Dec 4" },
  { id: "dec09", label: "Wed, Dec 9" },
  { id: "dec10", label: "Thu, Dec 10" },
  { id: "dec11", label: "Fri, Dec 11" },
];

// People rank their top 3: 1st = 3 pts, 2nd = 2, 3rd = 1. They can also write in one "Other" idea.
export const EVENTS = [
  { id: "axe-bowl", label: "Dinner, then axe throwing or bowling" },
  { id: "cooking", label: "Cooking class, then a bar after" },
  { id: "banquet", label: "Banquet dinner with bowling/games all-in-one" },
  { id: "mystery", label: "Murder mystery dinner" },
  { id: "theatre", label: "Dinner theatre" },
  { id: "escape", label: "Dinner & escape rooms" },
  { id: "lounge", label: "Dinner and lounge after" },
  { id: "dinner", label: "Just dinner - no activities" },
];
