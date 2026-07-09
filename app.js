/* ================================================================== *
 *  Sebastian's Marathon — Run Coach
 *  Vast schema + invullen/afvinken, Strava-achtige stats, badges.
 *  Alles lokaal in de browser. Geen server nodig (werkt ook via file://).
 * ================================================================== */

/* ========== INSTELLINGEN PER HARDLOPER — pas dit blok aan ==========
   Hergebruik deze app voor een andere loper: kopieer de map, wijzig dit
   blok, vervang coach.jpg, en pas zo nodig het PLAN/de ZONES aan.       */
const CONFIG = {
  unit:       "km",
  zonePaceSuffix: "/km",
  footEmoji:  "🏃‍♂️",
  mottos: ["Zet 'm op, strijder!", "Lekker bezig, strijder!", "Je bouwt 'm op, strijder.", "Halverwege — doorpakken! ⚡", "Bijna race-klaar, strijder!", "Marathonfinisher! Wat een strijder!"],
  appName:    "Op naar de marathon",   // titel boven in de app
  runner:     "Sebastian",             // naam van de loper
  goal:       "Marathon in 3:30–3:45", // doel (groot in de hero)
  startDate:  new Date(2026, 5, 29),   // maandag van week 1 (maand 0-based: 5 = juni)
  storeKey:   "sebastian-marathon.log.v1", // UNIEKE opslagsleutel — per loper anders!
  coachName:  "Coach Bart",            // naam van de coach
  coachHandle:"@bartlopen",            // TikTok/social van de coach
  coachPhoto: "coach.jpg",             // coachfoto (bestand in deze map)
  athleteWord:"strijder",              // hoe de coach de loper aanspreekt
  catchphrase:"Zet 'm op, strijder!",  // jouw TikTok-leus
};
/* =================================================================== */

const RUNNER = CONFIG.runner;
const GOAL = CONFIG.goal;
const START_DATE = CONFIG.startDate;
const STORE_KEY = CONFIG.storeKey;
const UNIT = CONFIG.unit === "min" ? "min" : "km";
const UNIT_LABEL = UNIT;
const ZONE_SUFFIX = CONFIG.zonePaceSuffix ?? "/km";
const COACH_INITIAL = (CONFIG.coachName.replace(/^coach\s+/i, "")[0] || "C").toUpperCase();

/* Aantal weken in dit schema (gebruikt voor de "Nu"-markering & racedetectie) */
const TOTAL_WEEKS = 18;

/* --- Tempozones (niveau: gevorderd) -------------------------------- */
const ZONES = [
  { key: "herstel",  name: "Herstel",          pace: "langzamer dan 6:15", info: "RPE 2-3 · uitlopen" },
  { key: "duur",     name: "Rustige duur",     pace: "5:50–6:15",          info: "RPE 3-4 · praten kan makkelijk" },
  { key: "lang",     name: "Lange duurloop",   pace: "5:55–6:20",          info: "RPE 3-4 · duurvermogen" },
  { key: "doel",     name: "Marathontempo",    pace: "5:05–5:15",          info: "RPE 5-6 · je racetempo" },
  { key: "tempo",    name: "Drempel / tempo",  pace: "4:50–5:00",          info: "RPE 6-7 · stevig, comfortabel zwaar" },
  { key: "interval", name: "Interval (VO2max)",pace: "4:20–4:35",          info: "RPE 8 · scherp, nooit sprinten" },
];
const zoneByKey = Object.fromEntries(ZONES.map((z) => [z.key, z]));

/* --- Coach Bart (@bartlopen): toffe, motiverende praat per type ----- */
const COACH = {
  duur: [
    "Rustig tempo vandaag, strijder. Hier bouw je je marathonmotor op.",
    "Geen haast — deze kalme kilometers maken je sterk en blessurevrij.",
    "Lekker ontspannen lopen. Tachtig procent van je werk hoort zo te voelen.",
    "Rustig is precies goed. Zo kun je morgen weer knallen, strijder.",
  ],
  lang: [
    "De lange duurloop, strijder. Het hart van je marathontraining.",
    "Tijd op de benen betaalt zich op 1 november uit. Jij kunt dit.",
    "Verdeel je krachten, eet en drink op tijd, en geniet van de afstand.",
    "Rustig starten, sterk eindigen. Elke kilometer maakt je marathon-klaar.",
  ],
  tempo: [
    "Drempeltraining, strijder. Stevig, maar netjes onder controle.",
    "Comfortabel zwaar — daar verleg je je grens. Gelijkmatig blijven.",
    "Net onder het verzuren. Hier wordt je marathontempo lichter.",
    "Beheerst doorzetten. Je tilt je hele niveau omhoog, strijder.",
  ],
  interval: [
    "Intervallen, strijder. Korte inspanningen, goed herstellen.",
    "Houd elke herhaling gelijk en soepel. Focus op je looptechniek.",
    "Even pittig, daarna rust. Jij hebt dit onder controle, strijder.",
    "Scherp en gecontroleerd. Hier komt je loopeconomie vandaan.",
  ],
  doel: [
    "Marathontempo, strijder. Onthoud precies hoe dit voelt voor 1 november.",
    "Dit is je wedstrijdritme: 5:05–5:15/km. Vertrouw op je benen.",
    "Beheerst op tempo blijven — precies waar je het al die weken voor doet.",
    "Voel je marathontempo, strijder. Op de racedag voelt het als thuiskomen.",
  ],
  herstel: [
    "Hersteldag, strijder. Rustig aan, daar word je beter van.",
    "Vandaag laad je op. Herstel hoort net zo goed bij trainen.",
    "Houd het licht en kalm. Morgen sta je er sterker.",
    "Goed dat je rust neemt, strijder. Slim getraind is half gewonnen.",
  ],
};
const coachLine = (zone) => {
  const arr = COACH[zone] || COACH.duur;
  return arr[Math.floor(Math.random() * arr.length)];
};

/* --- Waarom deze training? (uitleg per type) ----------------------- */
const DONE = [
  "💪 Knap gedaan, strijder!",
  "🔥 Weer eentje afgevinkt — trots op je!",
  "👏 Lekker bezig, strijder.",
  "🌟 Mooi volgehouden. Zo bouw je 'm op.",
  "✅ Weer een stukje sterker geworden.",
];

const WHY = {
  duur:     "Rustige duurlopen bouwen je aerobe motor: sterker hart, meer haarvaten en betere vetverbranding. Het grootste deel van je weekvolume hoort hier rustig te zijn — zo verdraag je de marathonopbouw zonder blessures.",
  lang:     "De lange duurloop is de ruggengraat van je marathon. Je traint uithoudingsvermogen, vetverbranding en het mentale 'doorlopen'. Hier leer je je lichaam dat 42 km haalbaar is.",
  tempo:    "Drempel- of tempolopen liggen rond je omslagpunt. Je leert sneller lopen zónder te verzuren, waardoor je marathontempo steeds lichter gaat voelen.",
  interval: "Korte, snelle herhalingen prikkelen je VO2max en loopeconomie. Je benen leren vlot en efficiënt schakelen — dat scheelt energie op elke kilometer van je marathon.",
  doel:     "Lopen op exact je marathontempo (≈ 5:05–5:15/km) maakt dat ritme vertrouwd. Doe je dit vaak — ook moe in de lange loop — dan voelt het op de racedag als vanzelf in plaats van een gok.",
  herstel:  "Herstel is waar je sterker wordt. Lichte inspanning houdt het bloed stromen zonder nieuwe belasting, zodat de winst van je zware dagen en lange lopen echt binnenkomt.",
};

/* --- Helpers om het schema compact te schrijven --------------------
   4 flexibele slots per week — kies zelf welke dagen je loopt, maar
   houd minstens één rustdag tussen Kwaliteit en Lang.                  */
