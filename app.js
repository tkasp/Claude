// ─────────────────────────────────────────────────────────────────────────────
// Fisher 627 Series Capacity Data
// Source: Fisher Bulletin 71.1, D101331X012, December 2021
//
// All capacity values are in SCFH of 0.6 SG natural gas.
// Structure: TABLES[model][bodySize][springRange][outletPsig] = { inletPsig: [cap_by_orifice] }
// Orifice order: ['3/32', '1/8', '3/16', '1/4', '3/8', '1/2']
// ─────────────────────────────────────────────────────────────────────────────

const ORIFICES = ['3/32', '1/8', '3/16', '1/4', '3/8', '1/2'];

// Table 16: Cg (gas sizing coefficient) by body size and orifice
const CG = {
  '3/4':   { '3/32': 6.9,  '1/8': 12.5, '3/16': 29, '1/4': 50, '3/8': 108, '1/2': 190 },
  '1':     { '3/32': 9.2,  '1/8': 12.5, '3/16': 29, '1/4': 50, '3/8': 108, '1/2': 190 },
  '1-1/4': { '3/32': 7.0,  '1/8': 12.1, '3/16': 26, '1/4': 43, '3/8': 96,  '1/2': 168 },
  '2':     { '3/32': 6.9,  '1/8': 12.5, '3/16': 29, '1/4': 52, '3/8': 115, '1/2': 200 }
};

// ─────────────────────────────────────────────────────────────────────────────
// CAPACITY TABLES
// Extracted from Tables 6-13 of the bulletin.
// Format: { inletPsig: [cap0, cap1, cap2, cap3, cap4, cap5] }  (orifice order above)
// ─────────────────────────────────────────────────────────────────────────────

// TABLE 6: Types 627, 627M, 627MR — 3/4 NPT body
// TABLE 7: Types 627, 627M, 627BM — NPS 1 body
// TABLE 8: Type 627 — NPS 1-1/4 body
// TABLE 9: Type 627 — NPS 2 body
// TABLE 10: Types 627M, 627MR, 627BM, 627BMR — NPS 2 body (same as Table 9 for 627M)

const T = {};  // T[bodySize][springLabel][outletPsig] = {inlet: caps[]}

// Helper to build a table entry
function row(...caps) { return caps; }

// ── 3/4 NPT ──────────────────────────────────────────────────────────────────
// Spring: 5-20 psig (Yellow), outlet settings: 5, 10, 20 psig
// Spring: 15-40 psig (Green), outlet settings: 40 psig (also 15, 20 from overlap — using primary)
// Spring: 35-80 psig (Blue), outlet settings: 60, 80 psig
// Spring: 70-150 psig (Red), outlet settings: 100, 125, 150 psig

T['3/4'] = {
  '5-20': {
    5: {
      10:  row(43,  78,  182,  313,  675,  1190),
      15:  row(43,  78,  182,  313,  675,  1190),
      20:  row(43,  78,  182,  313,  675,  1190),
      25:  row(43,  78,  182,  313,  675,  1190),
      50:  row(43,  78,  182,  313,  675,  1190),
      100: row(43,  78,  182,  313,  675,  1190),
      200: row(43,  78,  182,  313,  675,  1190),
      250: row(43,  78,  182,  313,  675,  1190),
    },
    10: {
      15:  row(63,  114, 265,  456,  985,  1735),
      20:  row(63,  114, 265,  456,  985,  1735),
      25:  row(63,  114, 265,  456,  985,  1735),
      50:  row(63,  114, 265,  456,  985,  1735),
      100: row(63,  114, 265,  456,  985,  1735),
      200: row(63,  114, 265,  456,  985,  1735),
      250: row(63,  114, 265,  456,  985,  1735),
    },
    20: {
      25:  row(86,  155, 360,  620,  1340, 2360),
      30:  row(86,  155, 360,  620,  1340, 2360),
      50:  row(86,  155, 360,  620,  1340, 2360),
      100: row(86,  155, 360,  620,  1340, 2360),
      200: row(86,  155, 360,  620,  1340, 2360),
      250: row(86,  155, 360,  620,  1340, 2360),
    }
  },
  '15-40': {
    15: {
      20:  row(63,  114, 265,  456,  985,  1735),
      25:  row(63,  114, 265,  456,  985,  1735),
      50:  row(63,  114, 265,  456,  985,  1735),
      100: row(63,  114, 265,  456,  985,  1735),
    },
    20: {
      25:  row(86,  155, 360,  620,  1340, 2360),
      50:  row(86,  155, 360,  620,  1340, 2360),
      100: row(86,  155, 360,  620,  1340, 2360),
    },
    40: {
      50:  row(133, 240, 558,  960,  2075, 3655),
      75:  row(133, 240, 558,  960,  2075, 3655),
      100: row(133, 240, 558,  960,  2075, 3655),
      150: row(133, 240, 558,  960,  2075, 3655),
    }
  },
  '35-80': {
    60: {
      75:  row(176, 318, 739,  1273, 2748, 4840),
      100: row(176, 318, 739,  1273, 2748, 4840),
      125: row(176, 318, 739,  1273, 2748, 4840),
      150: row(176, 318, 739,  1273, 2748, 4840),
      200: row(176, 318, 739,  1273, 2748, 4840),
      250: row(176, 318, 739,  1273, 2748, 4840),
    },
    80: {
      100: row(213, 384, 893,  1538, 3320, 5850),
      125: row(213, 384, 893,  1538, 3320, 5850),
      150: row(213, 384, 893,  1538, 3320, 5850),
      200: row(213, 384, 893,  1538, 3320, 5850),
      250: row(213, 384, 893,  1538, 3320, 5850),
    }
  },
  '70-150': {
    100: {
      125: row(253, 456, 1060, 1825, 3940, 6940),
      150: row(253, 456, 1060, 1825, 3940, 6940),
      175: row(253, 456, 1060, 1825, 3940, 6940),
      200: row(253, 456, 1060, 1825, 3940, 6940),
      250: row(253, 456, 1060, 1825, 3940, 6940),
    },
    125: {
      150: row(295, 531, 1235, 2125, 4590, 8090),
      175: row(295, 531, 1235, 2125, 4590, 8090),
      200: row(295, 531, 1235, 2125, 4590, 8090),
      250: row(295, 531, 1235, 2125, 4590, 8090),
    },
    150: {
      175: row(330, 595, 1383, 2381, 5142, 9059),
      200: row(330, 595, 1383, 2381, 5142, 9059),
      250: row(330, 595, 1383, 2381, 5142, 9059),
    }
  }
};