const d1 = (o) => ({ day: "d1", dayLabel: "Rustig",    kind: "Rustige duurloop", ...o });
const d2 = (o) => ({ day: "d2", dayLabel: "Kwaliteit", kind: "Kwaliteit",        ...o });
const d3 = (o) => ({ day: "d3", dayLabel: "Duur",      kind: "Duurloop",         ...o });
const d4 = (o) => ({ day: "d4", dayLabel: "Lang",      kind: "Lange duurloop",   ...o });

/* --- Het 18-weken marathonschema ----------------------------------- */
const PLAN = [
  /* ===== Fase 1 · Basis & duur ===== */
  { week: 1, dates: "29 jun–5 jul", phase: "Fase 1 · Basis & duur", sessions: [
    d1({ zone: "duur",  km: 10, title: "10 km rustig",       goal: "Basisritme terugvinden", blocks: ["10 km op 5:50–6:15/km", "Ontspannen, ademhaling onder controle"] }),
    d2({ zone: "tempo", km: 10, title: "Fartlek 8×1 min",    goal: "Beentjes wakker maken",  blocks: ["2 km inlopen + 3 versnellingen", "8×1 min vlot, 1 min dribbel ertussen", "2 km uitlopen"] }),
    d3({ zone: "duur",  km: 14, title: "14 km duurloop",     goal: "Volume opbouwen",        blocks: ["14 km op 5:50–6:15/km", "Gelijkmatig en ontspannen"] }),
    d4({ zone: "lang",  km: 16, title: "16 km lang",         goal: "Lange duur oppakken",    blocks: ["16 km op 5:55–6:20/km", "Laatste 3 km iets vlotter op gevoel"] }),
  ]},
  { week: 2, dates: "6–12 jul", phase: "Fase 1 · Basis & duur", sessions: [
    d1({ zone: "duur",  km: 10, title: "10 km rustig",       goal: "Herstel & volume",       blocks: ["10 km op 5:50–6:15/km"] }),
    d2({ zone: "tempo", km: 12, title: "3×2 km tempo",       goal: "Drempel aanspreken",     blocks: ["2 km inlopen", "3×2 km @ 4:50–5:00/km", "2 min dribbel ertussen", "2 km uitlopen"] }),
    d3({ zone: "duur",  km: 14, title: "14 km duurloop",     goal: "Volume",                 blocks: ["14 km op 5:50–6:15/km"] }),
    d4({ zone: "lang",  km: 18, title: "18 km lang",         goal: "Duur opbouwen",          blocks: ["18 km op 5:55–6:20/km", "Drinken oefenen onderweg"] }),
  ]},
  { week: 3, dates: "13–19 jul", phase: "Fase 1 · Basis & duur", sessions: [
    d1({ zone: "duur",  km: 12, title: "12 km rustig",       goal: "Meer volume",            blocks: ["12 km op 5:50–6:15/km"] }),
    d2({ zone: "tempo", km: 14, title: "4×2 km tempo",       goal: "Drempel uitbreiden",     blocks: ["2 km inlopen", "4×2 km @ 4:50–5:00/km", "2 min dribbel ertussen", "2 km uitlopen"] }),
    d3({ zone: "duur",  km: 12, title: "12 km duurloop",     goal: "Volume",                 blocks: ["12 km op 5:50–6:15/km"] }),
    d4({ zone: "lang",  km: 20, title: "20 km lang",         goal: "Eerste 20'er",           blocks: ["20 km op 5:55–6:20/km", "Rustig starten, sterk eindigen"] }),
  ]},
  { week: 4, dates: "20–26 jul", phase: "Fase 1 · Basis & duur", recovery: true, sessions: [
    d1({ zone: "herstel", km: 10, title: "10 km heel rustig",   goal: "Herstelweek",         blocks: ["10 km, langzamer dan 6:15/km"] }),
    d2({ zone: "duur",    km: 8,  title: "8 km + 6 strides",    goal: "Los blijven", kind: "Soepel", blocks: ["8 km rustig", "6×100 m soepel versnellen"] }),
    d3({ zone: "duur",    km: 14, title: "14 km duurloop",      goal: "Volume aanhouden",    blocks: ["14 km op 5:50–6:15/km"] }),
    d4({ zone: "lang",    km: 14, title: "14 km ontspannen",    goal: "Herstel",             blocks: ["14 km laag in zone 2"] }),
  ]},

  /* ===== Fase 2 · Tempo & kracht ===== */
  { week: 5, dates: "27 jul–2 aug", phase: "Fase 2 · Tempo & kracht", sessions: [
    d1({ zone: "duur",  km: 12, title: "12 km rustig",       goal: "Volume",                 blocks: ["12 km op 5:50–6:15/km"] }),
    d2({ zone: "tempo", km: 12, title: "2×3 km tempo",       goal: "Drempel verlengen",      blocks: ["2 km inlopen", "2×3 km @ 4:55–5:00/km", "3 min dribbel ertussen", "2 km uitlopen"] }),
    d3({ zone: "duur",  km: 12, title: "12 km duurloop",     goal: "Volume",                 blocks: ["12 km op 5:50–6:15/km"] }),
    d4({ zone: "doel",  km: 20, title: "20 km met 6 km MT",  goal: "Marathontempo voelen",   blocks: ["14 km op 5:55–6:20/km", "6 km @ marathontempo 5:05–5:15/km"] }),
  ]},
  { week: 6, dates: "3–9 aug", phase: "Fase 2 · Tempo & kracht", sessions: [
    d1({ zone: "duur", km: 12, title: "12 km rustig",        goal: "Volume",                 blocks: ["12 km op 5:50–6:15/km"] }),
    d2({ zone: "doel", km: 13, title: "8 km op marathontempo", goal: "Racetempo aanleren",   blocks: ["2 km inlopen", "8 km @ 5:05–5:15/km", "3 km uitlopen"] }),
    d3({ zone: "duur", km: 13, title: "13 km duurloop",      goal: "Volume",                 blocks: ["13 km op 5:50–6:15/km"] }),
    d4({ zone: "lang", km: 22, title: "22 km lang",          goal: "Langer op de benen",     blocks: ["22 km op 5:55–6:20/km", "Voeding oefenen: 1 gel rond 12 km"] }),
  ]},
  { week: 7, dates: "10–16 aug", phase: "Fase 2 · Tempo & kracht", sessions: [
    d1({ zone: "duur",     km: 12, title: "12 km rustig",    goal: "Volume",                 blocks: ["12 km op 5:50–6:15/km"] }),
    d2({ zone: "interval", km: 14, title: "6×1 km interval", goal: "VO2max & economie",      blocks: ["2 km inlopen + 3 versnellingen", "6×1 km @ 4:20–4:35/km", "400 m dribbel ertussen", "2 km uitlopen"] }),
    d3({ zone: "duur",     km: 14, title: "14 km duurloop",  goal: "Volume",                 blocks: ["14 km op 5:50–6:15/km"] }),
    d4({ zone: "lang",     km: 24, title: "24 km lang",      goal: "Duur uitbreiden",        blocks: ["24 km op 5:55–6:20/km", "Laatste 5 km richting marathontempo"] }),
  ]},
  { week: 8, dates: "17–23 aug", phase: "Fase 2 · Tempo & kracht", recovery: true, sessions: [
    d1({ zone: "herstel", km: 10, title: "10 km heel rustig",   goal: "Herstelweek",         blocks: ["10 km, langzamer dan 6:15/km"] }),
    d2({ zone: "duur",    km: 10, title: "10 km + 6 strides",   goal: "Los blijven", kind: "Soepel", blocks: ["10 km rustig", "6×100 m soepel"] }),
    d3({ zone: "duur",    km: 12, title: "12 km duurloop",      goal: "Volume",              blocks: ["12 km op 5:50–6:15/km"] }),
    d4({ zone: "lang",    km: 18, title: "18 km ontspannen",    goal: "Herstel",             blocks: ["18 km laag in zone 2"] }),
  ]},

  /* ===== Fase 3 · Marathon-specifiek ===== */
  { week: 9, dates: "24–30 aug", phase: "Fase 3 · Marathon-specifiek", sessions: [
    d1({ zone: "duur",  km: 13, title: "13 km rustig",       goal: "Volume",                 blocks: ["13 km op 5:50–6:15/km"] }),
    d2({ zone: "tempo", km: 14, title: "5×2 km tempo",       goal: "Drempelvolume",          blocks: ["2 km inlopen", "5×2 km @ 4:50–5:00/km", "2 min dribbel ertussen", "1 km uitlopen"] }),
    d3({ zone: "duur",  km: 14, title: "14 km duurloop",     goal: "Volume",                 blocks: ["14 km op 5:50–6:15/km"] }),
    d4({ zone: "doel",  km: 25, title: "25 km met 10 km MT", goal: "Marathontempo in de benen", blocks: ["15 km op 5:55–6:20/km", "10 km @ marathontempo 5:05–5:15/km"] }),
  ]},
  { week: 10, dates: "31 aug–6 sep", phase: "Fase 3 · Marathon-specifiek", sessions: [
    d1({ zone: "duur", km: 13, title: "13 km rustig",        goal: "Volume",                 blocks: ["13 km op 5:50–6:15/km"] }),
    d2({ zone: "doel", km: 15, title: "3×3 km marathontempo", goal: "Racetempo herhalen",    blocks: ["2 km inlopen", "3×3 km @ 5:05–5:15/km", "2 min dribbel ertussen", "2 km uitlopen"] }),
    d3({ zone: "duur", km: 15, title: "15 km duurloop",      goal: "Volume",                 blocks: ["15 km op 5:50–6:15/km"] }),
    d4({ zone: "lang", km: 27, title: "27 km lang",          goal: "Lange duur",             blocks: ["27 km op 5:55–6:20/km", "Halverwege 1 gel, ritme bewaken"] }),
  ]},
  { week: 11, dates: "7–13 sep", phase: "Fase 3 · Marathon-specifiek", sessions: [
    d1({ zone: "duur",  km: 14, title: "14 km rustig",       goal: "Volume",                 blocks: ["14 km op 5:50–6:15/km"] }),
    d2({ zone: "tempo", km: 16, title: "2×4 km tempo",       goal: "Drempel verlengen",      blocks: ["2 km inlopen", "2×4 km @ 4:55–5:00/km", "3 min dribbel ertussen", "2 km uitlopen"] }),
    d3({ zone: "duur",  km: 15, title: "15 km duurloop",     goal: "Volume",                 blocks: ["15 km op 5:50–6:15/km"] }),
    d4({ zone: "doel",  km: 29, title: "29 km met 12 km MT", goal: "Sleutelloop · racevoeding", blocks: ["17 km op 5:55–6:20/km", "12 km @ marathontempo 5:05–5:15/km", "Voeding precies als op racedag"] }),
  ]},
  { week: 12, dates: "14–20 sep", phase: "Fase 3 · Marathon-specifiek", recovery: true, sessions: [
    d1({ zone: "herstel", km: 12, title: "12 km heel rustig",  goal: "Herstelweek",          blocks: ["12 km, langzamer dan 6:15/km"] }),
    d2({ zone: "duur",    km: 12, title: "12 km + 6 strides",  goal: "Los blijven", kind: "Soepel", blocks: ["12 km rustig", "6×100 m soepel"] }),
    d3({ zone: "duur",    km: 12, title: "12 km duurloop",     goal: "Volume aanhouden",     blocks: ["12 km op 5:50–6:15/km"] }),
    d4({ zone: "lang",    km: 22, title: "22 km ontspannen",   goal: "Herstel",              blocks: ["22 km laag in zone 2"] }),
  ]},
  { week: 13, dates: "21–27 sep", phase: "Fase 3 · Marathon-specifiek", sessions: [
    d1({ zone: "duur",     km: 14, title: "14 km rustig",     goal: "Volume",                 blocks: ["14 km op 5:50–6:15/km"] }),
    d2({ zone: "interval", km: 16, title: "8×1 km interval",  goal: "Scherpte & economie",    blocks: ["2 km inlopen + 3 versnellingen", "8×1 km @ 4:20–4:35/km", "400 m dribbel ertussen", "2 km uitlopen"] }),
    d3({ zone: "duur",     km: 16, title: "16 km duurloop",   goal: "Volume",                 blocks: ["16 km op 5:50–6:15/km"] }),
    d4({ zone: "lang",     km: 30, title: "30 km lang",       goal: "Eerste 30'er",           blocks: ["30 km op 5:55–6:20/km", "Rustig blijven, voeding strak volgen"] }),
  ]},
  { week: 14, dates: "28 sep–4 okt", phase: "Fase 3 · Marathon-specifiek", sessions: [
    d1({ zone: "duur", km: 14, title: "14 km rustig",         goal: "Volume",                 blocks: ["14 km op 5:50–6:15/km"] }),
    d2({ zone: "doel", km: 17, title: "10 km marathontempo",  goal: "Lang op racetempo",      blocks: ["3 km inlopen", "10 km @ 5:05–5:15/km", "4 km uitlopen"] }),
    d3({ zone: "duur", km: 17, title: "17 km duurloop",       goal: "Piek-volume",            blocks: ["17 km op 5:50–6:15/km"] }),
    d4({ zone: "lang", km: 32, title: "32 km lang",           goal: "Langste loop · piek",    blocks: ["32 km op 5:55–6:20/km", "Laatste 8 km richting marathontempo", "Volledige racevoeding testen"] }),
  ]},
  { week: 15, dates: "5–11 okt", phase: "Fase 3 · Marathon-specifiek", sessions: [
    d1({ zone: "duur", km: 13, title: "13 km rustig",         goal: "Volume",                 blocks: ["13 km op 5:50–6:15/km"] }),
    d2({ zone: "doel", km: 16, title: "8 km marathontempo",   goal: "Racetempo scherp houden", blocks: ["3 km inlopen", "8 km @ 5:05–5:15/km", "5 km uitlopen"] }),
    d3({ zone: "duur", km: 15, title: "15 km duurloop",       goal: "Volume",                 blocks: ["15 km op 5:50–6:15/km"] }),
    d4({ zone: "doel", km: 26, title: "26 km met 8 km MT",    goal: "Laatste sleutelloop",    blocks: ["18 km op 5:55–6:20/km", "8 km @ marathontempo 5:05–5:15/km"] }),
  ]},

  /* ===== Fase 4 · Taper & race ===== */
  { week: 16, dates: "12–18 okt", phase: "Fase 4 · Taper & race", taper: true, sessions: [
    d1({ zone: "duur", km: 12, title: "12 km rustig",         goal: "Taper start",            blocks: ["12 km op 5:50–6:15/km"] }),
    d2({ zone: "doel", km: 12, title: "5 km marathontempo",   goal: "Ritme vasthouden",       blocks: ["2 km inlopen", "5 km @ 5:05–5:15/km", "Rustig uitlopen"] }),
    d3({ zone: "duur", km: 12, title: "12 km duurloop",       goal: "Volume omlaag",          blocks: ["12 km op 5:50–6:15/km"] }),
    d4({ zone: "lang", km: 22, title: "22 km laatste lange",  goal: "Laatste lange duur",     blocks: ["22 km op 5:55–6:20/km", "Comfortabel, niet forceren"] }),
  ]},
  { week: 17, dates: "19–25 okt", phase: "Fase 4 · Taper & race", taper: true, sessions: [
    d1({ zone: "duur", km: 10, title: "10 km rustig",         goal: "Taper",                  blocks: ["10 km op 5:50–6:15/km"] }),
    d2({ zone: "tempo", km: 10, title: "3×1 km tempo",        goal: "Scherp & fris",          blocks: ["2 km inlopen", "3×1 km @ 4:55/km", "2 min dribbel ertussen", "2 km uitlopen"] }),
    d3({ zone: "duur", km: 10, title: "10 km duurloop",       goal: "Volume laag",            blocks: ["10 km op 5:50–6:15/km"] }),
    d4({ zone: "lang", km: 16, title: "16 km soepel",         goal: "Kort houden",            blocks: ["16 km op 5:55–6:20/km"] }),
  ]},
  { week: 18, dates: "26 okt–1 nov", phase: "Fase 4 · Taper & race", taper: true, race: true, sessions: [
    d1({ zone: "duur", km: 8,  title: "8 km rustig",          goal: "Benen los houden",       blocks: ["8 km op 5:55–6:20/km", "Ontspannen, niets forceren"] }),
    d2({ zone: "doel", km: 8,  title: "6 km + 2 km op MT",    goal: "Scherp & fris", kind: "Soepel", blocks: ["4 km rustig + 4×100 m strides", "2 km @ marathontempo om het ritme te voelen"] }),
    d3({ zone: "duur", km: 5,  title: "5 km loslopen",        goal: "2 dagen voor de race", kind: "Soepel", blocks: ["5 km heel rustig", "3×100 m korte versnellingen", "Vroeg naar bed, goed eten"] }),
    d4({ zone: "doel", km: 42.2, title: "🏁 Marathon", race: true, goal: "Doelrace · 3:30–3:45", kind: "Doelrace", blocks: ["Eerste 5 km bewust rustig: 5:15–5:20/km", "Settle op marathontempo 5:05–5:15/km", "Voeding/drinken elke 30–40 min", "Vanaf 32 km: alles geven, strijder 🔥"] }),
  ]},
];

/* --- Extra advies (info-kaarten) ----------------------------------- */
const INFO = [
  { icon: "🔥", title: "Warming-up & cooling-down", items: [
    "Rustige duurlopen: start de eerste km kalm in.",
    "Kwaliteit (tempo/interval): 2 km inlopen + 3 korte versnellingen vóór de blokken.",
    "Elke training: 1–2 km uitlopen of 5–8 min wandelen.",
  ]},
  { icon: "💪", title: "Kracht, mobiliteit & rust", items: [
    "Kracht 1–2× per week: squats, lunges, calf raises, hip bridge, plank.",
    "Niet zwaar op de benen vlak vóór een kwaliteits- of lange duurloop.",
    "5–8 min mobiliteit na het lopen: kuiten, heupbuigers, bilspieren, hamstrings.",
    "Minstens 1 echte rustdag; wandelen/fietsen mag op tussendagen.",
  ]},
  { icon: "🥤", title: "Voeding & drinken", items: [
    "Lange lopen >75 min: 400–600 ml per uur, bij warmte met elektrolyten.",
    "Oefen 30–60 g koolhydraten per uur (1–2 gels) — train je darmen mee.",
    "Test je complete racevoeding in de lange MT-lopen (week 11 & 14).",
    "Na afloop binnen 1–2 uur eiwit + koolhydraten voor herstel.",
  ]},
  { icon: "🎯", title: "Taper & racedag", items: [
    "Week 16–18: omvang omlaag, intensiteit kort scherp houden.",
    "Je moet je bijna té fris voelen — dat is de bedoeling.",
    "3:30 = 4:58/km · 3:45 = 5:20/km · streeftempo 5:05–5:15/km.",
    "Start rustig (eerste 5 km), bouw op, en houd wat over voor na 32 km.",
  ]},
];