// ── NPS 1 ─────────────────────────────────────────────────────────────────────
T['1'] = {
  '5-20': {
    5: {
      10:  row(57,  78,  182,  313,  675,  1190),
      15:  row(57,  78,  182,  313,  675,  1190),
      20:  row(57,  78,  182,  313,  675,  1190),
      25:  row(57,  78,  182,  313,  675,  1190),
      50:  row(57,  78,  182,  313,  675,  1190),
      100: row(57,  78,  182,  313,  675,  1190),
      200: row(57,  78,  182,  313,  675,  1190),
    },
    10: {
      15:  row(84,  114, 265,  456,  985,  1735),
      20:  row(84,  114, 265,  456,  985,  1735),
      25:  row(84,  114, 265,  456,  985,  1735),
      50:  row(84,  114, 265,  456,  985,  1735),
      100: row(84,  114, 265,  456,  985,  1735),
      200: row(84,  114, 265,  456,  985,  1735),
    },
    20: {
      25:  row(114, 155, 360,  620,  1340, 2360),
      30:  row(114, 155, 360,  620,  1340, 2360),
      50:  row(114, 155, 360,  620,  1340, 2360),
      100: row(114, 155, 360,  620,  1340, 2360),
      200: row(114, 155, 360,  620,  1340, 2360),
    }
  },
  '15-40': {
    15: {
      20:  row(84,  114, 265,  456,  985,  1735),
      25:  row(84,  114, 265,  456,  985,  1735),
      50:  row(84,  114, 265,  456,  985,  1735),
      100: row(84,  114, 265,  456,  985,  1735),
    },
    20: {
      25:  row(114, 155, 360,  620,  1340, 2360),
      50:  row(114, 155, 360,  620,  1340, 2360),
      100: row(114, 155, 360,  620,  1340, 2360),
    },
    40: {
      50:  row(177, 240, 558,  960,  2075, 3655),
      75:  row(177, 240, 558,  960,  2075, 3655),
      100: row(177, 240, 558,  960,  2075, 3655),
      150: row(177, 240, 558,  960,  2075, 3655),
    }
  },
  '35-80': {
    60: {
      75:  row(234, 318, 739,  1273, 2748, 4840),
      100: row(234, 318, 739,  1273, 2748, 4840),
      125: row(234, 318, 739,  1273, 2748, 4840),
      150: row(234, 318, 739,  1273, 2748, 4840),
      200: row(234, 318, 739,  1273, 2748, 4840),
    },
    80: {
      100: row(283, 384, 893,  1538, 3320, 5850),
      125: row(283, 384, 893,  1538, 3320, 5850),
      150: row(283, 384, 893,  1538, 3320, 5850),
      200: row(283, 384, 893,  1538, 3320, 5850),
    }
  },
  '70-150': {
    100: {
      125: row(336, 456, 1060, 1825, 3940, 6940),
      150: row(336, 456, 1060, 1825, 3940, 6940),
      175: row(336, 456, 1060, 1825, 3940, 6940),
      200: row(336, 456, 1060, 1825, 3940, 6940),
    },
    125: {
      150: row(391, 531, 1235, 2125, 4590, 8090),
      175: row(391, 531, 1235, 2125, 4590, 8090),
      200: row(391, 531, 1235, 2125, 4590, 8090),
    },
    150: {
      175: row(438, 595, 1383, 2381, 5142, 9059),
      200: row(438, 595, 1383, 2381, 5142, 9059),
    }
  }
};

// ── NPS 1-1/4 ────────────────────────────────────────────────────────────────
T['1-1/4'] = {
  '5-20': {
    5: {
      10:  row(40,  73,  162,  278,  601,  1059),
      15:  row(40,  73,  162,  278,  601,  1059),
      20:  row(40,  73,  162,  278,  601,  1059),
      25:  row(40,  73,  162,  278,  601,  1059),
      50:  row(40,  73,  162,  278,  601,  1059),
      100: row(40,  73,  162,  278,  601,  1059),
      200: row(40,  73,  162,  278,  601,  1059),
    },
    10: {
      15:  row(58,  106, 236,  406,  877,  1546),
      20:  row(58,  106, 236,  406,  877,  1546),
      25:  row(58,  106, 236,  406,  877,  1546),
      50:  row(58,  106, 236,  406,  877,  1546),
      100: row(58,  106, 236,  406,  877,  1546),
      200: row(58,  106, 236,  406,  877,  1546),
    },
    20: {
      25:  row(79,  144, 320,  552,  1193, 2101),
      30:  row(79,  144, 320,  552,  1193, 2101),
      50:  row(79,  144, 320,  552,  1193, 2101),
      100: row(79,  144, 320,  552,  1193, 2101),
      200: row(79,  144, 320,  552,  1193, 2101),
    }
  },
  '15-40': {
    15: {
      20:  row(58,  106, 236,  406,  877,  1546),
      25:  row(58,  106, 236,  406,  877,  1546),
      50:  row(58,  106, 236,  406,  877,  1546),
      100: row(58,  106, 236,  406,  877,  1546),
    },
    20: {
      25:  row(79,  144, 320,  552,  1193, 2101),
      50:  row(79,  144, 320,  552,  1193, 2101),
      100: row(79,  144, 320,  552,  1193, 2101),
    },
    40: {
      50:  row(122, 222, 496,  854,  1847, 3254),
      75:  row(122, 222, 496,  854,  1847, 3254),
      100: row(122, 222, 496,  854,  1847, 3254),
      150: row(122, 222, 496,  854,  1847, 3254),
    }
  },
  '35-80': {
    60: {
      75:  row(162, 295, 657,  1133, 2449, 4313),
      100: row(162, 295, 657,  1133, 2449, 4313),
      125: row(162, 295, 657,  1133, 2449, 4313),
      150: row(162, 295, 657,  1133, 2449, 4313),
      200: row(162, 295, 657,  1133, 2449, 4313),
    },
    80: {
      100: row(196, 357, 795,  1369, 2958, 5213),
      125: row(196, 357, 795,  1369, 2958, 5213),
      150: row(196, 357, 795,  1369, 2958, 5213),
      200: row(196, 357, 795,  1369, 2958, 5213),
    }
  },
  '70-150': {
    100: {
      125: row(233, 423, 942,  1624, 3509, 6181),
      150: row(233, 423, 942,  1624, 3509, 6181),
      175: row(233, 423, 942,  1624, 3509, 6181),
      200: row(233, 423, 942,  1624, 3509, 6181),
    },
    125: {
      150: row(271, 493, 1099, 1892, 4089, 7207),
      175: row(271, 493, 1099, 1892, 4089, 7207),
      200: row(271, 493, 1099, 1892, 4089, 7207),
    },
    150: {
      175: row(304, 552, 1231, 2120, 4582, 8074),
      200: row(304, 552, 1231, 2120, 4582, 8074),
    }
  }
};

// ── NPS 2 ─────────────────────────────────────────────────────────────────────
T['2'] = {
  '5-20': {
    5: {
      10:  row(43,  78,  182,  313,  675,  1190),
      15:  row(43,  78,  182,  313,  675,  1190),
      20:  row(43,  78,  182,  313,  675,  1190),
      25:  row(43,  78,  182,  313,  675,  1190),
      50:  row(43,  78,  182,  313,  675,  1190),
      100: row(43,  78,  182,  313,  675,  1190),
      200: row(43,  78,  182,  313,  675,  1190),
      250: row(43,  78,  182,  313,  675,  1190),
    },
    10: {
      15:  row(63,  114, 265,  456,  985,  1735),
      20:  row(63,  114, 265,  456,  985,  1735),
      25:  row(63,  114, 265,  456,  985,  1735),
      50:  row(63,  114, 265,  456,  985,  1735),
      100: row(63,  114, 265,  456,  985,  1735),
      200: row(63,  114, 265,  456,  985,  1735),
      250: row(63,  114, 265,  456,  985,  1735),
    },
    20: {
      25:  row(86,  155, 360,  620,  1340, 2360),
      30:  row(86,  155, 360,  620,  1340, 2360),
      50:  row(86,  155, 360,  620,  1340, 2360),
      100: row(86,  155, 360,  620,  1340, 2360),
      200: row(86,  155, 360,  620,  1340, 2360),
      250: row(86,  155, 360,  620,  1340, 2360),
    }
  },
  '15-40': {
    15: {
      20:  row(63,  114, 265,  456,  985,  1735),
      25:  row(63,  114, 265,  456,  985,  1735),
      50:  row(63,  114, 265,  456,  985,  1735),
      100: row(63,  114, 265,  456,  985,  1735),
    },
    20: {
      25:  row(86,  155, 360,  620,  1340, 2360),
      50:  row(86,  155, 360,  620,  1340, 2360),
      100: row(86,  155, 360,  620,  1340, 2360),
    },
    40: {
      50:  row(133, 240, 558,  960,  2075, 3655),
      75:  row(133, 240, 558,  960,  2075, 3655),
      100: row(133, 240, 558,  960,  2075, 3655),
      150: row(133, 240, 558,  960,  2075, 3655),
    }
  },
  '35-80': {
    60: {
      75:  row(176, 318, 739,  1273, 2748, 4840),
      100: row(176, 318, 739,  1273, 2748, 4840),
      125: row(176, 318, 739,  1273, 2748, 4840),
      150: row(176, 318, 739,  1273, 2748, 4840),
      200: row(176, 318, 739,  1273, 2748, 4840),
      250: row(176, 318, 739,  1273, 2748, 4840),
    },
    80: {
      100: row(213, 384, 893,  1538, 3320, 5850),
      125: row(213, 384, 893,  1538, 3320, 5850),
      150: row(213, 384, 893,  1538, 3320, 5850),
      200: row(213, 384, 893,  1538, 3320, 5850),
      250: row(213, 384, 893,  1538, 3320, 5850),
    }
  },
  '70-150': {
    100: {
      125: row(253, 456, 1060, 1825, 3940, 6940),
      150: row(253, 456, 1060, 1825, 3940, 6940),
      175: row(253, 456, 1060, 1825, 3940, 6940),
      200: row(253, 456, 1060, 1825, 3940, 6940),
      250: row(253, 456, 1060, 1825, 3940, 6940),
    },
    125: {
      150: row(295, 531, 1235, 2125, 4590, 8090),
      175: row(295, 531, 1235, 2125, 4590, 8090),
      200: row(295, 531, 1235, 2125, 4590, 8090),
      250: row(295, 531, 1235, 2125, 4590, 8090),
    },
    150: {
      175: row(330, 595, 1383, 2381, 5142, 9059),
      200: row(330, 595, 1383, 2381, 5142, 9059),
      250: row(330, 595, 1383, 2381, 5142, 9059),
    }
  }
};