/* --- Badges -------------------------------------------------------- */
const BADGES = [
  { id: "first",  icon: "👟",  name: "Eerste run",        desc: "1 training afgevinkt",   test: (s) => s.done >= 1 },
  { id: "ten",    icon: "🔟",  name: "Tien op de teller", desc: "10 trainingen gedaan",   test: (s) => s.done >= 10 },
  { id: "half",   icon: "⚡",  name: "Halverwege",        desc: "50% van het schema",     test: (s) => s.done >= s.total / 2 },
  { id: "week",   icon: "✅",  name: "Week compleet",     desc: "Een hele week afgerond", test: (s) => s.fullWeeks >= 1 },
  { id: "long",   icon: "🏔️", name: "Dertiger",          desc: "≥ 30 km gelogd",         test: (s) => s.maxDist >= 30 },
  { id: "fast",   icon: "💨",  name: "Snelle benen",      desc: "Een run onder 5:00/km",  test: (s) => s.bestPace > 0 && s.bestPace < 300 },
  { id: "streak", icon: "🔥",  name: "On fire",           desc: "Reeks van 8 trainingen", test: (s) => s.streak >= 8 },
  { id: "finish", icon: "🏅",  name: "Marathonfinisher",  desc: "De marathon voltooid",   test: (s) => s.raceDone },
];

/* ================================================================== *
 *  State
 * ================================================================== */
function loadLog() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
  catch { return {}; }
}
function saveLog() { localStorage.setItem(STORE_KEY, JSON.stringify(log)); }
let log = loadLog();

const sid = (week, day) => `w${week}-${day}`;
const flatSessions = PLAN.flatMap((w) => w.sessions.map((s) => ({ ...s, week: w.week })));
const totalSessions = flatSessions.length;
const LAST_SESSION = flatSessions[flatSessions.length - 1];
const DAY_OFFSET = { ma: 0, di: 1, wo: 2, do: 3, vr: 4, za: 5, zo: 6, d1: 0, d2: 2, d3: 4, d4: 6 };

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function dateAtDay(dayIndex) {
  const date = new Date(START_DATE);
  date.setDate(date.getDate() + dayIndex);
  date.setHours(12, 0, 0, 0);
  return date;
}

function sessionDate(week, day) {
  return dateAtDay((week - 1) * 7 + (DAY_OFFSET[day] ?? 0));
}

function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function planningEntries() {
  return Array.isArray(log.__planning) ? log.__planning : [];
}

function planningForWeek(week) {
  const start = isoDate(dateAtDay((week - 1) * 7));
  const end = isoDate(dateAtDay((week - 1) * 7 + 6));
  return planningEntries().filter((entry) => entry.start <= end && (entry.end || entry.start) >= start);
}

function parseTime(str) {
  if (!str) return null;
  const parts = String(str).split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 60;
}

function durationParts(str) {
  const total = parseTime(str) || 0;
  return { minutes: Math.floor(total / 60), seconds: total % 60 };
}