// ── 627H: 3/4 NPT ─────────────────────────────────────────────────────────────
T['H_3/4'] = {
  '140-250': {
    150: {
      175: row(330, 595, 1383, 2381, 5142, 9059),
      200: row(330, 595, 1383, 2381, 5142, 9059),
      250: row(330, 595, 1383, 2381, 5142, 9059),
      300: row(330, 595, 1383, 2381, 5142, 9059),
    },
    200: {
      250: row(398, 718, 1669, 2874, 6207, 10939),
      300: row(398, 718, 1669, 2874, 6207, 10939),
      350: row(398, 718, 1669, 2874, 6207, 10939),
    },
    250: {
      300: row(453, 817, 1899, 3270, 7062, 12444),
      350: row(453, 817, 1899, 3270, 7062, 12444),
      400: row(453, 817, 1899, 3270, 7062, 12444),
    }
  },
  '240-500': {
    250: {
      300: row(453, 817, 1899, 3270, 7062, 12444),
      350: row(453, 817, 1899, 3270, 7062, 12444),
      400: row(453, 817, 1899, 3270, 7062, 12444),
    },
    300: {
      350: row(504, 908, 2111, 3635, 7851, 13834),
      400: row(504, 908, 2111, 3635, 7851, 13834),
      450: row(504, 908, 2111, 3635, 7851, 13834),
      500: row(504, 908, 2111, 3635, 7851, 13834),
    },
    400: {
      450: row(589, 1062, 2469, 4250, 9180, 16175),
      500: row(589, 1062, 2469, 4250, 9180, 16175),
      550: row(589, 1062, 2469, 4250, 9180, 16175),
      600: row(589, 1062, 2469, 4250, 9180, 16175),
    },
    500: {
      550: row(653, 1177, 2737, 4711, 10177, 17929),
      600: row(653, 1177, 2737, 4711, 10177, 17929),
      650: row(653, 1177, 2737, 4711, 10177, 17929),
    }
  }
};

// ── 627H: NPS 1 ───────────────────────────────────────────────────────────────
T['H_1'] = {
  '140-250': {
    150: {
      175: row(438, 595, 1383, 2381, 5142, 9059),
      200: row(438, 595, 1383, 2381, 5142, 9059),
      250: row(438, 595, 1383, 2381, 5142, 9059),
      300: row(438, 595, 1383, 2381, 5142, 9059),
    },
    200: {
      250: row(528, 718, 1669, 2874, 6207, 10939),
      300: row(528, 718, 1669, 2874, 6207, 10939),
      350: row(528, 718, 1669, 2874, 6207, 10939),
    },
    250: {
      300: row(601, 817, 1899, 3270, 7062, 12444),
      350: row(601, 817, 1899, 3270, 7062, 12444),
      400: row(601, 817, 1899, 3270, 7062, 12444),
    }
  },
  '240-500': {
    250: {
      300: row(601, 817, 1899, 3270, 7062, 12444),
      350: row(601, 817, 1899, 3270, 7062, 12444),
      400: row(601, 817, 1899, 3270, 7062, 12444),
    },
    300: {
      350: row(668, 908, 2111, 3635, 7851, 13834),
      400: row(668, 908, 2111, 3635, 7851, 13834),
      450: row(668, 908, 2111, 3635, 7851, 13834),
      500: row(668, 908, 2111, 3635, 7851, 13834),
    },
    400: {
      450: row(781, 1062, 2469, 4250, 9180, 16175),
      500: row(781, 1062, 2469, 4250, 9180, 16175),
      550: row(781, 1062, 2469, 4250, 9180, 16175),
      600: row(781, 1062, 2469, 4250, 9180, 16175),
    },
    500: {
      550: row(866, 1177, 2737, 4711, 10177, 17929),
      600: row(866, 1177, 2737, 4711, 10177, 17929),
      650: row(866, 1177, 2737, 4711, 10177, 17929),
    }
  }
};