function durationValue(minutes, seconds) {
  const m = Math.max(0, parseInt(minutes, 10) || 0);
  const s = Math.min(59, Math.max(0, parseInt(seconds, 10) || 0));
  return `${m}:${String(s).padStart(2, "0")}`;
}
function paceSeconds(distance, timeStr) {
  const d = parseFloat(String(distance).replace(",", "."));
  const sec = parseTime(timeStr);
  if (!d || !sec) return null;
  return sec / d;
}
function fmtPace(perKm) {
  if (!perKm) return null;
  const m = Math.floor(perKm / 60);
  const s = Math.round(perKm % 60);
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

/* Afgeleide statistieken uit de log */
function computeStats() {
  let done = 0, km = 0, maxDist = 0, maxTime = 0, bestPace = 0, raceDone = false;
  flatSessions.forEach((s) => {
    const e = log[sid(s.week, s.day)];
    if (!e || !e.done) return;
    done++;
    const d = parseFloat(String(e.distance || "").replace(",", ".")) || 0;
    km += d;
    if (d > maxDist) maxDist = d;
    const t = parseTime(e.time) || 0;
    if (t > maxTime) maxTime = t;
    const p = paceSeconds(e.distance, e.time);
    if (p && (bestPace === 0 || p < bestPace)) bestPace = p;
    if (s.week === LAST_SESSION.week && s.day === LAST_SESSION.day) raceDone = true;
  });
  let streak = 0, run = 0;
  flatSessions.forEach((s) => {
    const e = log[sid(s.week, s.day)];
    if (e && e.done) { run++; streak = Math.max(streak, run); } else run = 0;
  });
  let fullWeeks = 0;
  PLAN.forEach((w) => {
    if (w.sessions.every((s) => log[sid(w.week, s.day)]?.done)) fullWeeks++;
  });
  return { done, total: totalSessions, km, maxDist, maxTime, bestPace, raceDone, streak, fullWeeks };
}

function currentWeek() {
  const diff = Math.floor((Date.now() - START_DATE.getTime()) / (7 * 864e5));
  return Math.min(TOTAL_WEEKS, Math.max(1, diff + 1));
}

/* ================================================================== *
 *  Rendering
 * ================================================================== */
const $ = (id) => document.getElementById(id);

function animateCount(el, to, suffix = "") {
  const dur = 700, t0 = performance.now();
  const dec = to % 1 !== 0;
  function step(t) {
    const k = Math.min(1, (t - t0) / dur);
    const v = to * (1 - Math.pow(1 - k, 3));
    el.textContent = (dec ? v.toFixed(1) : Math.round(v)) + suffix;
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function renderHero(stats) {
  $("runnerName").textContent = RUNNER;
  $("goalText").textContent = GOAL;
  const pct = Math.round((stats.done / stats.total) * 100);
  $("ringPct").textContent = `${pct}%`;
  const r = 52, c = 2 * Math.PI * r;
  const fg = $("ringFg");
  fg.style.strokeDasharray = c;
  fg.style.strokeDashoffset = c;
  requestAnimationFrame(() => { fg.style.strokeDashoffset = c * (1 - pct / 100); });
  const mottos = CONFIG.mottos || ["Zet 'm op, strijder!", "Lekker bezig, strijder!", "Je bouwt 'm rustig op, strijder.", "Halverwege — knap volgehouden! ⚡", "Bijna race-klaar, strijder!", "Finisher! Wat een prestatie, strijder. 🏅"];
  $("heroMotto").textContent =
    stats.raceDone ? mottos[5] : pct >= 80 ? mottos[4] : pct >= 50 ? mottos[3] : pct >= 20 ? mottos[2] : pct > 0 ? mottos[1] : mottos[0];
  renderCountdown();
}

function raceInfo() {
  const rw = PLAN.find((w) => w.race || w.tuneup || w.finish) || PLAN[PLAN.length - 1];
  const rs = rw.sessions[rw.sessions.length - 1];
  const off = DAY_OFFSET[rs.day] ?? 6;
  const date = new Date(START_DATE.getTime() + ((rw.week - 1) * 7 + off) * 864e5);
  const days = Math.round((date.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 864e5);
  return { days, name: rs.title.replace(/^[^\p{L}\d]+/u, "").trim() };
}
function renderCountdown() {
  const motto = $("heroMotto");
  if (!motto) return;
  let el = $("raceCountdown");
  if (!el) {
    el = document.createElement("p");
    el.id = "raceCountdown";
    el.className = "hero-countdown";
    motto.after(el);
  }
  const { days, name } = raceInfo();
  const wks = Math.round(days / 7), mon = Math.round(days / 30);
  el.textContent =
    days > 180 ? `🗓️ jouw grote doel: over ~${mon} maanden — ${name}` :
    days > 14 ? `🗓️ nog ${wks} weken tot je ${name}` :
    days > 1 ? `🗓️ nog ${days} dagen tot je ${name}` :
    days === 1 ? `🗓️ morgen is het zover: ${name}!` :
    days === 0 ? `🔥 vandaag is het zover: ${name}!` :
    `🎉 ${name} volbracht — chapeau!`;
}

function renderStats(stats) {
  animateCount($("statDone"), stats.done);
  animateCount($("statKm"), Math.round(stats.km * 10) / 10, " km");
  animateCount($("statStreak"), stats.streak);
  const cw = currentWeek();
  const wk = PLAN.find((w) => w.week === cw);
  const wkDone = wk.sessions.filter((s) => log[sid(cw, s.day)]?.done).length;
  $("statWeek").textContent = `${wkDone}/${wk.sessions.length}`;
}

function renderNextUp() {
  const cw = currentWeek();
  const next =
    flatSessions.find((s) => s.week >= cw && !log[sid(s.week, s.day)]?.done) ||
    flatSessions.find((s) => !log[sid(s.week, s.day)]?.done);
  const box = $("nextUp");
  if (!next) {
    box.innerHTML = `<div class="nextup-card done"><span class="nextup-eyebrow">🏅 Schema compleet</span><strong>Alles afgevinkt — chapeau, ${RUNNER}!</strong></div>`;
    return;
  }
  const z = zoneByKey[next.zone];
  box.innerHTML = `
    <button class="nextup-card zone-${next.zone}" data-week="${next.week}" data-day="${next.day}">
      <span class="nextup-eyebrow">Volgende training · week ${next.week} · ${next.dayLabel}</span>
      <strong>${next.title}</strong>
      <span class="nextup-meta">${next[UNIT]} ${UNIT_LABEL} · ${z.name}</span>
      <span class="nextup-go">Openen ›</span>
    </button>`;
  box.querySelector(".nextup-card").addEventListener("click", () => openDetail(next.week, next.day));
}

const PLANNING_META = {
  race: {
    icon: "🏁", label: "Tussentijdse race",
    advice: "Laat deze race je lange training vervangen. Houd de training ervoor rustig en plan daarna minimaal één hersteldag.",
  },
  vacation: {
    icon: "🌴", label: "Vakantie",
    advice: "Gemiste trainingen hoef je niet in te halen. Pak bij thuiskomst de eerstvolgende rustige training op.",
  },
  rest: {
    icon: "🩹", label: "Rust / blessure",
    advice: "Herstel gaat voor het schema. Hervat pas pijnvrij en bouw de eerste week extra rustig op.",
  },
};

function formatPlanDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

function renderPlanning() {
  const list = $("planningList");
  if (!list) return;
  const entries = [...planningEntries()].sort((a, b) => a.start.localeCompare(b.start));
  if (!entries.length) {
    list.innerHTML = `<div class="planning-empty"><span>🗓️</span><p>Nog niets gepland. Voeg een vakantie of oefenwedstrijd toe zodra je die weet.</p></div>`;
    return;
  }
  list.innerHTML = entries.map((entry) => {
    const meta = PLANNING_META[entry.type] || PLANNING_META.rest;
    const period = entry.end && entry.end !== entry.start
      ? `${formatPlanDate(entry.start)} – ${formatPlanDate(entry.end)}`
      : formatPlanDate(entry.start);
    return `<article class="planning-item plan-${entry.type}">
      <span class="planning-icon">${meta.icon}</span>
      <div class="planning-copy">
        <span class="planning-type">${meta.label} · ${period}</span>
        <strong>${escapeHtml(entry.title)}</strong>
        ${entry.note ? `<p>${escapeHtml(entry.note)}</p>` : ""}
        <p class="planning-advice"><b>Coachadvies:</b> ${meta.advice}</p>
      </div>
      <button class="planning-remove" type="button" data-plan-id="${escapeHtml(entry.id)}" aria-label="${escapeHtml(entry.title)} verwijderen">×</button>
    </article>`;
  }).join("");
  list.querySelectorAll(".planning-remove").forEach((button) => {
    button.addEventListener("click", () => {
      log.__planning = planningEntries().filter((entry) => entry.id !== button.dataset.planId);
      saveLog();
      renderAll();
      toast("Uit je planning verwijderd");
    });
  });
}

function renderZones() {
  $("zonesList").innerHTML = ZONES.map((z) => `
    <div class="zone-row zone-${z.key}">
      <span class="zone-dot"></span>
      <div class="zone-main"><strong>${z.name}</strong><span>${z.info}</span></div>
      <span class="zone-pace">${z.pace}${ZONE_SUFFIX ? `<small>${ZONE_SUFFIX}</small>` : ""}</span>
    </div>`).join("");
}

function renderChart() {
  const cwBar = currentWeek();
  const max = Math.max(...PLAN.map((w) => w.sessions.reduce((n, s) => n + s[UNIT], 0)));
  $("volumeChart").innerHTML = PLAN.map((w) => {
    const planned = w.sessions.reduce((n, s) => n + s[UNIT], 0);
    const doneMin = w.sessions.reduce((n, s) => n + (log[sid(w.week, s.day)]?.done ? s[UNIT] : 0), 0);
    const h = Math.round((planned / max) * 100);
    const fill = planned ? Math.round((doneMin / planned) * 100) : 0;
    const cls = ((w.race || w.tuneup || w.finish) ? "is-race" : w.recovery ? "is-rest" : "") + (w.week === cwBar ? " is-now" : "");
    return `
      <div class="bar ${cls}" title="Week ${w.week}: ${planned} ${UNIT_LABEL} gepland">
        <div class="bar-track" style="height:${h}%">
          <div class="bar-fill" style="height:${fill}%"></div>
        </div>
        <span class="bar-x">${w.week}</span>
      </div>`;
  }).join("");
}

function tagOf(w) {
  if (w.finish) return `<span class="week-tag tag-race">Finale</span>`;
  if (w.race) return `<span class="week-tag tag-race">Raceweek</span>`;
  if (w.tuneup) return `<span class="week-tag tag-tuneup">10 km race</span>`;
  if (w.recovery) return `<span class="week-tag tag-rest">Herstel</span>`;
  if (w.taper) return `<span class="week-tag tag-taper">Taper</span>`;
  return "";
}

function renderWeeks() {
  const cw = currentWeek();
  const todayIso = isoDate(new Date());
  let html = "", lastPhase = "";
  PLAN.forEach((w, i) => {
    if (w.phase !== lastPhase) { html += `<h4 class="sub-phase reveal">${w.phase}</h4>`; lastPhase = w.phase; }
    const sess = w.sessions.map((s) => {
      const e = log[sid(w.week, s.day)] || {};
      const z = zoneByKey[s.zone];
      const pace = fmtPace(paceSeconds(e.distance, e.time));
      const bits = [];
      if (e.distance) bits.push(`${e.distance} km`);
      if (pace) bits.push(pace);
      if (e.hr) bits.push(`${e.hr} bpm`);
      const logged = bits.length ? `<span class="session-logged">📊 ${bits.join(" · ")}</span>` : "";
      const lastDay = w.sessions[w.sessions.length - 1].day;
      const isRaceSession = (w.race || w.tuneup || w.finish) && s.day === lastDay;
      const isToday = isoDate(sessionDate(w.week, s.day)) === todayIso;
      const raceKicker = isRaceSession
        ? `<span class="session-race-kicker">${w.raceLabel || (w.race ? "🏅 Doelrace" : w.tuneup ? "🏁 Wedstrijd" : "🏁 Finale")}</span>`
        : "";
      return `
        <button class="session zone-${s.zone} ${isRaceSession ? "is-race-session" : ""} ${e.done ? "is-done" : ""} ${isToday ? "is-today" : ""}" data-week="${w.week}" data-day="${s.day}">
          <span class="session-day">${isRaceSession ? "<small>🏁</small>" : ""}${s.dayLabel.slice(0, 2)}</span>
          <span class="session-body">
            ${raceKicker}
            <span class="session-title">${s.title}${isToday ? ' <span class="today-badge">Vandaag</span>' : ""}</span>
            <span class="session-meta">${s[UNIT]} ${UNIT_LABEL} · ${s.kind}</span>
            ${logged}
          </span>
          <span class="session-check">${e.done ? "✓" : ""}</span>
        </button>`;
    }).join("");
    const weekPlans = planningForWeek(w.week);
    const planStrip = weekPlans.length ? `<div class="week-planning">${weekPlans.map((entry) => {
      const meta = PLANNING_META[entry.type] || PLANNING_META.rest;
      return `<span>${meta.icon} ${escapeHtml(entry.title)}</span>`;
    }).join("")}</div>` : "";
    html += `
      <article class="week-card reveal ${w.tuneup ? "is-tuneup-week" : ""} ${w.race ? "is-goal-race-week" : ""} ${w.week === cw ? "is-current" : ""} ${w.week < cw ? (w.sessions.every((x) => log[sid(w.week, x.day)]?.done) ? "is-complete" : "is-missed") : ""}" style="--i:${i % 4}">
        <header class="week-head">
          <div><span class="week-no">Week ${w.week}</span><span class="week-dates">${w.dates}</span></div>
          ${w.week === cw ? `<span class="week-tag tag-now">Nu</span>` : w.week < cw ? (w.sessions.every((x) => log[sid(w.week, x.day)]?.done) ? `<span class="week-tag tag-done">✓ af</span>` : `<span class="week-tag tag-missed">gemist</span>`) : tagOf(w)}
        </header>
        ${planStrip}
        <div class="session-list">${sess}</div>
      </article>`;
  });
  $("weeksList").innerHTML = html;
  $("weeksList").querySelectorAll(".session").forEach((b) =>
    b.addEventListener("click", () => openDetail(+b.dataset.week, b.dataset.day)));
  observeReveals();
}

function renderBadges(stats) {
  $("badgeGrid").innerHTML = BADGES.map((b) => {
    const got = b.test(stats);
    return `
      <div class="badge ${got ? "got" : "locked"}" title="${b.desc}">
        <span class="badge-icon">${got ? b.icon : "🔒"}</span>
        <strong>${b.name}</strong>
        <span class="badge-desc">${b.desc}</span>
      </div>`;
  }).join("");
}

function renderInfo() {
  $("infoList").innerHTML = INFO.map((c, i) => `
    <article class="info-card reveal" style="--i:${i}">
      <span class="info-icon">${c.icon}</span>
      <h4>${c.title}</h4>
      <ul>${c.items.map((t) => `<li>${t}</li>`).join("")}</ul>
    </article>`).join("");
}

function addJumpButton() {
  const head = document.querySelector(".weeks .phase-head");
  if (!head || document.getElementById("jumpNow")) return;
  const btn = document.createElement("button");
  btn.id = "jumpNow";
  btn.type = "button";
  btn.className = "jump-now";
  btn.textContent = "Naar deze week ↓";
  btn.addEventListener("click", () =>
    document.querySelector(".week-card.is-current")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  head.insertAdjacentElement("afterend", btn);
}

/* ----- Extra's: begroeting, records, consistentie ------------------- */
function greetingWord() {
  const h = new Date().getHours();
  return h < 6 ? "Goedenacht" : h < 12 ? "Goedemorgen" : h < 18 ? "Goedemiddag" : "Goedenavond";
}
function renderGreeting() {
  const copy = document.querySelector(".hero-copy");
  if (!copy) return;
  let el = document.getElementById("heroGreeting");
  if (!el) {
    el = document.createElement("p");
    el.id = "heroGreeting";
    el.className = "hero-greeting";
    copy.insertBefore(el, copy.firstChild);
  }
  el.textContent = `${greetingWord()}, ${RUNNER.split(" ")[0]} 👋`;
}
function renderRecords(stats) {
  const anchor = document.querySelector(".weeks");
  if (!anchor) return;
  let sec = document.getElementById("recordsPanel");
  if (!sec) {
    sec = document.createElement("section");
    sec.id = "recordsPanel";
    sec.className = "panel reveal";
    anchor.parentNode.insertBefore(sec, anchor);
  }
  const pace = fmtPace(stats.bestPace);
  const longest = UNIT === "min"
    ? (stats.maxTime ? `${Math.round(stats.maxTime / 60)} min` : "—")
    : (stats.maxDist ? `${stats.maxDist} km` : "—");
  const rows = [
    ["⚡ Snelste tempo", pace || "—"],
    [UNIT === "min" ? "⏱️ Langste loop" : "🏔️ Verste loop", longest],
    ["📊 Totaal gelopen", `${Math.round(stats.km * 10) / 10} km`],
    ["🔥 Langste reeks", String(stats.streak)],
  ];
  sec.innerHTML = `<h3 class="panel-head">Jouw records</h3>
    <div class="records">${rows.map(([l, v]) =>
      `<div class="record"><span class="record-val">${v}</span><span class="record-label">${l}</span></div>`).join("")}</div>`;
}
function renderConsistency() {
  const grid = document.querySelector(".stats-grid");
  if (!grid) return;
  let sec = document.getElementById("consistencyStrip");
  if (!sec) {
    sec = document.createElement("section");
    sec.id = "consistencyStrip";
    sec.className = "consistency reveal";
    grid.parentNode.insertBefore(sec, grid.nextSibling);
  }
  const todayIso = isoDate(new Date());
  const dots = flatSessions.map((s) => {
    const done = log[sid(s.week, s.day)]?.done;
    const past = isoDate(sessionDate(s.week, s.day)) < todayIso;
    const cls = done ? "is-done" : past ? "is-missed" : "is-todo";
    return `<span class="cdot ${cls}" title="Week ${s.week}"></span>`;
  }).join("");
  sec.innerHTML = `<div class="consistency-head"><span>Consistentie</span><span class="consistency-sub">afgerond · gemist · komt nog</span></div><div class="cdots">${dots}</div>`;
}

function renderAll() {
  const stats = computeStats();
  renderHero(stats);
  renderStats(stats);
  renderGreeting();
  renderConsistency();
  renderNextUp();
  renderPlanning();
  renderChart();
  renderZones();
  renderWeeks();
  addJumpButton();
  renderBadges(stats);
  renderRecords(stats);
  renderInfo();
  observeReveals();
}

/* ----- Detailweergave ------------------------------------------------ */
function openDetail(week, day) {
  const w = PLAN.find((x) => x.week === week);
  const s = w.sessions.find((x) => x.day === day);
  const id = sid(week, day);
  const e = log[id] || {};
  const z = zoneByKey[s.zone];
  const enteredTime = durationParts(e.time);

  $("detailTitle").textContent = `Week ${week} · ${s.dayLabel}`;
  $("detailBody").innerHTML = `
    <div class="detail-hero zone-${s.zone}">
      <span class="detail-kind">${s.kind} · ${s[UNIT]} ${UNIT_LABEL}</span>
      <h2>${s.title}</h2>
      <p class="detail-goal">${s.goal}</p>
      <span class="detail-zone">${z.name} · ${z.info}</span>
    </div>

    <div class="coach-bubble">
      <div class="coach-ava">
        <img src="${CONFIG.coachPhoto}" alt="${CONFIG.coachName}" onerror="this.style.display='none'">
        <span>${COACH_INITIAL}</span>
      </div>
      <div class="coach-text">
        <strong>${CONFIG.coachName} <span class="coach-handle">${CONFIG.coachHandle}</span></strong>
        <p>${coachLine(s.zone)}</p>
      </div>
    </div>

    <section class="detail-block why">
      <h4>${w.race || w.tuneup ? "Waarom deze wedstrijd" : "Waarom deze training"}</h4>
      <p>${s.why || WHY[s.zone] || ""}</p>
    </section>

    <section class="detail-block">
      <h4>Opbouw</h4>
      <ol class="block-list">${s.blocks.map((b) => `<li>${b}</li>`).join("")}</ol>
    </section>

    <section class="detail-block">
      <h4>${w.race || w.tuneup ? "Invullen na de wedstrijd" : "Invullen na de training"}</h4>
      <div class="form-grid">
        <label>Afstand (km)
          <input id="fDistance" type="text" inputmode="decimal" placeholder="bv. 6,2" value="${escapeHtml(e.distance ?? "")}">
        </label>
        <label>Tijd
          <span class="duration-input">
            <input id="fTimeMinutes" type="number" inputmode="numeric" min="0" max="999" placeholder="36" value="${enteredTime.minutes || ""}" aria-label="Minuten">
            <span>min</span>
            <input id="fTimeSeconds" type="number" inputmode="numeric" min="0" max="59" placeholder="30" value="${enteredTime.seconds || ""}" aria-label="Seconden">
            <span>sec</span>
          </span>
        </label>
        <label class="full">Gemiddeld tempo
          <output id="fPace" class="pace-out">${fmtPace(paceSeconds(e.distance, e.time)) || "—"}</output>
        </label>
        <label>Hartslag (bpm)
          <input id="fHr" type="number" inputmode="numeric" placeholder="bv. 152" value="${escapeHtml(e.hr ?? "")}">
        </label>
        <label>Gevoel / zwaarte
          <select id="fFeel">
            ${["", "1 · heel licht", "2 · licht", "3 · prima", "4 · pittig", "5 · zwaar"]
              .map((o) => `<option value="${o}" ${String(e.feel ?? "") === o ? "selected" : ""}>${o || "Kies…"}</option>`).join("")}
          </select>
        </label>
        <label class="full">Notitie
          <textarea id="fNote" rows="2" placeholder="Hoe ging het?">${escapeHtml(e.note ?? "")}</textarea>
        </label>
      </div>
    </section>

    <div class="detail-actions">
      <button id="toggleDone" class="btn-primary ${e.done ? "is-done" : ""}">${e.done ? "✓ Gedaan" : "Markeer als gedaan"}</button>
      <button id="saveSession" class="btn-ghost">Opslaan</button>
    </div>`;

  const readTime = () => {
    if (!$("fTimeMinutes").value && !$("fTimeSeconds").value) return "";
    return durationValue($("fTimeMinutes").value, $("fTimeSeconds").value);
  };
  const recalc = () => ($("fPace").textContent = fmtPace(paceSeconds($("fDistance").value, readTime())) || "—");
  $("fDistance").addEventListener("input", recalc);
  $("fTimeMinutes").addEventListener("input", recalc);
  $("fTimeSeconds").addEventListener("input", () => {
    if (+$("fTimeSeconds").value > 59) $("fTimeSeconds").value = "59";
    recalc();
  });

  const collect = () => ({
    ...log[id],
    distance: $("fDistance").value.trim(),
    time: readTime(),
    hr: $("fHr").value.trim(),
    feel: $("fFeel").value,
    note: $("fNote").value.trim(),
  });

  $("saveSession").addEventListener("click", () => {
    log[id] = collect(); saveLog();
    toast("Opgeslagen 💾");
    closeDetail();
  });
  $("toggleDone").addEventListener("click", () => {
    const cur = collect();
    cur.done = !cur.done;
    log[id] = cur; saveLog();
    if (cur.done) {
      celebrate();
      toast(w.finish ? "🌞 Zomer rond! Wat een strijder!" : w.race ? "🏅 Finisher! Wat een prestatie, strijder!" : w.tuneup ? "🏁 Wedstrijd voltooid — sterk gepacet!" : DONE[Math.floor(Math.random() * DONE.length)]);
    }
    closeDetail();
  });

  showView("detail");
}

function closeDetail() { renderAll(); showView("list"); }

function showView(name) {
  const list = $("listView"), detail = $("detailView"), back = $("backButton");
  if (name === "detail") {
    list.classList.add("hidden");
    detail.classList.remove("hidden");
    requestAnimationFrame(() => detail.classList.add("is-in"));
    back.classList.remove("hidden");
    window.scrollTo(0, 0);
  } else {
    detail.classList.remove("is-in");
    back.classList.add("hidden");
    setTimeout(() => {
      detail.classList.add("hidden");
      list.classList.remove("hidden");
      window.scrollTo(0, 0);
    }, 280);
  }
}

/* ----- Invliegende beelden -------------------------------------------- */
let io, initialRevealDone = false;
function observeReveals() {
  // Na de eerste keer: nieuw getekende blokken meteen tonen (geen her-animatie bij navigeren)
  if (initialRevealDone) {
    document.querySelectorAll(".reveal:not(.in)").forEach((el) => el.classList.add("in"));
    return;
  }
  io = io || new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
}

/* ----- Toast ----------------------------------------------------------- */
let toastT;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ----- Confetti --------------------------------------------------------- */
function celebrate() {
  const cv = $("confetti");
  const ctx = cv.getContext("2d");
  cv.width = innerWidth; cv.height = innerHeight;
  const cs = getComputedStyle(document.documentElement);
  const colors = ["--volt", "--flame", "--pastel-blue", "--violet"]
    .map((v) => cs.getPropertyValue(v).trim()).filter(Boolean).concat("#ffffff");
  const parts = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2, y: innerHeight / 3,
    vx: (Math.random() - 0.5) * 14, vy: Math.random() * -16 - 4,
    s: Math.random() * 7 + 4, c: colors[(Math.random() * colors.length) | 0],
    r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
  }));
  let frame = 0;
  (function loop() {
    frame++;
    ctx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach((p) => {
      p.vy += 0.45; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
      ctx.restore();
    });
    if (frame < 120) requestAnimationFrame(loop);
    else ctx.clearRect(0, 0, cv.width, cv.height);
  })();
}

/* ================================================================== *
 *  Init
 * ================================================================== */
/* Branding uit CONFIG zetten (zodat templaten makkelijk is) */
document.title = `${CONFIG.appName} — ${CONFIG.coachHandle}`;
if ($("appName")) $("appName").textContent = CONFIG.appName;
if ($("brandHandle")) $("brandHandle").textContent = CONFIG.coachHandle;
if ($("footCredit")) {
  $("footCredit").innerHTML =
    `<span class="catch">${CONFIG.catchphrase}</span>` +
    `Coaching door ${CONFIG.coachName} · TikTok <strong>${CONFIG.coachHandle}</strong> ${CONFIG.footEmoji || "🏃\u200d♀️"}`;
}

function setPlanningForm(open) {
  const form = $("planningForm");
  const toggle = $("togglePlanningForm");
  form.classList.toggle("hidden", !open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.textContent = open ? "× Sluiten" : "＋ Toevoegen";
  if (open && !$("planStart").value) $("planStart").value = isoDate(new Date());
}

$("togglePlanningForm").addEventListener("click", () => {
  setPlanningForm($("planningForm").classList.contains("hidden"));
});
$("cancelPlanning").addEventListener("click", () => setPlanningForm(false));
$("planningForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const start = $("planStart").value;
  const end = $("planEnd").value || start;
  if (end < start) {
    toast("De einddatum ligt vóór de startdatum");
    return;
  }
  const entry = {
    id: `plan-${Date.now()}`,
    type: $("planType").value,
    title: $("planTitle").value.trim(),
    start,
    end,
    note: $("planNote").value.trim(),
  };
  log.__planning = [...planningEntries(), entry];
  saveLog();
  $("planningForm").reset();
  setPlanningForm(false);
  renderAll();
  toast("Toegevoegd aan je schema 🗓️");
});

$("backButton").addEventListener("click", closeDetail);
$("resetButton").addEventListener("click", () => {
  if (confirm("Alle ingevulde voortgang wissen?")) { log = {}; saveLog(); renderAll(); toast("Voortgang gewist"); }
});

/* ----- Back-up: exporteren / importeren ------------------------------- */
function downloadJSON(filename, obj) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }));
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function downloadText(filename, text, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function icsEscape(value) {
  return String(value || "")
    .replaceAll("\\", "\\\\")
    .replaceAll(/\r?\n/g, "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function icsDay(value) {
  const date = typeof value === "string" ? new Date(`${value}T12:00:00`) : value;
  return isoDate(date).replaceAll("-", "");
}

function addDays(value, amount) {
  const date = typeof value === "string" ? new Date(`${value}T12:00:00`) : new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

function calendarFile() {
  const stamp = new Date().toISOString().replaceAll(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "PRODID:-//bartlopen//Run Coach//NL",
    `X-WR-CALNAME:${icsEscape(CONFIG.appName)} · ${icsEscape(RUNNER)}`,
  ];
  flatSessions.forEach((session) => {
    const date = sessionDate(session.week, session.day);
    const z = zoneByKey[session.zone];
    lines.push(
      "BEGIN:VEVENT",
      `UID:${sid(session.week, session.day)}-${icsDay(date)}@bartlopen.nl`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDay(date)}`,
      `DTEND;VALUE=DATE:${icsDay(addDays(date, 1))}`,
      `SUMMARY:${icsEscape(`${CONFIG.footEmoji || "🏃\u200d♀️"} ${session.title}`)}`,
      `DESCRIPTION:${icsEscape(`${session[UNIT]} ${UNIT_LABEL} · ${z.name}\n${session.goal}\n\n${session.blocks.join("\n")}`)}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  });
  planningEntries().forEach((entry) => {
    const meta = PLANNING_META[entry.type] || PLANNING_META.rest;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${icsEscape(entry.id)}@bartlopen.nl`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDay(entry.start)}`,
      `DTEND;VALUE=DATE:${icsDay(addDays(entry.end || entry.start, 1))}`,
      `SUMMARY:${icsEscape(`${meta.icon} ${entry.title}`)}`,
      `DESCRIPTION:${icsEscape(`${entry.note ? `${entry.note}\n\n` : ""}Coachadvies: ${meta.advice}`)}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
$("exportBtn").addEventListener("click", () => {
  downloadJSON(`${CONFIG.appName.replace(/\s+/g, "-")}-voortgang.json`, {
    app: "bartlopen-runcoach", storeKey: STORE_KEY, runner: RUNNER,
    exportedAt: new Date().toISOString(), log,
  });
  toast("Back-up opgeslagen ⬇︎");
});
$("importBtn").addEventListener("click", () => $("importFile").click());
$("importFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const incoming = data && data.log ? data.log : data;
      if (!incoming || typeof incoming !== "object") throw new Error("ongeldig");
      log = { ...log, ...incoming };
      saveLog(); renderAll();
      toast("Back-up geladen ⬆︎ — welkom terug!");
    } catch {
      toast("Kon dit bestand niet lezen");
    }
    e.target.value = "";
  };
  reader.readAsText(file);
});

$("calendarBtn").addEventListener("click", () => {
  downloadText(`${CONFIG.appName.replace(/\s+/g, "-")}-schema.ics`, calendarFile(), "text/calendar;charset=utf-8");
  toast("Agenda-bestand staat klaar 🗓️");
});

$("pdfBtn").addEventListener("click", () => {
  document.body.classList.add("print-schema");
  const cleanup = () => document.body.classList.remove("print-schema");
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
  setTimeout(cleanup, 1500);
});

/* Alles tekenen */
renderAll();
/* Na de intro-animatie geen her-fade meer; failsafe die alles zeker toont */
setTimeout(() => { initialRevealDone = true; }, 900);
setTimeout(() => document.querySelectorAll(".reveal:not(.in)").forEach((el) => el.classList.add("in")), 1600);

/* Intro-splash netjes weg laten faden (tikken slaat 'm over) */
(function () {
  const splash = $("splash");
  if (!splash) return;
  const hide = () => splash.classList.add("gone");
  setTimeout(hide, 1100);
  splash.addEventListener("click", hide);
  setTimeout(() => splash.remove(), 1700);
})();

/* Service worker voor offline gebruik (alleen op http/https, niet via file://) */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