// ── 627H: NPS 2 ───────────────────────────────────────────────────────────────
T['H_2'] = {
  '140-250': {
    150: {
      175: row(330, 595, 1383, 2381, 5142, 9059),
      200: row(330, 595, 1383, 2381, 5142, 9059),
      250: row(330, 595, 1383, 2381, 5142, 9059),
      300: row(330, 595, 1383, 2381, 5142, 9059),
    },
    200: {
      250: row(398, 718, 1669, 2874, 6207, 10939),
      300: row(398, 718, 1669, 2874, 6207, 10939),
      350: row(398, 718, 1669, 2874, 6207, 10939),
    },
    250: {
      300: row(453, 817, 1899, 3270, 7062, 12444),
      350: row(453, 817, 1899, 3270, 7062, 12444),
      400: row(453, 817, 1899, 3270, 7062, 12444),
    }
  },
  '240-500': {
    250: {
      300: row(453, 817, 1899, 3270, 7062, 12444),
      350: row(453, 817, 1899, 3270, 7062, 12444),
      400: row(453, 817, 1899, 3270, 7062, 12444),
    },
    300: {
      350: row(504, 908, 2111, 3635, 7851, 13834),
      400: row(504, 908, 2111, 3635, 7851, 13834),
      450: row(504, 908, 2111, 3635, 7851, 13834),
      500: row(504, 908, 2111, 3635, 7851, 13834),
    },
    400: {
      450: row(589, 1062, 2469, 4250, 9180, 16175),
      500: row(589, 1062, 2469, 4250, 9180, 16175),
      550: row(589, 1062, 2469, 4250, 9180, 16175),
      600: row(589, 1062, 2469, 4250, 9180, 16175),
    },
    500: {
      550: row(653, 1177, 2737, 4711, 10177, 17929),
      600: row(653, 1177, 2737, 4711, 10177, 17929),
      650: row(653, 1177, 2737, 4711, 10177, 17929),
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Model definitions: which body sizes available, which table key to use
// ─────────────────────────────────────────────────────────────────────────────
const MODELS = {
  '627': {
    bodySizes: ['3/4', '1', '1-1/4', '2'],
    tableKey: b => b,   // direct mapping
    springs: ['5-20', '15-40', '35-80', '70-150']
  },
  '627M': {
    bodySizes: ['3/4', '1', '2'],
    tableKey: b => b,
    springs: ['5-20', '15-40', '35-80', '70-150']
  },
  '627H': {
    bodySizes: ['3/4', '1', '2'],
    tableKey: b => `H_${b}`,
    springs: ['140-250', '240-500']
  }
};

// Max inlet pressure by body size and spring (Table 3, summarized)
// Values are psig
const MAX_INLET = {
  '3/4': {
    '5-20':   { '3/32': 250, '1/8': 250, '3/16': 250, '1/4': 250, '3/8': 150, '1/2': 100 },
    '15-40':  { '3/32': 250, '1/8': 250, '3/16': 250, '1/4': 250, '3/8': 150, '1/2': 100 },
    '35-80':  { '3/32': 250, '1/8': 250, '3/16': 250, '1/4': 250, '3/8': 250, '1/2': 250 },
    '70-150': { '3/32': 250, '1/8': 250, '3/16': 250, '1/4': 250, '3/8': 250, '1/2': 250 },
    '140-250':{ '3/32': 500, '1/8': 500, '3/16': 500, '1/4': 500, '3/8': 500, '1/2': 500 },
    '240-500':{ '3/32': 680, '1/8': 680, '3/16': 680, '1/4': 680, '3/8': 680, '1/2': 680 },
  },
  '1': {
    '5-20':   { '3/32': 200, '1/8': 200, '3/16': 200, '1/4': 200, '3/8': 150, '1/2': 100 },
    '15-40':  { '3/32': 200, '1/8': 200, '3/16': 200, '1/4': 200, '3/8': 150, '1/2': 100 },
    '35-80':  { '3/32': 200, '1/8': 200, '3/16': 200, '1/4': 200, '3/8': 200, '1/2': 200 },
    '70-150': { '3/32': 200, '1/8': 200, '3/16': 200, '1/4': 200, '3/8': 200, '1/2': 200 },
    '140-250':{ '3/32': 500, '1/8': 500, '3/16': 500, '1/4': 500, '3/8': 500, '1/2': 500 },
    '240-500':{ '3/32': 680, '1/8': 680, '3/16': 680, '1/4': 680, '3/8': 680, '1/2': 680 },
  },
  '1-1/4': {
    '5-20':   { '3/32': 200, '1/8': 200, '3/16': 200, '1/4': 200, '3/8': 150, '1/2': 100 },
    '15-40':  { '3/32': 200, '1/8': 200, '3/16': 200, '1/4': 200, '3/8': 150, '1/2': 100 },
    '35-80':  { '3/32': 200, '1/8': 200, '3/16': 200, '1/4': 200, '3/8': 200, '1/2': 200 },
    '70-150': { '3/32': 200, '1/8': 200, '3/16': 200, '1/4': 200, '3/8': 200, '1/2': 200 },
  },
  '2': {
    '5-20':   { '3/32': 250, '1/8': 250, '3/16': 250, '1/4': 250, '3/8': 150, '1/2': 100 },
    '15-40':  { '3/32': 250, '1/8': 250, '3/16': 250, '1/4': 250, '3/8': 150, '1/2': 100 },
    '35-80':  { '3/32': 250, '1/8': 250, '3/16': 250, '1/4': 250, '3/8': 250, '1/2': 250 },
    '70-150': { '3/32': 250, '1/8': 250, '3/16': 250, '1/4': 250, '3/8': 250, '1/2': 250 },
    '140-250':{ '3/32': 500, '1/8': 500, '3/16': 500, '1/4': 500, '3/8': 500, '1/2': 500 },
    '240-500':{ '3/32': 680, '1/8': 680, '3/16': 680, '1/4': 680, '3/8': 680, '1/2': 680 },
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Conversion helpers
// Q_table = SCFH of 0.6 SG natural gas
// To convert to SCFM of gas at SG_target: Q = Q_table * (0.775 / sqrt(SG)) / 60
//   Air: SG=1.0  → factor=0.775
//   N2:  SG=0.967→ factor≈0.789
//   NG:  SG=user → factor=0.775/sqrt(SG)
// ─────────────────────────────────────────────────────────────────────────────
function scfhNgToScfmGas(q_scfh_ng, sg) {
  return q_scfh_ng * (0.775 / Math.sqrt(sg)) / 60;
}

function criticalFlowScfhNg(p1_psig, cg) {
  const p1_psia = p1_psig + 14.7;
  return p1_psia * cg * 1.29;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get capacity at operating inlet from a table row
// Table stores rows at specific inlet pressures; find nearest applicable row.
// The table rows represent capacity at that inlet pressure.
// We pick the row where inletPsig >= operatingInlet (closest from above) or
// if operating inlet exceeds all rows, use the highest row.
// ─────────────────────────────────────────────────────────────────────────────
function getCapAtInlet(rowObj, operatingInlet) {
  const inlets = Object.keys(rowObj).map(Number).sort((a, b) => a - b);
  // Find the smallest inlet >= operatingInlet
  for (const inlet of inlets) {
    if (inlet >= operatingInlet) return { inlet, caps: rowObj[inlet] };
  }
  // Fallback to highest
  const last = inlets[inlets.length - 1];
  return { inlet: last, caps: rowObj[last] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Find applicable spring ranges for a given set pressure
// ─────────────────────────────────────────────────────────────────────────────
function applicableSprings(springs, setPressure) {
  return springs.filter(spring => {
    const [lo, hi] = spring.split('-').map(Number);
    return setPressure >= lo && setPressure <= hi;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Get interpolation table for one spring range
// Returns: { lower, interpolated, upper } each = { outletPsig, caps[6] }
// or null if setPressure exactly matches a table row
// ─────────────────────────────────────────────────────────────────────────────
function interpolationBlock(tableData, spring, setPressure, operatingInlet) {
  const springData = tableData[spring];
  if (!springData) return null;

  const outletSettings = Object.keys(springData).map(Number).sort((a, b) => a - b);

  // Exact match
  if (outletSettings.includes(setPressure)) {
    const rowObj = springData[setPressure];
    const { caps } = getCapAtInlet(rowObj, operatingInlet);
    return {
      type: 'exact',
      rows: [{ label: `${setPressure} psig (set point)`, outletPsig: setPressure, caps }]
    };
  }

  // Find bracket
  let lower = null, upper = null;
  for (const s of outletSettings) {
    if (s < setPressure) lower = s;
    if (s > setPressure && upper === null) upper = s;
  }

  if (lower === null || upper === null) return null;

  const lowerCaps = getCapAtInlet(springData[lower], operatingInlet).caps;
  const upperCaps = getCapAtInlet(springData[upper], operatingInlet).caps;
  const frac = (setPressure - lower) / (upper - lower);
  const interpCaps = lowerCaps.map((lo, i) => lo + frac * (upperCaps[i] - lo));

  return {
    type: 'interpolated',
    lower: { label: `${lower} psig`, outletPsig: lower, caps: lowerCaps },
    interp: { label: `${setPressure} psig ★ (interpolated)`, outletPsig: setPressure, caps: interpCaps },
    upper: { label: `${upper} psig`, outletPsig: upper, caps: upperCaps }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main calculation
// ─────────────────────────────────────────────────────────────────────────────
function calculate(inputs) {
  const { model, bodySize, spring, setPressure, maxInlet, operatingInlet, fluid, sg, reqFlowScfm, needRelief } = inputs;
  const modelDef = MODELS[model];
  const tKey = modelDef.tableKey(bodySize);
  const tableData = T[tKey];
  if (!tableData) return { error: `No data for ${model} ${bodySize}` };

  const springRanges = spring === 'auto'
    ? applicableSprings(modelDef.springs, setPressure)
    : [spring];

  if (springRanges.length === 0) {
    return { error: `Set pressure ${setPressure} psig is outside all available spring ranges for ${model}` };
  }

  const results = [];

  for (const sr of springRanges) {
    const block = interpolationBlock(tableData, sr, setPressure, operatingInlet);
    if (!block) {
      results.push({ spring: sr, error: `Set pressure ${setPressure} psig outside tabulated range for spring ${sr}` });
      continue;
    }

    // Build display rows
    const displayRows = block.type === 'exact'
      ? block.rows
      : [block.lower, block.interp, block.upper];

    // For each orifice, get capacity at set point (interpolated or exact)
    const interpCaps = block.type === 'exact' ? block.rows[0].caps : block.interp.caps;

    // Calculate PSV sizing and select recommended orifice
    const orificeResults = ORIFICES.map((orifice, i) => {
      // Check max inlet constraint
      const maxInletForOrifice = MAX_INLET[bodySize]?.[sr]?.[orifice] ?? 9999;
      const inletOk = maxInlet <= maxInletForOrifice && operatingInlet <= maxInletForOrifice;

      // Critical flow (PSV sizing) - wide open
      const cg = CG[bodySize]?.[orifice];
      const qCritScfhNg = cg ? criticalFlowScfhNg(maxInlet, cg) : null;
      const qCritScfm = qCritScfhNg ? scfhNgToScfmGas(qCritScfhNg, sg) : null;

      // Operating flow at set point and operating inlet
      const qTableScfh = interpCaps[i];
      const qOpScfmGas = scfhNgToScfmGas(qTableScfh, sg);

      // Does this orifice meet required flow?
      const meetsFlow = reqFlowScfm ? qOpScfmGas >= reqFlowScfm : null;

      return {
        orifice,
        inletOk,
        maxInletForOrifice,
        qCritScfhNg,
        qCritScfm,
        qTableScfh,
        qOpScfmGas,
        meetsFlow
      };
    });

    // Best recommended orifice: smallest that meets flow and inlet constraints
    const recommended = orificeResults.find(o => o.inletOk && o.meetsFlow !== false);

    results.push({
      spring: sr,
      block,
      displayRows,
      orificeResults,
      recommended,
      sg
    });
  }

  return { model, bodySize, setPressure, operatingInlet, maxInlet, fluid, sg, reqFlowScfm, springRanges, results };
}

// ─────────────────────────────────────────────────────────────────────────────
// UI
// ─────────────────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const sgForFluid = { air: 1.0, nitrogen: 0.967, naturalgas: null };

function getInputs() {
  const model = $('model').value;
  const bodySize = $('bodySize').value;
  const spring = $('spring').value;
  const setPressure = parseFloat($('setPressure').value);
  const maxInlet = parseFloat($('maxInlet').value);
  const operatingInlet = parseFloat($('operatingInlet').value);
  const fluid = $('fluid').value;
  const sg = fluid === 'naturalgas' ? parseFloat($('sgInput').value) : sgForFluid[fluid];
  const reqFlowScfm = parseFloat($('reqFlow').value) || null;
  const needRelief = $('needRelief').value === 'yes';

  return { model, bodySize, spring, setPressure, maxInlet, operatingInlet, fluid, sg, reqFlowScfm, needRelief };
}

function fmt(n, dec = 1) {
  if (n == null || isNaN(n)) return '—';
  return n.toFixed(dec);
}

function renderCapRow(rowData, sg) {
  return ORIFICES.map((_, i) => {
    const q_ng = rowData.caps[i];
    const q_gas = scfhNgToScfmGas(q_ng, sg);
    const q_air = scfhNgToScfmGas(q_ng, 1.0);
    if (Math.abs(sg - 1.0) < 0.001) {
      return `<td>${fmt(q_air)}</td>`;
    }
    return `<td>${fmt(q_air)}<br><span class="sub">${fmt(q_gas)} @ SG ${fmt(sg,3)}</span></td>`;
  }).join('');
}

function renderResults(data) {
  if (data.error) {
    return `<div class="error">${data.error}</div>`;
  }

  let html = '';

  for (const result of data.results) {
    if (result.error) {
      html += `<div class="card error"><b>Spring ${result.spring}:</b> ${result.error}</div>`;
      continue;
    }

    const { spring, displayRows, orificeResults, recommended, sg } = result;

    // Spring range header
    const springColors = {
      '5-20': '#f59e0b', '15-40': '#22c55e', '35-80': '#3b82f6',
      '70-150': '#ef4444', '140-250': '#3b82f6', '240-500': '#ef4444'
    };
    const color = springColors[spring] || '#6b7280';

    html += `<div class="card">
      <div class="spring-header" style="border-left:4px solid ${color}; padding-left:10px">
        <span class="spring-badge" style="background:${color}">${spring} psig Spring</span>
        <span class="model-tag">${data.model} — ${data.bodySize}" Body</span>
      </div>`;

    // Recommended orifice callout
    if (recommended) {
      const r = recommended;
      html += `<div class="recommend">
        <div class="rec-title">Recommended: <strong>${r.orifice}" Orifice</strong></div>
        <div class="rec-stats">
          <div class="stat"><label>Operating Flow</label><val>${fmt(r.qOpScfmGas)} SCFM</val></div>
          <div class="stat"><label>PSV Wide-Open (max inlet)</label><val>${fmt(r.qCritScfm)} SCFM</val></div>
          <div class="stat"><label>PSV Wide-Open (Cg method)</label><val>${fmt(r.qCritScfhNg, 0)} SCFH NG</val></div>
        </div>
      </div>`;
    }

    // Capacity interpolation table
    html += `<div class="table-wrap"><table class="cap-table">
      <thead>
        <tr>
          <th>Outlet Setting</th>
          ${ORIFICES.map(o => `<th>${o}"</th>`).join('')}
        </tr>
      </thead><tbody>`;

    for (const row of displayRows) {
      const isInterp = row.label.includes('★');
      html += `<tr class="${isInterp ? 'interp-row' : ''}">
        <td class="set-label">${row.label}</td>
        ${renderCapRow(row, sg)}
      </tr>`;
    }

    html += `</tbody></table></div>
      <div class="table-note">SCFM Air (SCFM @ SG ${fmt(sg,3)} below in grey where applicable). Capacities at operating inlet: ${data.operatingInlet} psig.</div>`;

    // Orifice-by-orifice detail table
    html += `<details><summary>All Orifice Details (PSV sizing)</summary>
      <table class="detail-table"><thead>
        <tr><th>Orifice</th><th>Max Inlet OK?</th><th>Op. Flow (SCFM)</th><th>PSV Wide-Open (SCFM)</th><th>PSV Wide-Open (SCFH NG)</th><th>Meets Flow?</th></tr>
      </thead><tbody>`;

    for (const o of orificeResults) {
      const ok = o.inletOk ? '✓' : '✗';
      const meet = o.meetsFlow === null ? '—' : o.meetsFlow ? '✓' : '✗';
      const rowClass = (!o.inletOk ? 'row-warn' : '') + (o === recommended ? ' row-rec' : '');
      html += `<tr class="${rowClass}">
        <td>${o.orifice}"</td>
        <td class="${o.inletOk?'ok':'fail'}">${ok} (max ${o.maxInletForOrifice} psig)</td>
        <td>${fmt(o.qOpScfmGas)}</td>
        <td>${fmt(o.qCritScfm)}</td>
        <td>${fmt(o.qCritScfhNg, 0)}</td>
        <td class="${o.meetsFlow?'ok':'fail'}">${meet}</td>
      </tr>`;
    }
    html += `</tbody></table></details></div>`;
  }

  return html;
}

function updateSpringOptions() {
  const model = $('model').value;
  const springs = MODELS[model]?.springs || [];
  const sel = $('spring');
  const current = sel.value;
  sel.innerHTML = '<option value="auto">Auto (all applicable)</option>';
  for (const s of springs) {
    sel.innerHTML += `<option value="${s}">${s} psig</option>`;
  }
  if (springs.includes(current)) sel.value = current;
}

function updateBodySizes() {
  const model = $('model').value;
  const sizes = MODELS[model]?.bodySizes || [];
  const sel = $('bodySize');
  const current = sel.value;
  sel.innerHTML = '';
  for (const s of sizes) {
    sel.innerHTML += `<option value="${s}">${s === '3/4' ? '3/4 NPT' : `NPS ${s}`}</option>`;
  }
  if (sizes.includes(current)) sel.value = current;
}

function onSubmit(e) {
  e.preventDefault();
  const inputs = getInputs();

  // Validation
  if (isNaN(inputs.setPressure) || inputs.setPressure <= 0) {
    $('results').innerHTML = '<div class="error">Please enter a valid set pressure.</div>'; return;
  }
  if (isNaN(inputs.maxInlet) || inputs.maxInlet <= 0) {
    $('results').innerHTML = '<div class="error">Please enter a valid maximum inlet pressure.</div>'; return;
  }
  if (isNaN(inputs.operatingInlet) || inputs.operatingInlet <= 0) {
    $('results').innerHTML = '<div class="error">Please enter a valid operating inlet pressure.</div>'; return;
  }
  if (inputs.operatingInlet <= inputs.setPressure) {
    $('results').innerHTML = '<div class="error">Operating inlet pressure must be greater than set pressure.</div>'; return;
  }
  if (inputs.fluid === 'naturalgas' && (isNaN(inputs.sg) || inputs.sg <= 0)) {
    $('results').innerHTML = '<div class="error">Please enter a valid specific gravity for natural gas.</div>'; return;
  }

  const data = calculate(inputs);
  $('results').innerHTML = renderResults(data);
  $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('DOMContentLoaded', () => {
  updateBodySizes();
  updateSpringOptions();

  $('model').addEventListener('change', () => { updateBodySizes(); updateSpringOptions(); });
  $('fluid').addEventListener('change', () => {
    $('sgRow').style.display = $('fluid').value === 'naturalgas' ? 'flex' : 'none';
  });
  $('calcForm').addEventListener('submit', onSubmit);

  // PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});
